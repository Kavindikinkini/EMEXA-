import express from 'express';
import { 
  register, 
  login, 
  forgotPassword,
  resetPassword,
  changePassword, 
  getStudentApprovals,
  getTeacherApprovals,
  approveStudent,
  approveTeacher,
  rejectStudent,
  rejectTeacher
} from '../controllers/authController.js';

import User from '../models/user.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';


const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);

// Admin approval routes
router.get('/student-approvals', getStudentApprovals);
router.get('/teacher-approvals', getTeacherApprovals);
router.put('/student-approvals/:id/approve', approveStudent);
router.put('/teacher-approvals/:id/approve', approveTeacher);
router.put('/student-approvals/:id/reject', rejectStudent);
router.put('/teacher-approvals/:id/reject', rejectTeacher);

router.get('/debug-teacher/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('🔍 DEBUG: Checking teacher status for:', email);
    
    const userRecord = await User.findOne({ email }).select('-password');
    const teacherRecord = await Teacher.findOne({ email }).select('-password');
    
    console.log('User collection:', userRecord ? 'Found' : 'Not found');
    console.log('Teacher collection:', teacherRecord ? 'Found' : 'Not found');
    
    res.json({
      email,
      inUserCollection: userRecord ? {
        id: userRecord._id,
        name: userRecord.name,
        role: userRecord.role,
        approvalStatus: userRecord.approvalStatus,
        status: userRecord.status,
        isActive: userRecord.isActive
      } : null,
      inTeacherCollection: teacherRecord ? {
        id: teacherRecord._id,
        name: teacherRecord.name,
        role: teacherRecord.role,
        approvalStatus: teacherRecord.approvalStatus,
        status: teacherRecord.status,
        isActive: teacherRecord.isActive
      } : null
    });
  } catch (error) {
    console.error('❌ Debug route error:', error);
    res.status(500).json({ error: error.message });
  }
});
router.post('/cleanup-duplicate-teachers', async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of duplicate teachers...');
    
    // Find all pending teachers in User collection
    const pendingTeachers = await User.find({ 
      role: 'teacher', 
      approvalStatus: 'pending' 
    });
    
    console.log(`Found ${pendingTeachers.length} pending teachers`);
    
    const results = [];
    
    for (const userRecord of pendingTeachers) {
      // Check if teacher already exists in Teacher collection
      const existingTeacher = await Teacher.findOne({ email: userRecord.email });
      
      if (existingTeacher) {
        console.log(`✓ ${userRecord.email} - Already exists in Teacher collection`);
        
        // Update User record to approved
        userRecord.approvalStatus = 'approved';
        userRecord.status = 'Active';
        userRecord.isActive = true;
        await userRecord.save();
        
        results.push({
          email: userRecord.email,
          action: 'updated_user_record',
          status: 'already_approved'
        });
      } else {
        console.log(`✗ ${userRecord.email} - Truly pending`);
        results.push({
          email: userRecord.email,
          action: 'none',
          status: 'pending'
        });
      }
    }
    
    console.log('🧹 Cleanup complete');
    
    res.json({
      success: true,
      message: 'Cleanup complete',
      results
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


export default router;