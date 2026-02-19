import express from 'express';
import {
  createQuiz,
  getTeacherQuizzes,
  getDrafts,
  getScheduledQuizzes,
  getQuizById,
  updateQuiz,
  scheduleQuiz,
  deleteQuiz,
  permanentDeleteQuiz,
  getQuizStats,
  submitQuizAnswers,
  getQuizSubmission,
  getSharedQuizzes 
} from '../controllers/teacherQuizController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route - students can access shared quizzes (WITH FILTERING)
router.get('/shared', protect, getSharedQuizzes);

// Protected routes - require authentication
router.use(protect);

// Quiz CRUD operations
router.post('/create', createQuiz);                    // Create new quiz
router.get('/my-quizzes', getTeacherQuizzes);         // Get all teacher's quizzes
router.get('/drafts', getDrafts);                      // Get draft quizzes
router.get('/scheduled', getScheduledQuizzes);        // Get scheduled quizzes
router.get('/stats', getQuizStats);                    // Get quiz statistics
router.get('/:id', getQuizById);                       // Get single quiz by ID
router.put('/:id', updateQuiz);                        // Update quiz
router.delete('/:id', deleteQuiz);                     // Soft delete quiz
router.delete('/:id/permanent', permanentDeleteQuiz);  // Permanent delete (admin)

// Scheduling
router.post('/:id/schedule', scheduleQuiz);            // Schedule a quiz

// Student submission
router.post('/:id/submit', submitQuizAnswers);         // Submit quiz answers (students)
router.get('/:id/submission', getQuizSubmission);      // Get saved submission results (students)

export default router;
