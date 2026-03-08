// backend/routes/teacherAnalyticsRoutes.js

import express from 'express';
import {
  detectEmotionPatterns,
  analyzePerformanceEmotionCorrelation
} from '../controllers/customEmotionAnalysisController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import QuizAttempt from '../models/quizAttempt.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import Student from '../models/student.js';
import mongoose from 'mongoose';

const router = express.Router();

// ── Helper: find quizzes for this teacher ────────────────────────────
const getTeacherQuizIds = async (teacherId) => {
  const quizzes = await TeacherQuiz.find({ teacherId }).select('_id').lean();
  console.log(`🔍 getTeacherQuizIds: teacherId=${teacherId}, found=${quizzes.length}`);
  return quizzes.map(q => q._id);
};

// ── Helper: get all student userIds who attempted teacher's quizzes ──
const getStudentIdsForTeacher = async (teacherId) => {
  const quizIds = await getTeacherQuizIds(teacherId);
  if (quizIds.length === 0) return [];

  const quizIdStrings = quizIds.map(id => id.toString());

  // Try ObjectId match first
  let attempts = await QuizAttempt.find({ quizId: { $in: quizIds } })
    .select('userId')
    .lean();

  // Fallback: string comparison
  if (attempts.length === 0) {
    const allAttempts = await QuizAttempt.find({}).select('userId quizId').lean();
    attempts = allAttempts.filter(a =>
      a.quizId && quizIdStrings.includes(a.quizId.toString())
    );
  }

  const uniqueUserIds = [...new Set(
    attempts.map(a => a.userId?.toString()).filter(Boolean)
  )];

  console.log(`🔍 getStudentIdsForTeacher: ${attempts.length} attempts, ${uniqueUserIds.length} unique students`);
  return uniqueUserIds;
};

// ── GET /api/teacher-analytics/my-students ──────────────────────────
router.get('/my-students', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    const userIdStrings = await getStudentIdsForTeacher(teacherId);

    if (userIdStrings.length === 0) {
      console.log('⚠️ my-students: no student attempts found');
      return res.json([]);
    }

    const objIds = userIdStrings
      .map(id => { try { return new mongoose.Types.ObjectId(id); } catch { return null; } })
      .filter(Boolean);

    // ✅ FIX: Query Student collection, not User collection
    const students = await Student.find({ _id: { $in: objIds } })
      .select('_id name email studentId role').lean();

    console.log(`✅ my-students: found ${students.length} students out of ${objIds.length} unique ids`);

    res.json(students.map(s => ({
      _id: s._id,
      name: s.name || s.email?.split('@')[0] || 'Unknown',
      email: s.email,
      studentId: s.studentId,
      role: s.role
    })));

  } catch (error) {
    console.error('❌ my-students error:', error);
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
});

