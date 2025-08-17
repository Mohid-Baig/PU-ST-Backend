import LostFound from "../models/lostFoundSchemma.js";
import fs from 'fs';
import path from 'path';
import { sendNotification } from "../services/notificationService.js";
import User from "../models/userSchemma.js";

export const createLostFoundItem = async (req, res) => {
    try {
        const { title, description, type, category, dateLostOrFound, location, contactInfo, collectionInfo, isAnonymous } = req.body;

        if (!title || !description || !type || !location) {
            return res.status(400).json({ message: "Title, description, type, and location are required." });
        }

        if (!['lost', 'found'].includes(type)) {
            return res.status(400).json({ message: "Type must be either 'lost' or 'found'." });
        }

        const photos = req.files?.lostfoundImage?.map(file => file.path) || [];

        const newItem = new LostFound({
            title,
            description,
            type,
            category: category || 'other',
            dateLostOrFound: dateLostOrFound ? new Date(dateLostOrFound) : Date.now(),
            location,
            photos,
            reportedBy: req.user._id,
            contactInfo: contactInfo || '',
            collectionInfo: collectionInfo || '',
            isAnonymous: isAnonymous === 'true',
        });

        await newItem.save();

        res.status(201).json({
            message: "Lost/Found item created successfully.",
            item: newItem
        });
    } catch (error) {
        console.error("Error creating lost/found item:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllLostFoundItems = async (req, res) => {
    try {
        const items = await LostFound.find({
            status: { $ne: 'archived' },
            expiresAt: { $gte: new Date() }
        })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Lost/Found items retrieved successfully.",
            items
        });
    } catch (error) {
        console.error("Error retrieving lost/found items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteLostFoundItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await LostFound.findById(id);
        if (!item) {
            return res.status(404).json({ message: "Lost/Found item not found." });
        }

        if (
            item.reportedBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "You do not have permission to delete this item." });
        }

        if (item.photos && item.photos.length > 0) {
            item.photos.forEach(photoPath => {
                try {
                    const imagePath = path.resolve(photoPath);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                } catch (err) {
                    console.error("Error deleting photo file:", err);
                }
            });
        }

        await LostFound.findByIdAndDelete(id);

        res.status(200).json({ message: "Lost/Found item deleted successfully." });
    } catch (error) {
        console.error("Error deleting lost/found item:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const matchLostAndFoundItems = async (req, res) => {
    try {
        const { lostItemId, foundItemId } = req.body;

        const lostItem = await LostFound.findById(lostItemId);
        const foundItem = await LostFound.findById(foundItemId);

        if (!lostItem || !foundItem) {
            return res.status(404).json({ message: "One or both items not found." });
        }

        if (lostItem.type !== 'lost' || foundItem.type !== 'found') {
            return res.status(400).json({ message: "Invalid item types for matching." });
        }

        lostItem.relatedItem = foundItemId;
        foundItem.relatedItem = lostItemId;

        lostItem.status = 'archived';
        foundItem.status = 'archived';

        await lostItem.save();
        await foundItem.save();

        const lostItemUser = await User.findById(lostItem.reportedBy);
        const foundItemUser = await User.findById(foundItem.reportedBy);

        if (lostItemUser?.fcmToken) {
            await sendNotification(
                lostItemUser.fcmToken,
                "Lost Item Matched",
                `We found a possible match for your lost item: "${lostItem.title}".`
            );
        }

        if (foundItemUser?.fcmToken) {
            await sendNotification(
                foundItemUser.fcmToken,
                "Found Item Matched",
                `We found a possible match for your found item: "${foundItem.title}".`
            );
        }

        res.status(200).json({
            message: "Lost and Found items matched, archived, and users notified successfully.",
            lostItem,
            foundItem
        });

    } catch (error) {
        console.error("Error matching lost and found items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const updateLostFoundStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, relatedItem } = req.body;

        const allowedStatuses = ['claimed', 'returned', 'archived'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const item = await LostFound.findById(id);
        if (!item) {
            return res.status(404).json({ message: "Lost/Found item not found." });
        }

        if (
            item.reportedBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "You do not have permission to update this item." });
        }

        item.status = status;
        if (relatedItem) {
            item.relatedItem = relatedItem;
        }
        await item.save();

        res.status(200).json({
            message: `Item status updated to ${status}.`,
            item
        });

    } catch (error) {
        console.error("Error updating lost/found status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};