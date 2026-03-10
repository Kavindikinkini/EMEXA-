// backend/controllers/quizDifficultyController.js
// Quiz Difficulty Analysis - flags hard/easy questions, suggests revisions, computes badges

import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import HintUsage from '../models/hintUsage.js';
import mongoose from 'mongoose';

// Thresholds for difficulty classification
const THRESHOLDS = {
  easy:   { minCorrect: 0.75 },  // >75% students got it right → Easy
  hard:   { maxCorrect: 0.40 },  // <40% students got it right → Hard
  // 40-75% = Medium
};

// ── GET /api/quiz-difficulty/:quizId ────────────────────────────────
// Returns per-question difficulty badges + class performance + revision suggestions
export const getQuizDifficultyAnalysis = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user._id.toString();

    let quizObjectId;
    try {
      quizObjectId = new mongoose.Types.ObjectId(quizId);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid quizId' });
    }

    // Verify teacher owns this quiz
    const quiz = await TeacherQuiz.findOne({ _id: quizObjectId, teacherId }).lean();
    if (!quiz) {
      return res.status(403).json({ message: 'Quiz not found or access denied' });
    }

    const questions = quiz.questions || [];

    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({ quizId: quizObjectId })
      .select('userId sessionId answers finalScore hintsUsed completedAt')
      .lean();

    if (attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          quizId, quizTitle: quiz.title,
          totalAttempts: 0,
          questions: questions.map((q, idx) => ({
            questionIndex: idx,
            questionText: q.question || q.questionText || `Question ${idx + 1}`,
            difficulty: 'Unknown',
            badge: '⚪',
            correctRate: null,
            needsRevision: false,
            revisionReason: null
          })),
          summary: { easy: 0, medium: 0, hard: 0, unknown: questions.length }
        }
      });
    }

    // Count correct answers per question index
    const questionStats = {};
    questions.forEach((_, idx) => {
      questionStats[idx] = {
        correct: 0,
        total: 0,
        hintsUsed: 0,
        avgTimeBeforeHint: 0,
        frustrationCount: 0
      };
    });

    attempts.forEach(attempt => {
      const answers = attempt.answers || [];
      answers.forEach((ans, idx) => {
        if (!questionStats[idx]) questionStats[idx] = { correct: 0, total: 0, hintsUsed: 0, frustrationCount: 0 };
        questionStats[idx].total++;
        // Support multiple answer schema shapes
        const isCorrect = ans.isCorrect ?? ans.correct ?? false;
        if (isCorrect) questionStats[idx].correct++;
      });
    });

    // Fetch hint data per question
    const allSessionIds = attempts.map(a => a.sessionId).filter(Boolean);
    const hints = await HintUsage.find({
      sessionId: { $in: allSessionIds }
    }).lean();

    hints.forEach(h => {
      const idx = h.questionIndex;
      if (questionStats[idx] !== undefined) {
        questionStats[idx].hintsUsed++;
      }
    });

    // Fetch emotion data - frustration per question
    const emotionLogs = await EmotionLog.find({
      $or: [
        { sessionId: { $in: allSessionIds } },
        { quizId: quizObjectId }
      ]
    }).lean();

    emotionLogs.forEach(l => {
      const idx = l.questionIndex;
      if (questionStats[idx] !== undefined &&
          ['angry', 'confused', 'anxious', 'frustrated'].includes(l.emotion)) {
        questionStats[idx].frustrationCount++;
      }
    });

    // Build per-question difficulty analysis
    const totalAttempts = attempts.length;
    const questionAnalysis = questions.map((q, idx) => {
      const stats = questionStats[idx] || { correct: 0, total: 0, hintsUsed: 0, frustrationCount: 0 };
      const correctRate = stats.total > 0 ? stats.correct / stats.total : null;
      const hintRate = stats.total > 0 ? stats.hintsUsed / stats.total : 0;
      const frustrationRate = stats.total > 0 ? stats.frustrationCount / stats.total : 0;

      let difficulty, badge, badgeColor;
      if (correctRate === null) {
        difficulty = 'Unknown'; badge = '⚪'; badgeColor = 'gray';
      } else if (correctRate >= THRESHOLDS.easy.minCorrect) {
        difficulty = 'Easy'; badge = '🟢'; badgeColor = 'green';
      } else if (correctRate <= THRESHOLDS.hard.maxCorrect) {
        difficulty = 'Hard'; badge = '🔴'; badgeColor = 'red';
      } else {
        difficulty = 'Medium'; badge = '🟡'; badgeColor = 'yellow';
      }

      // Revision suggestion logic
      let needsRevision = false;
      const revisionReasons = [];
      if (correctRate !== null && correctRate < 0.30) {
        needsRevision = true;
        revisionReasons.push(`Only ${Math.round(correctRate * 100)}% of students answered correctly`);
      }
      if (hintRate > 0.6) {
        needsRevision = true;
        revisionReasons.push(`${Math.round(hintRate * 100)}% of students needed hints`);
      }
      if (frustrationRate > 0.4) {
        needsRevision = true;
        revisionReasons.push(`High frustration/confusion detected (${Math.round(frustrationRate * 100)}% of attempts)`);
      }

      // Hint frequency recommendation
      let hintRecommendation = null;
      if (difficulty === 'Hard' || hintRate > 0.5) {
        hintRecommendation = 'increase'; // Show hints more proactively
      } else if (difficulty === 'Easy' && hintRate < 0.1) {
        hintRecommendation = 'decrease'; // Reduce auto-hints on easy questions
      }

      return {
        questionIndex: idx,
        questionText: q.question || q.questionText || `Question ${idx + 1}`,
        difficulty,
        badge,
        badgeColor,
        correctRate: correctRate !== null ? Math.round(correctRate * 100) : null,
        totalAnswered: stats.total,
        hintsUsed: stats.hintsUsed,
        hintRate: Math.round(hintRate * 100),
        frustrationRate: Math.round(frustrationRate * 100),
        needsRevision,
        revisionReason: revisionReasons.join('; ') || null,
        hintRecommendation
      };
    });

    // Summary counts
    const summary = { easy: 0, medium: 0, hard: 0, unknown: 0 };
    questionAnalysis.forEach(q => {
      if (q.difficulty === 'Easy') summary.easy++;
      else if (q.difficulty === 'Medium') summary.medium++;
      else if (q.difficulty === 'Hard') summary.hard++;
      else summary.unknown++;
    });

    const revisionsNeeded = questionAnalysis.filter(q => q.needsRevision);
    const classAvgScore = Math.round(
      attempts.reduce((s, a) => s + (a.finalScore || 0), 0) / totalAttempts * 10
    ) / 10;

    // Overall quiz difficulty rating
    const hardRatio = summary.hard / questions.length;
    let overallDifficulty;
    if (hardRatio >= 0.5) overallDifficulty = 'Hard';
    else if (hardRatio >= 0.25) overallDifficulty = 'Moderate';
    else overallDifficulty = 'Easy';

    res.json({
      success: true,
      data: {
        quizId,
        quizTitle: quiz.title,
        totalAttempts,
        totalStudents: [...new Set(attempts.map(a => a.userId?.toString()).filter(Boolean))].length,
        classAvgScore,
        overallDifficulty,
        questions: questionAnalysis,
        summary,
        revisionsNeeded: revisionsNeeded.length,
        revisionList: revisionsNeeded.map(q => ({
          questionIndex: q.questionIndex,
          questionText: q.questionText,
          reason: q.revisionReason
        }))
      }
    });

  } catch (error) {
    console.error('❌ getQuizDifficultyAnalysis error:', error);
    res.status(500).json({ message: 'Difficulty analysis failed', error: error.message });
  }
};

