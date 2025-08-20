import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    createEventNotification,
    getAllEventNotifications,
    getEventNotificationById
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

export default router;
