// backend/src/routes/finalMarkPredictionRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getTeacherPredictions,
  triggerPrediction,
  approvePrediction,
  rejectPrediction,
  getStudentPrediction,
  getStudentTimeline,
  getStudentHistory,
  getClassroomOverview
} from '../controllers/finalMarkPredictionController.js';
import { seedPredictionsForTeacher } from '../utils/predictionTrigger.js';

const router = express.Router();

// ── Teacher routes ─────────────────────────────────────────────────────────
router.get('/teacher/all',               protect, authorize('teacher'), getTeacherPredictions);
router.get('/classroom-overview',        protect, authorize('teacher'), getClassroomOverview);
router.post('/generate/:studentId',      protect, authorize('teacher'), triggerPrediction);
router.patch('/:predictionId/approve',   protect, authorize('teacher'), approvePrediction);
router.patch('/:predictionId/reject',    protect, authorize('teacher'), rejectPrediction);

// ── Timeline / history (teacher views a student's full timeline) ───────────
router.get('/history/:studentId',        protect, authorize('teacher'), getStudentHistory);

// ── Seed all existing students ─────────────────────────────────────────────
router.post('/seed-all', protect, authorize('teacher'), async (req, res) => {
  try {
    const result = await seedPredictionsForTeacher(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Student routes ─────────────────────────────────────────────────────────
router.get('/student/me',               protect, authorize('student'), getStudentPrediction);
router.get('/student/me/timeline',      protect, authorize('student'), getStudentTimeline);

export default router;