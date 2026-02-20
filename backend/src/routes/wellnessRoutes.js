import express from 'express';
import * as wellnessController from '../controllers/wellnessController.js';
import { protect } from '../middleware/auth.js'; // Using 'protect' middleware

const router = express.Router();

// Mood tracking routes
router.post("/mood", protect, wellnessController.saveMood);
router.get("/mood/history", protect, wellnessController.getMoodHistory);
router.get("/mood/latest", protect, wellnessController.getLatestMood);

// Wellness activities routes
router.post("/activity", protect, wellnessController.saveActivity);
router.get("/activities", protect, wellnessController.getActivities);

// Wellness tips route
router.get("/tips", protect, wellnessController.getWellnessTips);

export default router;