// ── GET /api/teacher-analytics/class-analytics ──────────────────────
router.get('/class-analytics', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    const quizIds = await getTeacherQuizIds(teacherId);
    const quizIdStrings = quizIds.map(id => id.toString());

    const quizCount = await TeacherQuiz.countDocuments({ teacherId });

    // Get all attempts for teacher's quizzes
    let attempts = await QuizAttempt.find({ quizId: { $in: quizIds } }).lean();

    // Fallback: string-based match
    if (attempts.length === 0 && quizIds.length > 0) {
      const allAttempts = await QuizAttempt.find({}).lean();
      attempts = allAttempts.filter(a =>
        a.quizId && quizIdStrings.includes(a.quizId.toString())
      );
    }

    const userIdStrings = [...new Set(
      attempts.map(a => a.userId?.toString()).filter(Boolean)
    )];

    const objIds = userIdStrings
      .map(id => { try { return new mongoose.Types.ObjectId(id); } catch { return null; } })
      .filter(Boolean);

    // ✅ FIX: Query Student collection for name map
    let userMap = {};
    if (objIds.length > 0) {
      const students = await Student.find({ _id: { $in: objIds } })
        .select('_id name email').lean();
      students.forEach(s => {
        userMap[s._id.toString()] = s.name || s.email?.split('@')[0] || 'Unknown';
      });
    }

    console.log(`🔍 class-analytics: ${attempts.length} attempts, ${Object.keys(userMap).length} students in map`);

    const avgScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.finalScore || 0), 0) / attempts.length
      : 0;

    // Emotion distribution
    const EmotionLog = (await import('../models/emotionLog.js')).default;
    let emotions = await EmotionLog.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      { $group: { _id: '$emotion', count: { $sum: 1 } } }
    ]);

    if (emotions.length === 0 && objIds.length > 0) {
      emotions = await EmotionLog.aggregate([
        { $match: { userId: { $in: objIds } } },
        { $group: { _id: '$emotion', count: { $sum: 1 } } }
      ]);
    }

    const emotionDist = {};
    emotions.forEach(e => { if (e._id) emotionDist[e._id] = e.count; });

    const sortedAttempts = [...attempts].sort(
      (a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)
    );

    res.json({
      classStats: {
        totalStudents: userIdStrings.length,
        totalQuizzes: quizCount,
        totalAttempts: attempts.length,
        averageScore: Math.round(avgScore * 100) / 100
      },
      emotionDistribution: emotionDist,
      recentAttempts: sortedAttempts.slice(0, 10).map(a => ({
        studentName: userMap[a.userId?.toString()] || 'Unknown',
        score: Math.round((a.finalScore || 0) * 100) / 100,
        date: a.completedAt || a.createdAt,
        hintsUsed: a.hintsUsed || 0
      }))
    });

  } catch (error) {
    console.error('❌ class-analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch class analytics', error: error.message });
  }
});

// ── GET /api/teacher-analytics/student-patterns/:studentId ──────────
router.get('/student-patterns/:studentId', protect, authorize('teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user._id;
    const { days = 30 } = req.query;

    const quizIds = await getTeacherQuizIds(teacherId);
    const quizIdStrings = quizIds.map(id => id.toString());

    let studentAttempt = await QuizAttempt.findOne({
      userId: studentId,
      quizId: { $in: quizIds }
    });

    if (!studentAttempt) {
      const allAttempts = await QuizAttempt.find({ userId: studentId }).lean();
      studentAttempt = allAttempts.find(a =>
        a.quizId && quizIdStrings.includes(a.quizId.toString())
      );
    }

    if (!studentAttempt) {
      return res.status(403).json({ message: 'This student has not taken any of your quizzes' });
    }

    req.query.studentId = studentId;
    req.query.days = days;
    await detectEmotionPatterns(req, res);

  } catch (error) {
    console.error('❌ student-patterns error:', error);
    res.status(500).json({ message: 'Pattern analysis failed', error: error.message });
  }
});

// ── GET /api/teacher-analytics/student-correlation/:studentId ───────
router.get('/student-correlation/:studentId', protect, authorize('teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user._id;

    const quizIds = await getTeacherQuizIds(teacherId);
    const quizIdStrings = quizIds.map(id => id.toString());

    let studentAttempt = await QuizAttempt.findOne({
      userId: studentId,
      quizId: { $in: quizIds }
    });

    if (!studentAttempt) {
      const allAttempts = await QuizAttempt.find({ userId: studentId }).lean();
      studentAttempt = allAttempts.find(a =>
        a.quizId && quizIdStrings.includes(a.quizId.toString())
      );
    }

    if (!studentAttempt) {
      return res.status(403).json({ message: 'This student has not taken any of your quizzes' });
    }

    req.query.studentId = studentId;
    await analyzePerformanceEmotionCorrelation(req, res);

  } catch (error) {
    console.error('❌ student-correlation error:', error);
    res.status(500).json({ message: 'Correlation analysis failed', error: error.message });
  }
});

export default router;