import express from 'express';
import teacherController from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';


const router = express.Router();

// Configure multer with Cloudinary storage
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  }
});

// Dashboard statistics
router.get(
  '/dashboard/stats', 
  protect, 
  authorize('teacher'), 
  teacherController.getDashboardStats
);

// Class progress data for chart
router.get(
  '/dashboard/class-progress', 
  protect, 
  authorize('teacher'), 
  teacherController.getClassProgress
);

// Engagement trend data for chart
router.get(
  '/dashboard/engagement-trend', 
  protect, 
  authorize('teacher'), 
  teacherController.getEngagementTrend
);

// Emotional state distribution
router.get(
  '/dashboard/emotional-state', 
  protect, 
  authorize('teacher'), 
  teacherController.getEmotionalState
);

// Student overview list
router.get(
  '/dashboard/students', 
  protect, 
  authorize('teacher'), 
  teacherController.getStudentOverview
);

// Recent quizzes
router.get(
  '/dashboard/quizzes', 
  protect, 
  authorize('teacher'), 
  teacherController.getRecentQuizzes
);

// ============================================
// ACTIVITY TRACKING ROUTES
// ============================================
router.get(
  '/activities',
  protect,
  authorize('teacher'),
  teacherController.getTeacherActivities
);

router.get(
  '/stats',
  protect,
  authorize('teacher'),
  teacherController.getTeacherStats
);

router.get(
  '/quiz/:quizId/performance',
  protect,
  authorize('teacher'),
  teacherController.getQuizPerformance
);

// Profile routes
router.get('/profile', protect, authorize('teacher'), teacherController.getProfile);

// Profile update route
router.put('/update-name', protect, authorize('teacher'), teacherController.updateProfile);

// Password change route
router.put('/change-password', protect, authorize('teacher'), teacherController.changePassword);

// 🆕 Profile image upload route (NEW)
router.post(
  '/upload-profile',
  protect,
  authorize('teacher'),
  upload.single('profile'),
  teacherController.uploadProfileImage
);

// Settings routes - NEW
router.get('/settings', protect, authorize('teacher'), teacherController.getSettings);
router.put('/settings', protect, authorize('teacher'), teacherController.updateSettings);

export default router;