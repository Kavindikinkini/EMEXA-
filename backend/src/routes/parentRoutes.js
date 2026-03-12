import express from 'express';
import {
  registerParent,
  loginParent,
  getMyChildren,
  getChildDashboard,
  getWeeklySummary,
  updateConsent
} from '../controllers/parentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public — no auth needed
router.post('/register', registerParent);
router.post('/login',    loginParent);

// Protected — parent must be logged in
router.get('/my-children',                        protect, getMyChildren);
router.get('/child/:childId/dashboard',           protect, getChildDashboard);
router.get('/child/:childId/weekly-summary',      protect, getWeeklySummary);
router.put('/child/:childId/consent',             protect, updateConsent);

export default router;