import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    createConfession,
    getAllConfessions,
    likeConfession,
    reportConfession
} from '../controllers/anonymousController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Anonymous Confessions
 *   description: API for posting and interacting with anonymous confessions
 */

/**
 * @swagger
 * /api/anonymous:
 *   post:
 *     summary: Create an anonymous confession
 *     tags: [Anonymous Confessions]
 *     security:
 *       - bearerAuth: []
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
 *                 example: "This is an anonymous confession."
 *     responses:
 *       201:
 *         description: Confession created successfully
 *       400:
 *         description: Message is required
 */
router.post('/', verifyToken, createConfession);

/**
 * @swagger
 * /api/anonymous:
 *   get:
 *     summary: Get all anonymous confessions
 *     tags: [Anonymous Confessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of confessions retrieved successfully
 */
router.get('/', verifyToken, getAllConfessions);

/**
 * @swagger
 * /api/anonymous/{id}/like:
 *   put:
 *     summary: Like or unlike a confession
 *     tags: [Anonymous Confessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Confession ID
 *     responses:
 *       200:
 *         description: Confession liked or unliked
 *       404:
 *         description: Confession not found
 */
router.put('/:id/like', verifyToken, likeConfession);

/**
 * @swagger
 * /api/anonymous/{id}/report:
 *   post:
 *     summary: Report a confession for abuse or inappropriate content
 *     tags: [Anonymous Confessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Confession ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Contains abusive language"
 *     responses:
 *       200:
 *         description: Confession reported successfully
 *       400:
 *         description: Reason is required
 *       404:
 *         description: Confession not found
 */
router.post('/:id/report', verifyToken, reportConfession);

export default router;
