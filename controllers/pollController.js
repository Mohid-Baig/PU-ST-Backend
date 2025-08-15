import Poll from "../models/pollsVoteScheema.js";

export const createPoll = async (req, res) => {
    try {
        const { question, options, expiresAt } = req.body;

        if (!question || !options || options.length < 2) {
            return res.status(400).json({ message: "Question and at least 2 options are required." });
        }

        const poll = new Poll({
            question,
            options: options.map(opt => ({ text: opt })),
            createdBy: req.user._id,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });

        await poll.save();
        res.status(201).json({ message: "Poll created successfully.", poll });
    } catch (error) {
        console.error("Error creating poll:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllPolls = async (req, res) => {
    try {
        const polls = await Poll.find({ isActive: true })
            .populate("createdBy", "fullName profileImageUrl")
            .sort({ createdAt: -1 });

        res.status(200).json({ message: "Polls retrieved successfully.", polls });
    } catch (error) {
        console.error("Error retrieving polls:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPollById = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id)
            .populate("createdBy", "fullName profileImageUrl");

        if (!poll) {
            return res.status(404).json({ message: "Poll not found." });
        }

        const hasVoted = poll.votedUsers.some(userId => userId.toString() === req.user._id.toString());

        res.status(200).json({
            message: "Poll retrieved successfully.",
            poll,
            hasVoted
        });
    } catch (error) {
        console.error("Error retrieving poll:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const votePoll = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionIndex } = req.body;

        const poll = await Poll.findById(id);
        if (!poll) {
            return res.status(404).json({ message: "Poll not found." });
        }

        if (!poll.isActive) {
            return res.status(400).json({ message: "Poll is closed." });
        }

        if (poll.votedUsers.includes(req.user._id)) {
            return res.status(400).json({ message: "You have already voted." });
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ message: "Invalid option index." });
        }

        poll.options[optionIndex].votes += 1;
        poll.totalVotes += 1;
        poll.votedUsers.push(req.user._id);

        await poll.save();
        res.status(200).json({ message: "Vote recorded successfully.", poll });
    } catch (error) {
        console.error("Error voting in poll:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deletePoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({ message: "Poll not found." });
        }

        if (poll.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to delete this poll." });
        }

        await Poll.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Poll deleted successfully." });
    } catch (error) {
        console.error("Error deleting poll:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const closePoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({ message: "Poll not found." });
        }

        if (poll.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "You do not have permission to close this poll." });
        }

        poll.isActive = false;
        await poll.save();

        res.status(200).json({ message: "Poll closed successfully.", poll });
    } catch (error) {
        console.error("Error closing poll:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
