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

router.post('/', verifyToken, createHelpBoardPost);
router.get('/', verifyToken, getAllHelpBoardPosts);
router.put('/:id/like', verifyToken, likeHelpBoardPost);
router.post('/:id/reply', verifyToken, addReplyToHelpBoardPost);
router.put('/:id/status', verifyToken, updateHelpBoardStatus);

export default router;