// ── GET /api/quiz-difficulty/teacher/all ────────────────────────────
// Returns difficulty summary for ALL quizzes by this teacher
export const getAllQuizDifficultySummary = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const quizzes = await TeacherQuiz.find({ teacherId })
      .select('_id title subject questions createdAt')
      .lean();

    if (quizzes.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const summaries = [];
    for (const quiz of quizzes) {
      const attempts = await QuizAttempt.find({ quizId: quiz._id })
        .select('userId finalScore answers')
        .lean();

      if (attempts.length === 0) {
        summaries.push({
          quizId: quiz._id,
          title: quiz.title,
          subject: quiz.subject || 'General',
          totalAttempts: 0,
          classAvgScore: null,
          overallDifficulty: 'No Data',
          revisionsNeeded: 0,
          questionCount: (quiz.questions || []).length
        });
        continue;
      }

      // Quick difficulty pass: count hard questions
      const questions = quiz.questions || [];
      let hardCount = 0;
      let revisionCount = 0;

      questions.forEach((_, idx) => {
        let correct = 0, total = 0;
        attempts.forEach(a => {
          const ans = (a.answers || [])[idx];
          if (ans !== undefined) {
            total++;
            if (ans.isCorrect ?? ans.correct ?? false) correct++;
          }
        });
        if (total > 0) {
          const rate = correct / total;
          if (rate < 0.40) hardCount++;
          if (rate < 0.30) revisionCount++;
        }
      });

      const hardRatio = questions.length > 0 ? hardCount / questions.length : 0;
      const classAvgScore = Math.round(
        attempts.reduce((s, a) => s + (a.finalScore || 0), 0) / attempts.length * 10
      ) / 10;

      summaries.push({
        quizId: quiz._id,
        title: quiz.title,
        subject: quiz.subject || 'General',
        totalAttempts: attempts.length,
        classAvgScore,
        overallDifficulty: hardRatio >= 0.5 ? 'Hard' : hardRatio >= 0.25 ? 'Moderate' : 'Easy',
        revisionsNeeded: revisionCount,
        questionCount: questions.length
      });
    }

    res.json({ success: true, data: summaries });

  } catch (error) {
    console.error('❌ getAllQuizDifficultySummary error:', error);
    res.status(500).json({ message: 'Summary failed', error: error.message });
  }
};