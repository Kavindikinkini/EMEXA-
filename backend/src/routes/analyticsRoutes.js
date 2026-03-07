import express from 'express';
import { getAdminOverview } from '../controllers/analyticsController.js';
import { 
  detectEmotionPatterns, 
  analyzePerformanceEmotionCorrelation 
} from '../controllers/customEmotionAnalysisController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/admin/overview', protect, authorize('admin'), getAdminOverview);

// Admin custom emotion analysis routes
router.get('/custom/emotion-patterns', protect, authorize('admin'), async (req, res) => {
  await detectEmotionPatterns(req, res);
});

router.get('/custom/correlation', protect, authorize('admin'), async (req, res) => {
  await analyzePerformanceEmotionCorrelation(req, res);
});

export default router;