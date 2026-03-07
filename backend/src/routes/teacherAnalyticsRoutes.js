// backend/routes/teacherAnalyticsRoutes.js
// Teacher-specific custom analytics endpoints

import express from 'express';
import { 
  detectEmotionPatterns, 
  analyzePerformanceEmotionCorrelation 
} from '../controllers/customEmotionAnalysisController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Student from '../models/student.js';
import QuizAttempt from '../models/quizAttempt.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/my-students', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    const teacherQuizzes = await TeacherQuiz.find({ teacherId }).select('_id');
    const quizIds = teacherQuizzes.map(q => q._id);

    const studentIds = await QuizAttempt.find({
      quizId: { $in: quizIds }
    }).distinct('userId'); // ← use 'userId' not 'studentId'

    // Query 'users' collection directly, not Student model
    const db = req.app.locals.db || mongoose.connection.db;
    const students = await mongoose.connection.db.collection('users').find({
      _id: { $in: studentIds.map(id => new mongoose.Types.ObjectId(id.toString())) },
      role: 'student'
    }).project({ _id: 1, name: 1, email: 1, studentId: 1 }).toArray();

    console.log(`✅ Teacher ${teacherId} has ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching teacher students:', error);
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
});

// Get class-wide emotion analytics for teacher
router.get('/class-analytics', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    // Get all teacher's quizzes
    const quizzes = await TeacherQuiz.find({ teacherId });
    const quizIds = quizzes.map(q => q._id);
    
    const attempts = await QuizAttempt.find({ 
      quizId: { $in: quizIds } 
    });
    
    const totalStudents = new Set(attempts.map(a => a.userId?.toString())).size;
    const totalAttempts = attempts.length;
    const avgScore = attempts.reduce((sum, a) => sum + (a.finalScore || 0), 0) / (attempts.length || 1);
    
    // Get emotion distribution across all attempts
    const EmotionLog = (await import('../models/emotionLog.js')).default;
    const emotions = await EmotionLog.aggregate([
      { 
        $match: { 
          quizId: { $in: quizIds } 
        } 
      },
      { 
        $group: { 
          _id: '$emotion', 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    const emotionDist = {};
    emotions.forEach(e => {
      if (e._id) emotionDist[e._id] = e.count;
    });
    
    res.json({
      classStats: {
        totalStudents,
        totalQuizzes: quizzes.length,
        totalAttempts,
        averageScore: Math.round(avgScore * 100) / 100
      },
      emotionDistribution: emotionDist,
      recentAttempts: attempts.slice(-10).map(a => ({
        studentName: 'Student',
        score: a.finalScore || 0,
        date: a.completedAt,
        hintsUsed: a.hintsUsed || 0
      }))
    });
    
  } catch (error) {
    console.error('❌ Error fetching class analytics:', error);
    res.status(500).json({ message: 'Failed to fetch class analytics', error: error.message });
  }
});

// Detect emotion patterns for specific student (teacher view)
router.get('/student-patterns/:studentId', protect, authorize('teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user._id;
    const { days = 30 } = req.query;
    
    // Verify this student took teacher's quizzes
    const teacherQuizzes = await TeacherQuiz.find({ teacherId }).select('_id');
    const quizIds = teacherQuizzes.map(q => q._id);
    
    const studentAttempt = await QuizAttempt.findOne({
      userId: studentId,  
      quizId: { $in: quizIds }
    });
    
    if (!studentAttempt) {
      return res.status(403).json({ 
        message: 'This student has not taken any of your quizzes' 
      });
    }
    
    // Use existing custom algorithm
    req.query.studentId = studentId;
    req.query.days = days;
    
    await detectEmotionPatterns(req, res);
    
  } catch (error) {
    console.error('❌ Error analyzing student patterns:', error);
    res.status(500).json({ message: 'Pattern analysis failed', error: error.message });
  }
});

// Analyze performance-emotion correlation for student (teacher view)
router.get('/student-correlation/:studentId', protect, authorize('teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user._id;
    
    // Verify this student took teacher's quizzes
    const teacherQuizzes = await TeacherQuiz.find({ teacherId }).select('_id');
    const quizIds = teacherQuizzes.map(q => q._id);
    
    const studentAttempt = await QuizAttempt.findOne({
      userId: studentId,  
      quizId: { $in: quizIds }
    });
    
    if (!studentAttempt) {
      return res.status(403).json({ 
        message: 'This student has not taken any of your quizzes' 
      });
    }
    
    // Use existing custom algorithm
    req.query.studentId = studentId;
    
    await analyzePerformanceEmotionCorrelation(req, res);
    
  } catch (error) {
    console.error('❌ Error analyzing correlation:', error);
    res.status(500).json({ message: 'Correlation analysis failed', error: error.message });
  }
});

export default router;