import express from 'express';
import { 
  getUsers, 
  createUser, 
  getDashboardData, 
  getUserDashboardById, 
  getProfile,
  updateProfile,
  changePassword,
  updateNotificationSettings,
  updatePrivacySettings,
  exportUserData,
  uploadProfileImage,
  getStudentActivities,
  getStudentStats,
  getStudentAnalytics 

} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import User from '../models/user.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';

const router = express.Router();

import { storage } from '../config/cloudinary.js';

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

// ============================================
// PROFILE ROUTES (Must be before general routes)
// ============================================
router.get('/profile', protect, getProfile);
router.put('/update-profile', protect, updateProfile);
router.post('/upload-profile', protect, upload.single('profile'), uploadProfileImage);
router.put('/change-password', protect, changePassword);
router.put('/notification-settings', protect, updateNotificationSettings);
router.put('/privacy-settings', protect, updatePrivacySettings);
router.get('/export-data', protect, exportUserData);
router.get('/dashboard', protect, getDashboardData);
router.get('/student/activities', protect, getStudentActivities);
router.get('/student/stats', protect, getStudentStats);
router.get('/analytics', protect, getStudentAnalytics);

// FIXED: Changed authenticateToken to protect
router.get('/:userId/dashboard', protect, getUserDashboardById);

// ============================================
// DEBUG ROUTES - Add these temporarily
// ============================================
router.get('/debug/check-db/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 DEBUG: Checking database for userId:', userId);

    const student = await Student.findById(userId).select('name email profileImage role approvalStatus isActive');
    const teacher = await Teacher.findById(userId).select('name email profileImage role approvalStatus isActive');
    const user = await User.findById(userId).select('name email profileImage role approvalStatus isActive');

    const result = {
      userId,
      student: student ? { name: student.name, email: student.email, profileImage: student.profileImage, role: student.role, approvalStatus: student.approvalStatus, isActive: student.isActive } : null,
      teacher: teacher ? { name: teacher.name, email: teacher.email, profileImage: teacher.profileImage, role: teacher.role, approvalStatus: teacher.approvalStatus, isActive: teacher.isActive } : null,
      user: user ? { name: user.name, email: user.email, profileImage: user.profileImage, role: user.role, approvalStatus: user.approvalStatus, isActive: user.isActive } : null
    };

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// NEW: Debug route to check all users in collections
router.get('/debug/count-all', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Counting all users in all collections');
    
    const studentCount = await Student.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const userCount = await User.countDocuments();
    
    const approvedStudents = await Student.countDocuments({ approvalStatus: 'approved', isActive: true });
    const approvedTeachers = await Teacher.countDocuments({ approvalStatus: 'approved', isActive: true });
    
    // Get sample records
    const sampleStudents = await Student.find({ approvalStatus: 'approved', isActive: true })
      .select('name email role approvalStatus isActive')
      .limit(5)
      .lean();
    
    const result = {
      counts: {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalUsers: userCount,
        approvedStudents,
        approvedTeachers
      },
      sampleApprovedStudents: sampleStudents
    };
    
    console.log('Debug result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// GENERAL USER ROUTES
// ============================================
// Get all approved users (students, teachers, admins)
router.get('/', getUsers);

// Create user
router.post('/', createUser);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let user = await Student.findById(id).select('-password');
    let collection = 'Student';
    
    if (!user) {
      user = await Teacher.findById(id).select('-password');
      collection = 'Teacher';
    }
    
    if (!user) {
      user = await User.findById(id).select('-password');
      collection = 'User';
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`✅ Found user in ${collection} collection`);
    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    let updatedUser = await Student.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    let collection = 'Student';
    
    if (!updatedUser) {
      updatedUser = await Teacher.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
      collection = 'Teacher';
    }
    
    if (!updatedUser) {
      updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
      collection = 'User';
    }
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`✅ User updated in ${collection} collection`);
    res.json(updatedUser);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting user:', id);
    
    // Try to find the user first to get their email
    let user = await Student.findById(id);
    let collection = 'Student';
    
    if (!user) {
      user = await Teacher.findById(id);
      collection = 'Teacher';
    }
    
    if (!user) {
      user = await User.findById(id);
      collection = 'User';
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userEmail = user.email;
    
    // Delete from the collection where found
    if (collection === 'Student') {
      await Student.findByIdAndDelete(id);
    } else if (collection === 'Teacher') {
      await Teacher.findByIdAndDelete(id);
    } else {
      await User.findByIdAndDelete(id);
    }
    
    // Also delete approval record from User collection (if exists)
    if (collection === 'Student' || collection === 'Teacher') {
      await User.deleteOne({ email: userEmail, role: collection.toLowerCase() });
      console.log('🗑️ Also deleted approval record from User collection');
    }
    
    console.log(`✅ User deleted from ${collection} collection`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes for updating specific user's notification settings
router.put('/:userId/notification-settings', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    console.log('📋 Admin updating notification settings for user:', userId);
    console.log('New settings:', settings);
    
    // Find user in all collections
    let user = await Student.findById(userId);
    let collection = 'Student';
    
    if (!user) {
      user = await Teacher.findById(userId);
      collection = 'Teacher';
    }
    
    if (!user) {
      user = await User.findById(userId);
      collection = 'User';
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.notificationSettings = {
      emailNotifications: settings.emailNotifications ?? true,
      smsNotifications: settings.smsNotifications ?? false,
      inAppNotifications: settings.inAppNotifications ?? true
    };
    
    await user.save();
    
    console.log(`✅ Notification settings updated in ${collection} collection`);
    
    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    console.error('❌ Error updating notification settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin routes for updating specific user's privacy settings
router.put('/:userId/privacy-settings', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    console.log('🔒 Admin updating privacy settings for user:', userId);
    console.log('New settings:', settings);
    
    // Find user in all collections
    let user = await Student.findById(userId);
    let collection = 'Student';
    
    if (!user) {
      user = await Teacher.findById(userId);
      collection = 'Teacher';
    }
    
    if (!user) {
      user = await User.findById(userId);
      collection = 'User';
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.privacySettings = {
      emotionDataConsent: settings.emotionDataConsent ?? true
    };
    
    await user.save();
    
    console.log(`✅ Privacy settings updated in ${collection} collection`);
    
    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      privacySettings: user.privacySettings
    });
  } catch (error) {
    console.error('❌ Error updating privacy settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;