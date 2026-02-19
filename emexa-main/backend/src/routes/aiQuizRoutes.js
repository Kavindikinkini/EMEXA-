// backend/src/routes/aiQuizRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import aiQuizController from '../controllers/aiQuizController.js';

const router = express.Router();

// All routes require authentication (teacher only)
router.use(protect);
router.use(authorize('teacher'));

// Generate quiz with AI
router.post('/generate', aiQuizController.generateQuiz);

// Get generation suggestions
router.get('/suggestions', aiQuizController.getGenerationSuggestions);

// Regenerate specific questions
router.post('/:quizId/regenerate', aiQuizController.regenerateQuestions);

// Enhance a specific question
router.get('/:quizId/enhance/:questionNumber', aiQuizController.enhanceQuestion);

// Save/Update generated quiz (handles both create and update)
router.put('/:quizId', aiQuizController.updateGeneratedQuiz);

export default router;