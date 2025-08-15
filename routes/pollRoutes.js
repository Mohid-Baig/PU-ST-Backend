import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    createPoll,
    getAllPolls,
    getPollById,
    votePoll,
    deletePoll,
    closePoll
} from "../controllers/pollController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Polls
 *   description: API for creating and managing polls
 */

/**
 * @swagger
 * /polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - options
 *             properties:
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Poll created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", verifyToken, createPoll);

/**
 * @swagger
 * /polls:
 *   get:
 *     summary: Get all active polls
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of polls
 */
router.get("/", verifyToken, getAllPolls);

/**
 * @swagger
 * /polls/{id}:
 *   get:
 *     summary: Get a poll by ID
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll details
 *       404:
 *         description: Poll not found
 */
router.get("/:id", verifyToken, getPollById);

/**
 * @swagger
 * /polls/{id}/vote:
 *   post:
 *     summary: Vote on a poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - optionIndex
 *             properties:
 *               optionIndex:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vote added successfully
 *       400:
 *         description: Invalid request or already voted
 */
router.post("/:id/vote", verifyToken, votePoll);

/**
 * @swagger
 * /polls/{id}:
 *   delete:
 *     summary: Delete a poll
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll deleted successfully
 *       404:
 *         description: Poll not found
 */
router.delete("/:id", verifyToken, deletePoll);

/**
 * @swagger
 * /polls/{id}/close:
 *   put:
 *     summary: Close a poll before it expires
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll closed successfully
 *       404:
 *         description: Poll not found
 */
router.put("/:id/close", verifyToken, closePoll);

export default router;
