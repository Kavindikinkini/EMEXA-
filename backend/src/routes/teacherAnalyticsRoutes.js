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

const router = express.Router();

// Get all students who took teacher's quizzes
router.get('/my-students', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    // Get all quizzes created by this teacher
    const teacherQuizzes = await TeacherQuiz.find({ teacherId }).select('_id');
    const quizIds = teacherQuizzes.map(q => q._id);
    
    // Get all unique students who attempted these quizzes
    const attempts = await QuizAttempt.find({ 
      quizId: { $in: quizIds } 
    }).distinct('studentId');
    
    // Get student details
    const students = await Student.find({
      _id: { $in: attempts },
      status: 'Active'
    }).select('_id name email studentId');
    
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
    
    // Get all attempts for these quizzes
    const attempts = await QuizAttempt.find({ 
      quizId: { $in: quizIds } 
    }).populate('studentId', 'name email');
    
    // Calculate class-wide stats
    const totalStudents = new Set(attempts.map(a => a.studentId?._id?.toString())).size;
    const totalAttempts = attempts.length;
    const avgScore = attempts.reduce((sum, a) => sum + a.score, 0) / (attempts.length || 1);
    
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
        studentName: a.studentId?.name || 'Unknown',
        score: a.score,
        date: a.submittedAt,
        hintsUsed: a.hintsUsed
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
      studentId,
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
      studentId,
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