import express from 'express';
import { detectEmotion, getEmotionSummary, getClassEmotionHeatmap, getStudentEmotionReport } from '../controllers/emotionController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/emotion - Detect emotion from webcam snapshot
router.post('/', protect, detectEmotion);

// GET /api/emotion/summary/:sessionId - Get emotion summary for a quiz session
router.get('/summary/:sessionId', protect, getEmotionSummary);
router.get('/heatmap/:quizId', protect, getClassEmotionHeatmap);
router.get('/student/:studentId/:sessionId', protect, getStudentEmotionReport);

export default router;
