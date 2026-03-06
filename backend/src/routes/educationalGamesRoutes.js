// backend/src/routes/educationalGamesRoutes.js
import express from 'express';
import {
  getTriviaQuestions,
  getMemoryPairs,
  getWordScrambles,
  submitGameScore,
  getGameLeaderboard,
  getStudentGameStats
} from '../controllers/educationalGamesController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get game content (protected - students only)
router.get('/trivia', protect, getTriviaQuestions);
router.get('/memory', protect, getMemoryPairs);
router.get('/word-scramble', protect, getWordScrambles);

// Submit game score (protected)
router.post('/submit-score', protect, submitGameScore);

// Get game leaderboard (protected)
router.get('/leaderboard', protect, getGameLeaderboard);

// Get student game stats (protected)
router.get('/stats/:studentId', protect, getStudentGameStats);

export default router;