import express from 'express';
import upload from '../middleware/upload.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { createLostFoundItem, getAllLostFoundItems, deleteLostFoundItem, matchLostAndFoundItems, updateLostFoundStatus } from '../controllers/LostFoundController.js';

const router = express.Router();
router.post('/', verifyToken, upload.fields([{ name: 'lostfoundImage' }]), createLostFoundItem);
router.get('/', verifyToken, getAllLostFoundItems)
router.delete('/:id', verifyToken, deleteLostFoundItem);
router.put('/match', verifyToken, matchLostAndFoundItems);
router.put('/:id/status', verifyToken, updateLostFoundStatus);

export default router;
