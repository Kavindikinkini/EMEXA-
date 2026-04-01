// backend/src/routes/finalMarkPredictionRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getTeacherPredictions,
  triggerPrediction,
  approvePrediction,
  rejectPrediction,
  getStudentPrediction,
  getClassroomOverview
} from '../controllers/finalMarkPredictionController.js';
import { seedPredictionsForTeacher } from '../utils/predictionTrigger.js';

const router = express.Router();

// ── Teacher routes ─────────────────────────────────────────────────────────
router.get('/teacher/all',             protect, authorize('teacher'), getTeacherPredictions);
router.get('/classroom-overview',      protect, authorize('teacher'), getClassroomOverview);
router.post('/generate/:studentId',    protect, authorize('teacher'), triggerPrediction);
router.patch('/:predictionId/approve', protect, authorize('teacher'), approvePrediction);
router.patch('/:predictionId/reject',  protect, authorize('teacher'), rejectPrediction);

// ── Seed ALL existing students for a teacher (called once from the UI) ──────
router.post('/seed-all', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const result = await seedPredictionsForTeacher(teacherId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('seed-all error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Student routes ─────────────────────────────────────────────────────────
router.get('/student/me', protect, authorize('student'), getStudentPrediction);

export default router;