import express from 'express';
import { generateFeedback, getQuizAttempt, getUserAttempts } from '../controllers/feedbackController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/feedback - Generate personalized feedback after quiz submission
router.post('/', protect, generateFeedback);

// GET /api/feedback/attempt/:sessionId - Get specific quiz attempt
router.get('/attempt/:sessionId', protect, getQuizAttempt);

// GET /api/feedback/user/:userId - Get all attempts for a user
router.get('/user/:userId', protect, getUserAttempts);

export default router;
