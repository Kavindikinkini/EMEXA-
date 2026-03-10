// backend/routes/peerComparisonRoutes.js
import express from 'express';
import { getPeerComparison, getOverallPeerComparison } from '../controllers/peerComparisonController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/peer-comparison/overall  ← must be before /:quizId
router.get('/overall', protect, authorize('student'), getOverallPeerComparison);

// GET /api/peer-comparison/:quizId
router.get('/:quizId', protect, authorize('student'), getPeerComparison);

export default router;