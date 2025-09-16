import EventNotification from "../models/eventnotificationScheema.js";
import { sendNotification } from "../services/notificationService.js";
import nodemailer from "nodemailer";
import User from "../models/userSchemma.js";

export const registerDeviceToken = async (req, res) => {
    try {
        console.log("Register token request:", {
            user: req.user,
            body: req.body,
            headers: req.headers.authorization
        });

        const userId = req.user?.id || req.user?._id;;
        const { token } = req.body;

        if (!req.user) {
            console.log("No user found in request");
            return res.status(401).json({ message: "User not authenticated - no user in request" });
        }

        if (!userId) {
            console.log("No userId found");
            return res.status(401).json({ message: "User ID not found in request" });
        }

        if (!token) {
            console.log("No token provided in request body");
            return res.status(400).json({ message: "FCM token is required" });
        }

        if (typeof token !== 'string' || token.length < 10) {
            console.log("Invalid token format:", token);
            return res.status(400).json({ message: "Invalid FCM token format" });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found in database:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Found user:", user._id || user.id, "Current tokens:", user.fcmTokens?.length || 0);

        if (!user.fcmTokens) {
            user.fcmTokens = [];
        }

        const tokenExists = user.fcmTokens.some(existingToken =>
            existingToken.toLowerCase() === token.toLowerCase()
        );

        if (!tokenExists) {
            user.fcmTokens.push(token);
            console.log("Added new token, total tokens:", user.fcmTokens.length);
        } else {
            console.log("Token already exists, skipping");
        }

        try {
            await user.save();
            console.log("User saved successfully");
        } catch (saveError) {
            console.error("Error saving user:", saveError);
            return res.status(500).json({ message: "Failed to save FCM token" });
        }

        res.status(200).json({
            message: "FCM token registered successfully",
            tokenCount: user.fcmTokens.length
        });

    } catch (err) {
        console.error("registerDeviceToken error:", err);
        res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
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
            createdBy: req.user._id || req.user.id,
        });
        await event.save();

        const students = await User.find({ role: "student" }, "fcmToken fcmTokens email fullName");
        console.log(`Found ${students.length} students for notification`);

        let notificationsSent = 0;
        let emailsSent = 0;

        for (const student of students) {
            const tokens = [];

            if (student.fcmTokens && Array.isArray(student.fcmTokens)) {
                tokens.push(...student.fcmTokens);
            }

            if (student.fcmToken && !tokens.includes(student.fcmToken)) {
                tokens.push(student.fcmToken);
            }

            for (const token of tokens) {
                if (token && typeof token === 'string' && token.length > 10) {
                    try {
                        await sendNotification({
                            token,
                            title,
                            body: "Tap for more info",
                            data: {
                                type: "event",
                                eventId: event._id.toString()
                            }
                        });
                        notificationsSent++;
                    } catch (notificationError) {
                        console.error(`Failed to send notification to ${student.email}:`, notificationError);
                    }
                }
            }
        }

        try {
            const transporter = nodemailer.createTransporter({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const validEmails = students
                .filter(s => s.email && s.email.includes('@'))
                .map(s => s.email);

            if (validEmails.length > 0) {
                const mailOptions = {
                    from: `"Campus App" <${process.env.EMAIL_USER}>`,
                    to: validEmails.join(","),
                    subject: `Event: ${title}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">${title}</h2>
                            <p style="color: #666; line-height: 1.6;">${description}</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="color: #999; font-size: 12px;">
                                This is an automated message from Campus App. Please do not reply to this email.
                            </p>
                        </div>
                    `,
                    text: description
                };

                await transporter.sendMail(mailOptions);
                emailsSent = validEmails.length;
            }
        } catch (emailError) {
            console.error("Error sending emails:", emailError);
        }

        res.status(201).json({
            message: "Event notification created successfully",
            event,
            statistics: {
                studentsFound: students.length,
                notificationsSent,
                emailsSent
            }
        });

    } catch (error) {
        console.error("Error creating event notification:", error);
        res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getAllEventNotifications = async (req, res) => {
    try {
        const events = await EventNotification.find()
            .populate("createdBy", "fullName")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Events retrieved successfully.",
            events,
            count: events.length
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getEventNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid event ID format" });
        }

        const event = await EventNotification.findById(id)
            .populate("createdBy", "fullName");

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        res.status(200).json({
            message: "Event retrieved successfully.",
            event
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};