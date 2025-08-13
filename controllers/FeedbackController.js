import Feedback from "../models/feedbackSchemma.js";

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
