// backend/controllers/peerComparisonController.js
// Peer Comparison feature - anonymous class rank, percentile, subject-wise, emotion comparison

import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import mongoose from 'mongoose';

// ── GET /api/peer-comparison/:quizId ─────────────────────────────────
// Returns anonymous peer comparison for the logged-in student
export const getPeerComparison = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id.toString();

    let quizObjectId;
    try {
      quizObjectId = new mongoose.Types.ObjectId(quizId);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid quizId' });
    }

    // Get ALL attempts for this quiz
    const allAttempts = await QuizAttempt.find({ quizId: quizObjectId })
      .select('userId finalScore hintsUsed completedAt emotionalSummary sessionId')
      .lean();

    if (allAttempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: { message: 'No attempts found for this quiz', totalStudents: 0 }
      });
    }

    // Find THIS student's attempt(s) - use best score
    const myAttempts = allAttempts.filter(a => a.userId?.toString() === studentId);
    if (myAttempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: { message: 'You have not attempted this quiz yet', totalStudents: allAttempts.length }
      });
    }

    const myBestAttempt = myAttempts.reduce((best, a) =>
      (a.finalScore || 0) > (best.finalScore || 0) ? a : best
    );
    const myScore = myBestAttempt.finalScore || 0;

    // Compute scores per unique student (best attempt each)
    const studentBestScores = {};
    allAttempts.forEach(a => {
      const uid = a.userId?.toString();
      if (!uid) return;
      if (!studentBestScores[uid] || (a.finalScore || 0) > studentBestScores[uid].score) {
        studentBestScores[uid] = { score: a.finalScore || 0, hintsUsed: a.hintsUsed || 0 };
      }
    });

    const allScores = Object.values(studentBestScores).map(s => s.score).sort((a, b) => a - b);
    const totalStudents = allScores.length;

    // Rank (1 = highest)
    const studentsBelow = allScores.filter(s => s < myScore).length;
    const rank = totalStudents - studentsBelow;
    const percentile = Math.round((studentsBelow / totalStudents) * 100);

    // Class stats
    const classAvg = Math.round(allScores.reduce((a, b) => a + b, 0) / totalStudents * 10) / 10;
    const classMax = Math.max(...allScores);
    const classMin = Math.min(...allScores);

    // Score distribution buckets (0-20, 21-40, 41-60, 61-80, 81-100)
    const distribution = [
      { range: '0–20%', count: 0 }, { range: '21–40%', count: 0 },
      { range: '41–60%', count: 0 }, { range: '61–80%', count: 0 },
      { range: '81–100%', count: 0 }
    ];
    allScores.forEach(s => {
      if (s <= 20) distribution[0].count++;
      else if (s <= 40) distribution[1].count++;
      else if (s <= 60) distribution[2].count++;
      else if (s <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    // Hints comparison
    const allHints = Object.values(studentBestScores).map(s => s.hintsUsed);
    const avgHints = Math.round(allHints.reduce((a, b) => a + b, 0) / totalStudents * 10) / 10;
    const myHints = myBestAttempt.hintsUsed || 0;

    // Emotion comparison - fetch emotion logs for all sessions in this quiz
    const allSessionIds = allAttempts.map(a => a.sessionId).filter(Boolean);
    const mySessionIds = myAttempts.map(a => a.sessionId).filter(Boolean);

    const allEmotionLogs = await EmotionLog.find({
      $or: [
        { sessionId: { $in: allSessionIds } },
        { quizId: quizObjectId }
      ]
    }).lean();

    // Class emotion breakdown
    const classEmotionCounts = {};
    allEmotionLogs.forEach(l => {
      classEmotionCounts[l.emotion] = (classEmotionCounts[l.emotion] || 0) + 1;
    });

    // My emotion breakdown
    const myEmotionCounts = {};
    const myLogs = allEmotionLogs.filter(l => mySessionIds.includes(l.sessionId));
    myLogs.forEach(l => {
      myEmotionCounts[l.emotion] = (myEmotionCounts[l.emotion] || 0) + 1;
    });

    const calmEmotions = ['happy', 'neutral', 'calm'];
    const totalClassEmotions = Object.values(classEmotionCounts).reduce((a, b) => a + b, 0) || 1;
    const totalMyEmotions = Object.values(myEmotionCounts).reduce((a, b) => a + b, 0) || 1;

    const classCalmRate = Math.round(
      calmEmotions.reduce((s, e) => s + (classEmotionCounts[e] || 0), 0) / totalClassEmotions * 100
    );
    const myCalmRate = Math.round(
      calmEmotions.reduce((s, e) => s + (myEmotionCounts[e] || 0), 0) / totalMyEmotions * 100
    );

    res.json({
      success: true,
      data: {
        myScore,
        rank,
        totalStudents,
        percentile,
        classStats: { avg: classAvg, max: classMax, min: classMin },
        scoreDistribution: distribution,
        hintsComparison: { mine: myHints, classAvg: avgHints },
        emotionComparison: {
          myEmotions: myEmotionCounts,
          classEmotions: classEmotionCounts,
          myCalmRate,
          classCalmRate
        }
      }
    });

  } catch (error) {
    console.error('❌ getPeerComparison error:', error);
    res.status(500).json({ message: 'Peer comparison failed', error: error.message });
  }
};

// ── GET /api/peer-comparison/overall ────────────────────────────────
// Overall stats across ALL quizzes the student has taken
export const getOverallPeerComparison = async (req, res) => {
  try {
    const studentId = req.user._id.toString();

    // Get all attempts by this student
    const myAttempts = await QuizAttempt.find({ userId: studentId })
      .select('quizId finalScore hintsUsed completedAt')
      .lean();

    if (myAttempts.length === 0) {
      return res.json({ success: true, data: { message: 'No quiz attempts found', totalAttempts: 0 } });
    }

    const quizIds = [...new Set(myAttempts.map(a => a.quizId?.toString()).filter(Boolean))]
      .map(id => { try { return new mongoose.Types.ObjectId(id); } catch (e) { return null; } })
      .filter(Boolean);

    // Get quiz titles
    const quizzes = await TeacherQuiz.find({ _id: { $in: quizIds } })
      .select('_id title subject')
      .lean();
    const quizMap = {};
    quizzes.forEach(q => { quizMap[q._id.toString()] = q; });

    // Per-quiz comparison
    const subjectComparisons = [];
    for (const quiz of quizzes) {
      const qId = quiz._id;
      const allAttempts = await QuizAttempt.find({ quizId: qId }).select('userId finalScore').lean();

      const studentBest = {};
      allAttempts.forEach(a => {
        const uid = a.userId?.toString();
        if (!uid) return;
        if (!studentBest[uid] || (a.finalScore || 0) > studentBest[uid]) {
          studentBest[uid] = a.finalScore || 0;
        }
      });

      const myBest = allAttempts
        .filter(a => a.userId?.toString() === studentId)
        .reduce((best, a) => Math.max(best, a.finalScore || 0), 0);

      const scores = Object.values(studentBest).sort((a, b) => a - b);
      const classAvg = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : 0;
      const rank = scores.length - scores.filter(s => s < myBest).length;
      const percentile = scores.length > 0
        ? Math.round(scores.filter(s => s < myBest).length / scores.length * 100)
        : 0;

      subjectComparisons.push({
        quizId: qId,
        title: quiz.title || 'Untitled Quiz',
        subject: quiz.subject || 'General',
        myScore: myBest,
        classAvg,
        rank,
        totalStudents: scores.length,
        percentile
      });
    }

    // Overall averages
    const myOverallAvg = Math.round(
      myAttempts.reduce((s, a) => s + (a.finalScore || 0), 0) / myAttempts.length * 10
    ) / 10;

    res.json({
      success: true,
      data: {
        myOverallAvg,
        totalQuizzesTaken: quizIds.length,
        totalAttempts: myAttempts.length,
        subjectComparisons
      }
    });

  } catch (error) {
    console.error('❌ getOverallPeerComparison error:', error);
    res.status(500).json({ message: 'Overall comparison failed', error: error.message });
  }
};