import Feedback from "../models/feedbackSchemma.js";
import { sendNotification } from "../services/notificationService.js";

export const createFeedback = async (req, res) => {
    try {
        const { title, description, category, location } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required." });
        }

        const feedback = new Feedback({
            title,
            description,
            category: category || 'suggestion',
            location: location || '',
            submittedBy: req.user._id
        });

        await feedback.save();

        res.status(201).json({
            message: "Feedback submitted successfully.",
            feedback
        });
    } catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllFeedback = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== "admin") {
            query.submittedBy = req.user._id;
        }

        const feedbacks = await Feedback.find(query)
            .populate("submittedBy", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Feedback retrieved successfully.",
            feedbacks
        });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await Feedback.findById(id);

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found." });
        }

        if (
            feedback.submittedBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "You do not have permission to delete this feedback." });
        }

        await Feedback.findByIdAndDelete(id);

        res.status(200).json({ message: "Feedback deleted successfully." });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminRemarks } = req.body;

        const allowedStatuses = ['pending', 'reviewed', 'resolved', 'rejected'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const feedback = await Feedback.findById(id).populate("submittedBy", "fullName fcmToken");
        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found." });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can update status." });
        }

        feedback.status = status;
        feedback.adminRemarks = adminRemarks || "";
        await feedback.save();

        if (feedback.submittedBy?.fcmToken) {
            await sendNotification({
                token: feedback.submittedBy.fcmToken,
                title: "Feedback Status Updated",
                body: `Your feedback "${feedback.title}" has been marked as ${status}.`
            });
        }

        res.status(200).json({
            message: `Feedback status updated to ${status}.`,
            feedback
        });
    } catch (error) {
        console.error("Error updating feedback status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
