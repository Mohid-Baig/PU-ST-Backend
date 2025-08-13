import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { createFeedback, getAllFeedback, deleteFeedback, updateFeedbackStatus } from '../controllers/FeedbackController.js'

const router = express.Router();

router.post('/', verifyToken, createFeedback);
router.get('/', verifyToken, getAllFeedback);
router.delete('/:id', verifyToken, deleteFeedback);
router.put('/:id/status', verifyToken, updateFeedbackStatus);

export default router;
