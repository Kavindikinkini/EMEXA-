import express from 'express';
import { 
  getQuizById, 
  getAllQuizzes, 
  submitQuizAnswers,
  getQuizResults 
} from '../controllers/quizcontroller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all available quizzes for a student
router.get('/', protect, getAllQuizzes);

// Get specific quiz by ID
router.get('/:quizId', protect, getQuizById);

// Submit quiz answers
router.post('/:quizId/submit', protect, submitQuizAnswers);

// Get quiz results
router.get('/:quizId/results', protect, getQuizResults);

export default router;