import express from 'express';
import upload from '../middleware/upload.js';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    createLostFoundItem,
    getAllLostFoundItems,
    deleteLostFoundItem,
    matchLostAndFoundItems,
    updateLostFoundStatus
} from '../controllers/LostFoundController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: LostFound
 *   description: API for managing lost and found items
 */

/**
 * @swagger
 * /api/lostfound:
 *   post:
 *     summary: Create a new lost or found item
 *     tags: [LostFound]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [lost, found]
 *               category:
 *                 type: string
 *               dateLostOrFound:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               collectionInfo:
 *                 type: string
 *               isAnonymous:
 *                 type: boolean
 *               lostfoundImage:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Lost/Found item created successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', verifyToken, upload.fields([{ name: 'lostfoundImage' }]), createLostFoundItem);

/**
 * @swagger
 * /api/lostfound:
 *   get:
 *     summary: Get all active lost/found items
 *     tags: [LostFound]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active items
 */
router.get('/', verifyToken, getAllLostFoundItems);

/**
 * @swagger
 * /api/lostfound/{id}:
 *   delete:
 *     summary: Delete a lost/found item
 *     tags: [LostFound]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 *       403:
 *         description: Permission denied
 */
router.delete('/:id', verifyToken, deleteLostFoundItem);

/**
 * @swagger
 * /api/lostfound/match:
 *   put:
 *     summary: Match a lost item with a found item
 *     tags: [LostFound]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lostItemId
 *               - foundItemId
 *             properties:
 *               lostItemId:
 *                 type: string
 *               foundItemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Items matched successfully
 *       400:
 *         description: Invalid item types
 *       404:
 *         description: One or both items not found
 */
router.put('/match', verifyToken, matchLostAndFoundItems);

/**
 * @swagger
 * /api/lostfound/{id}/status:
 *   put:
 *     summary: Update the status of a lost/found item
 *     tags: [LostFound]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Item ID
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
 *                 enum: [claimed, returned, archived]
 *               relatedItem:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Item not found
 *       403:
 *         description: Permission denied
 */
router.put('/:id/status', verifyToken, updateLostFoundStatus);

export default router;
