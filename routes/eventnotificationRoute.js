import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    createEventNotification,
    getAllEventNotifications,
    getEventNotificationById,
    registerDeviceToken,
} from "../controllers/eventNotificationController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Event Notifications
 *   description: APIs for sending and retrieving event notifications
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create and send a new event notification (push + email)
 *     tags: [Event Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Annual Sports Day"
 *               description:
 *                 type: string
 *                 example: "Join us on 25th Dec at the sports ground!"
 *     responses:
 *       201:
 *         description: Event notification created and sent successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only admins can create event notifications
 */
router.post("/", verifyToken, createEventNotification);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all event notifications
 *     tags: [Event Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all event notifications
 */
router.get("/", verifyToken, getAllEventNotifications);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event notification details by ID
 *     tags: [Event Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Event notification ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get("/:id", verifyToken, getEventNotificationById);
/**
 * @swagger
 * /api/events/register-device:
 *   post:
 *     summary: Register FCM token for the logged-in user
 *     tags: [Event Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "cGVSWVUGQ0WWCt3PRMYGIo:APA91b..."
 *                 description: FCM token retrieved from the device
 *     responses:
 *       200:
 *         description: Token registered successfully
 *       400:
 *         description: Token is missing
 *       401:
 *         description: Unauthorized (user not logged in)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.post("/register-device", verifyToken, registerDeviceToken);

export default router;
