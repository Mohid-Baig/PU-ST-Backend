import HelpBoardPost from "../models/helpBoardSchemma.js";

export const createHelpBoardPost = async (req, res) => {
    try {
        const { title, message, isAnonymous } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required." });
        }

        const newPost = new HelpBoardPost({
            title,
            message,
            postedBy: isAnonymous ? null : req.user._id,
            isAnonymous: isAnonymous || false
        });

        await newPost.save();
        res.status(201).json({ message: "Help board post created successfully.", post: newPost });
    } catch (error) {
        console.error("Error creating help board post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllHelpBoardPosts = async (req, res) => {
    try {
        const posts = await HelpBoardPost.find({ status: 'active' })
            .populate('postedBy', 'fullName profileImageUrl')
            .populate('replies.user', 'fullName profileImageUrl')
            .sort({ createdAt: -1 })
            .lean(); // makes the result plain JS objects so we can add custom fields

        const enrichedPosts = posts.map(post => ({
            ...post,
            likeCount: post.likes.length,
            likedByMe: post.likes.some(
                id => id.toString() === req.user._id.toString()
            )
        }));

        res.status(200).json({
            message: "Posts retrieved successfully.",
            posts: enrichedPosts
        });
    } catch (error) {
        console.error("Error retrieving posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const likeHelpBoardPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await HelpBoardPost.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        const alreadyLiked = post.likes.includes(req.user._id);

        if (alreadyLiked) {
            post.likes = post.likes.filter(
                userId => userId.toString() !== req.user._id.toString()
            );
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();

        const likeCount = post.likes.length;
        const likedByMe = post.likes.some(
            id => id.toString() === req.user._id.toString()
        );

        res.status(200).json({
            message: alreadyLiked ? "Post unliked." : "Post liked.",
            post: {
                _id: post._id,
                likeCount,
                likedByMe
            }
        });
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const addReplyToHelpBoardPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Reply message is required." });
        }

        const post = await HelpBoardPost.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        post.replies.push({
            user: req.user._id,
            message
        });

        await post.save();
        res.status(200).json({ message: "Reply added successfully.", post });
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateHelpBoardStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['active', 'flagged', 'deleted'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const post = await HelpBoardPost.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can update post status." });
        }

        post.status = status;
        await post.save();

        res.status(200).json({ message: `Post status updated to ${status}.`, post });
    } catch (error) {
        console.error("Error updating post status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
