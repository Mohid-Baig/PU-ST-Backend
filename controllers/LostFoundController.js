import LostFound from "../models/lostFoundSchemma.js";
import fs from 'fs';
import path from 'path';
import { sendNotification } from "../services/notificationService.js";
import User from "../models/userSchemma.js";
import cloudinary from '../config/cloudinary.js';
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";


// export const createLostFoundItem = async (req, res) => {
//     try {
//         const {
//             title,
//             description,
//             type,
//             category,
//             dateLostOrFound,
//             location,
//             contactInfo,
//             collectionInfo,
//             isAnonymous
//         } = req.body;

//         if (!title || !description || !type || !location) {
//             return res.status(400).json({ message: "Title, description, type, and location are required." });
//         }

//         if (!['lost', 'found'].includes(type)) {
//             return res.status(400).json({ message: "Type must be either 'lost' or 'found'." });
//         }

//         const files = req.files?.lostfoundImage || [];
//         const photos = [];

//         for (const file of files) {
//             const uploadResult = await new Promise((resolve, reject) => {
//                 const stream = cloudinary.uploader.upload_stream(
//                     { folder: 'lostfound_images' },
//                     (error, result) => {
//                         if (error) reject(error);
//                         else resolve(result);
//                     }
//                 );
//                 stream.end(file.buffer);
//             });
//             photos.push({
//                 url: uploadResult.secure_url,
//                 public_id: uploadResult.public_id
//             });
//         }

//         console.log("Req.user in lostfound:", req.user);

//         const newItem = new LostFound({
//             title,
//             description,
//             type,
//             category: category || 'other',
//             dateLostOrFound: dateLostOrFound ? new Date(dateLostOrFound) : Date.now(),
//             location,
//             photos,
//             reportedBy: req.user.id,
//             contactInfo: contactInfo || '',
//             collectionInfo: collectionInfo || '',
//             isAnonymous: isAnonymous === 'true',
//         });

//         await newItem.save();

//         const populatedItem = await LostFound.findById(newItem._id)
//             .populate('reportedBy', 'fullName uniId ');

//         res.status(201).json({
//             message: "Lost/Found item created successfully.",
//             item: populatedItem
//         });
//     } catch (error) {
//         console.error("Error creating lost/found item:", error.message, error.stack);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

export const createLostFoundItem = async (req, res) => {
    console.log("=== CREATE LOST/FOUND ITEM START ===");

    try {
        console.log("➡️ Incoming body:", req.body);
        console.log("➡️ Incoming files:", req.files);
        console.log("➡️ Incoming user:", req.user);

        const {
            title,
            description,
            type,
            category,
            dateLostOrFound,
            location,
            contactInfo,
            collectionInfo,
            isAnonymous
        } = req.body;

        if (!title || !description || !type || !location) {
            console.log("❌ Missing required fields");
            return res.status(400).json({ message: "Title, description, type, and location are required." });
        }

        if (!['lost', 'found'].includes(type)) {
            console.log("❌ Invalid type:", type);
            return res.status(400).json({ message: "Type must be either 'lost' or 'found'." });
        }

        if (!req.user || (!req.user.id && !req.user._id)) {
            console.log("❌ Unauthorized - req.user is missing:", req.user);
            return res.status(401).json({ message: "Unauthorized: user not found in request." });
        }

        const reportedBy = req.user.id || req.user._id;

        const files = req.files?.lostfoundImage || [];
        console.log("📸 Files received:", files.length);

        const photos = [];

        if (files.length > 0) {
            console.log("🕐 Starting Cloudinary uploads...");
            for (const [index, file] of files.entries()) {
                console.log(`⏳ Uploading image #${index + 1}...`);

                if (!file.buffer) {
                    console.error(`❌ File buffer missing for image #${index + 1}`);
                    continue;
                }

                try {
                    const uploadResult = await new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { folder: 'lostfound_images' },
                            (error, result) => {
                                if (error) {
                                    console.error("❌ Cloudinary upload error:", error);
                                    reject(error);
                                } else {
                                    console.log("✅ Cloudinary upload success:", result.secure_url);
                                    resolve(result);
                                }
                            }
                        );
                        stream.end(file.buffer);
                    });

                    photos.push({
                        url: uploadResult.secure_url,
                        public_id: uploadResult.public_id
                    });
                } catch (uploadErr) {
                    console.error("❌ Upload failed:", uploadErr);
                }
            }
        } else {
            console.log("ℹ️ No files uploaded for this item.");
        }

        let parsedDate = dateLostOrFound ? new Date(dateLostOrFound) : new Date();
        if (isNaN(parsedDate)) {
            console.log("❌ Invalid date provided:", dateLostOrFound);
            return res.status(400).json({ message: "Invalid date format." });
        }

        console.log("🧩 Creating LostFound item...");
        const newItem = new LostFound({
            title,
            description,
            type,
            category: category || 'other',
            dateLostOrFound: parsedDate,
            location,
            photos,
            reportedBy,
            contactInfo: contactInfo || '',
            collectionInfo: collectionInfo || '',
            isAnonymous: isAnonymous === 'true' || isAnonymous === true,
        });

        console.log("🧾 New item data (before save):", newItem);

        await newItem.save();
        console.log("✅ Saved to database successfully.");

        const populatedItem = await LostFound.findById(newItem._id)
            .populate('reportedBy', 'fullName uniId');

        console.log("✅ Populated item fetched successfully.");

        res.status(201).json({
            message: "Lost/Found item created successfully.",
            item: populatedItem
        });

        console.log("=== CREATE LOST/FOUND ITEM END ===");

    } catch (error) {
        console.error("🔥 ERROR in createLostFoundItem:");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);

        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


export const getAllLostFoundItems = async (req, res) => {
    try {
        const items = await LostFound.find({
            status: { $ne: 'archived' },
            expiresAt: { $gte: new Date() }
        })
            .populate('reportedBy', 'fullName uniId ')
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
            for (const photo of item.photos) {
                try {
                    await cloudinary.uploader.destroy(photo.public_id);
                } catch (err) {
                    console.error("Error deleting Cloudinary image:", err);
                }
            }
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