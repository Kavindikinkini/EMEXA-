// backend/src/routes/studyRecommendationRoutes.js

import express from 'express';
import { getStudyRecommendations } from '../controllers/studyRecommendationController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Student gets their own recommendations
router.get('/my-recommendations', protect, authorize('student'), async (req, res) => {
  req.params.userId = req.user._id;
  await getStudyRecommendations(req, res);
});

// Teacher/Admin can get recommendations for any student
router.get('/student/:userId', protect, authorize('teacher', 'admin'), async (req, res) => {
  await getStudyRecommendations(req, res);
});

export default router;