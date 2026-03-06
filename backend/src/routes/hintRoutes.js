import express from 'express';
import { generateHint, getHintsUsed, getEffortAnalytics, getClassEffortAnalytics } from '../controllers/hintController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/hint - Generate AI hint for a question
router.post('/', protect, generateHint);

// GET /api/hint/session/:sessionId - Get all hints used in a session
router.get('/session/:sessionId', protect, getHintsUsed);
router.get('/effort/:studentId', protect, getEffortAnalytics);
router.get('/class/:quizId', protect, getClassEffortAnalytics);
export default router;
