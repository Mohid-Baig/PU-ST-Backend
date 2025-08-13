import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { createFeedback, getAllFeedback, deleteFeedback } from '../controllers/FeedbackController.js'

const router = express.Router();

router.post('/', verifyToken, createFeedback);
router.get('/', verifyToken, getAllFeedback);
router.delete('/:id', verifyToken, deleteFeedback);

export default router;
