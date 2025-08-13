import express from 'express';
import upload from '../middleware/upload.js';
import {
    RegisterIssue,
    GetAllIssues,
    getIssuesByUniId,
    IssuesStatus,
    GetMyIssues
} from '../controllers/IssuesController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Issues
 *   description: Issue management and reporting
 */

/**
 * @swagger
 * /api/report/issues:
 *   post:
 *     summary: Submit a new issue report
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Cleanliness, safety, enviornment, drainage, construction, broken_resources, other]
 *               location:
 *                 type: string
 *                 description: JSON stringified format like {"type":"Point","coordinates":[longitude, latitude]}
 *               issueImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Issue submitted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/issues',
    verifyToken,
    upload.fields([{ name: 'issueImage' }]),
    RegisterIssue
);

/**
 * @swagger
 * /api/report/issues/all-issues:
 *   get:
 *     summary: Get all reported issues
 *     tags: [Issues]
 *     responses:
 *       200:
 *         description: A list of all issues
 *       500:
 *         description: Server error
 */
router.get('/issues/all-issues', GetAllIssues);

/**
 * @swagger
 * /api/report/issues/uni/{uniId}:
 *   get:
 *     summary: Get issues by university ID
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: uniId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID of the user
 *     responses:
 *       200:
 *         description: Issues for given university ID
 *       404:
 *         description: User not found
 */
router.get('/issues/uni/:uniId', getIssuesByUniId);

/**
 * @swagger
 * /api/report/issues/{id}/status:
 *   put:
 *     summary: Update the status of an issue (admin only)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, viewed, resolved, rejected]
 *               adminRemarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Issue status updated
 *       400:
 *         description: Invalid status or missing reason for rejection
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Issue not found
 */
router.put('/issues/:id/status', verifyToken, IssuesStatus);

/**
 * @swagger
 * /api/report/issues/reported-by-me:
 *   get:
 *     summary: Get issues reported by the logged-in user
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's reported issues
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No issues found
 */
router.get('/issues/reported-by-me', verifyToken, GetMyIssues);

export default router;
