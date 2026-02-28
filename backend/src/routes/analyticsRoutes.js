// backend/routes/analyticsRoutes.js
import express from 'express';
import { getAdminOverview } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin analytics endpoint - protected route
router.get('/admin/overview', protect, authorize('admin'), getAdminOverview);

export default router;