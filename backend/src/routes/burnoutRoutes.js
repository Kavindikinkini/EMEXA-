// backend/src/routes/burnoutRoutes.js

import express from 'express';
import {
  getMyBurnoutRisk,
  getStudentBurnoutRisk,
  getClassBurnoutOverview,
} from '../controllers/burnoutDetectionController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Student views their own burnout risk
router.get('/my-risk', protect, authorize('student'), getMyBurnoutRisk);

// Teacher views burnout risk for a specific student
router.get('/student/:userId', protect, authorize('teacher', 'admin'), getStudentBurnoutRisk);

// Teacher views burnout overview for entire class
router.get('/class-overview', protect, authorize('teacher', 'admin'), getClassBurnoutOverview);

export default router;