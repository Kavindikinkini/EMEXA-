// backend/src/routes/gamificationRoutes.js
import express from 'express';
import {
  awardPoints,
  getAchievements,
  getLeaderboard,
  getStudentStats,
  updateStreak,
  checkQuizAchievements
} from '../controllers/gamificationController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Award points (protected)
router.post('/points/award', protect, awardPoints);

// Get student achievements
router.get('/achievements/:studentId', protect, getAchievements);

// Get leaderboard
router.get('/leaderboard', protect, getLeaderboard);

// Get student stats
router.get('/stats/:studentId', protect, getStudentStats);

// Update streak
router.post('/streak/update', protect, updateStreak);

// Check quiz achievements
router.post('/quiz/check-achievements', protect, checkQuizAchievements);

export default router;