// backend/routes/quizDifficultyRoutes.js
import express from 'express';
import {
  getQuizDifficultyAnalysis,
  getAllQuizDifficultySummary
} from '../controllers/quizDifficultyController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/quiz-difficulty/teacher/all  ← must be before /:quizId
router.get('/teacher/all', protect, authorize('teacher', 'admin'), getAllQuizDifficultySummary);

// GET /api/quiz-difficulty/:quizId
router.get('/:quizId', protect, authorize('teacher', 'admin'), getQuizDifficultyAnalysis);

export default router;