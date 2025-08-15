import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    createHelpBoardPost,
    getAllHelpBoardPosts,
    likeHelpBoardPost,
    addReplyToHelpBoardPost,
    updateHelpBoardStatus
} from '../controllers/HelpBoardController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: HelpBoard
 *   description: API for Help Board posts
 */

/**
 * @swagger
 * /helpboard:
 *   post:
 *     summary: Create a new Help Board post
 *     tags: [HelpBoard]
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
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               isAnonymous:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', verifyToken, createHelpBoardPost);

/**
 * @swagger
 * /helpboard:
 *   get:
 *     summary: Get all active Help Board posts
 *     tags: [HelpBoard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get('/', verifyToken, getAllHelpBoardPosts);

/**
 * @swagger
 * /helpboard/{id}/like:
 *   put:
 *     summary: Like or unlike a Help Board post
 *     tags: [HelpBoard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post liked or unliked
 *       404:
 *         description: Post not found
 */
router.put('/:id/like', verifyToken, likeHelpBoardPost);

/**
 * @swagger
 * /helpboard/{id}/reply:
 *   post:
 *     summary: Add a reply to a Help Board post
 *     tags: [HelpBoard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply added successfully
 *       400:
 *         description: Missing message
 *       404:
 *         description: Post not found
 */
router.post('/:id/reply', verifyToken, addReplyToHelpBoardPost);

/**
 * @swagger
 * /helpboard/{id}/status:
 *   put:
 *     summary: Update the status of a Help Board post (admin only)
 *     tags: [HelpBoard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, flagged, deleted]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Only admins can update status
 *       404:
 *         description: Post not found
 */
router.put('/:id/status', verifyToken, updateHelpBoardStatus);

export default router;
