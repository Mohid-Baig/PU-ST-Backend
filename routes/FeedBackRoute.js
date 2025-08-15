import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { createFeedback, getAllFeedback, deleteFeedback, updateFeedbackStatus } from '../controllers/FeedbackController.js'

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: API for submitting and managing feedback
 */

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit feedback
 *     tags: [Feedback]
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
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [suggestion, complaint, appreciation, teacher_absentee, other]
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', verifyToken, createFeedback);

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get all feedback (admin can see all, users see their own)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feedback entries
 */
router.get('/', verifyToken, getAllFeedback);

/**
 * @swagger
 * /feedback/{id}:
 *   delete:
 *     summary: Delete a feedback entry
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *       403:
 *         description: Not authorized to delete
 *       404:
 *         description: Feedback not found
 */
router.delete('/:id', verifyToken, deleteFeedback);

/**
 * @swagger
 * /feedback/{id}/status:
 *   put:
 *     summary: Update feedback status (admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Feedback ID
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
 *                 enum: [pending, reviewed, resolved, rejected]
 *               adminRemarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Only admins can update status
 *       404:
 *         description: Feedback not found
 */
router.put('/:id/status', verifyToken, updateFeedbackStatus);

export default router;
