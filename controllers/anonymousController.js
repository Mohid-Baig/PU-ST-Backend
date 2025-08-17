import AnonymousConfession from "../models/anonymousConfessSchemma.js";
import { sendNotification } from "../services/notificationService.js";
import User from "../models/userSchemma.js";


export const createConfession = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Message is required." });
        }

        const confession = new AnonymousConfession({
            message,
            postedBy: req.user._id,
            isAnonymous: true
        });

        await confession.save();

        res.status(201).json({
            message: "Confession posted successfully.",
            confession: {
                _id: confession._id,
                message: confession.message,
                createdAt: confession.createdAt,
                likes: [],
                replies: []
            }
        });
    } catch (error) {
        console.error("Error creating confession:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllConfessions = async (req, res) => {
    try {
        const confessions = await AnonymousConfession.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .select("-postedBy -reports");

        res.status(200).json({ confessions });
    } catch (error) {
        console.error("Error retrieving confessions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likeConfession = async (req, res) => {
    try {
        const { id } = req.params;
        const confession = await AnonymousConfession.findById(id);

        if (!confession) {
            return res.status(404).json({ message: "Confession not found." });
        }

        const alreadyLiked = confession.likes.includes(req.user._id);

        if (alreadyLiked) {
            confession.likes = confession.likes.filter(
                uid => uid.toString() !== req.user._id.toString()
            );
        } else {
            confession.likes.push(req.user._id);

            if (confession.postedBy && confession.postedBy.toString() !== req.user._id.toString()) {
                const owner = await User.findById(confession.postedBy);
                if (owner?.fcmToken) {
                    await sendNotification(
                        owner.fcmToken,
                        "Someone liked your confession",
                        "Your anonymous confession got a new like!"
                    );
                }
            }
        }

        await confession.save();

        res.status(200).json({
            message: alreadyLiked ? "Unliked." : "Liked.",
            likesCount: confession.likes.length
        });
    } catch (error) {
        console.error("Error liking confession:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const reportConfession = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const confession = await AnonymousConfession.findById(id);
        if (!confession) {
            return res.status(404).json({ message: "Confession not found." });
        }

        confession.isReported = true;
        confession.reports.push({
            user: req.user._id,
            reason
        });

        await confession.save();

        const admins = await User.find({ role: "admin", fcmToken: { $exists: true, $ne: "" } });
        for (const admin of admins) {
            await sendNotification(
                admin.fcmToken,
                "Confession Reported",
                `A confession has been reported for: ${reason || "No reason provided"}`
            );
        }

        res.status(200).json({ message: "Confession reported successfully." });
    } catch (error) {
        console.error("Error reporting confession:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
