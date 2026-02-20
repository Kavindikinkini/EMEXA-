import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getUnreadCount,
  createDataExportNotification,
  cleanupDuplicateNotifications,
  getNotificationSettings,
  testNotifications
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for the logged-in user
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Get notification settings
router.get('/settings', getNotificationSettings);

// Test notifications
router.post('/test', testNotifications);

// Create data export notification
router.post('/data-export', createDataExportNotification);

// Cleanup duplicate notifications
router.post('/cleanup-duplicates', cleanupDuplicateNotifications);

// Mark a notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

export default router;
