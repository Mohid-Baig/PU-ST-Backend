import EventNotification from "../models/eventnotificationScheema.js";
import { sendNotification } from "../services/notificationService.js";
import nodemailer from "nodemailer";
import User from "../models/userSchemma.js";

export const registerDeviceToken = async (req, res) => {
    try {
        const userId = req.user?._id;       // auth middleware must set req.user
        const { token } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!token) return res.status(400).json({ message: "Token is required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // user.fcmToken = token;

        user.fcmTokens = user.fcmTokens || [];
        if (!user.fcmTokens.includes(token)) user.fcmTokens.push(token);

        await user.save();

        res.status(200).json({ message: "Token registered successfully" });
    } catch (err) {
        console.error("registerDeviceToken error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const createEventNotification = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required." });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can send event notifications." });
        }

        const event = new EventNotification({
            title,
            description,
            createdBy: req.user._id
        });
        await event.save();

        const students = await User.find({ role: "student" }, "fcmToken fcmTokens email");

        for (const student of students) {
            const tokens = student.fcmTokens?.length
                ? student.fcmTokens
                : (student.fcmToken ? [student.fcmToken] : []);

            for (const token of tokens) {
                await sendNotification({
                    token,
                    title,
                    body: "Tap for more info",
                    data: {
                        type: "event",
                        eventId: event._id.toString()
                    }
                });
            }
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Campus App" <${process.env.EMAIL_USER}>`,
            to: students.map(s => s.email).join(","),
            subject: `Event: ${title}`,
            text: description
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: "Event notification created and sent successfully (push + email).",
            event
        });

    } catch (error) {
        console.error("Error creating event notification:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const getAllEventNotifications = async (req, res) => {
    try {
        const events = await EventNotification.find()
            .populate("createdBy", "fullName")
            .sort({ createdAt: -1 });

        res.status(200).json({ message: "Events retrieved successfully.", events });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getEventNotificationById = async (req, res) => {
    try {
        const event = await EventNotification.findById(req.params.id)
            .populate("createdBy", "fullName");

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        res.status(200).json({ message: "Event retrieved successfully.", event });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
