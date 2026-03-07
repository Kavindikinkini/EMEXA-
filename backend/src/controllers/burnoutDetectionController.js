// backend/src/controllers/burnoutDetectionController.js
// Predictive Burnout Detection using emotion trends + score trends + hint patterns

import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import HintUsage from '../models/hintUsage.js';
import mongoose from 'mongoose';

// Negative emotions that contribute to burnout
const NEGATIVE_EMOTIONS = ['sad', 'angry', 'confused', 'fear'];
const POSITIVE_EMOTIONS = ['happy', 'surprised'];

const calculateBurnoutScore = (attempts, emotionLogs, hintUsages) => {
  if (attempts.length === 0) return null;

  // ── 1. SCORE TREND (0-25 points) ──────────────────────────────────────────
  // Is performance declining over time?
  let scoreTrendScore = 0;
  if (attempts.length >= 3) {
    const recent = attempts.slice(0, 3).map(a => a.finalScore || 0);
    const older  = attempts.slice(3, 6).map(a => a.finalScore || 0);
    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const olderAvg  = older.length > 0
      ? older.reduce((s, v) => s + v, 0) / older.length
      : recentAvg;
    const decline = olderAvg - recentAvg; // positive = declining
    if (decline > 30) scoreTrendScore = 25;
    else if (decline > 15) scoreTrendScore = 18;
    else if (decline > 5)  scoreTrendScore = 10;
    else if (decline < -10) scoreTrendScore = 0; // improving
    else scoreTrendScore = 5;
  } else {
    const avgScore = attempts.reduce((s, a) => s + (a.finalScore || 0), 0) / attempts.length;
    scoreTrendScore = avgScore < 30 ? 20 : avgScore < 50 ? 10 : 3;
  }

  // ── 2. EMOTION TREND (0-30 points) ────────────────────────────────────────
  // High negative emotions = burnout signal
  let emotionScore = 0;
  if (emotionLogs.length > 0) {
    const negCount = emotionLogs.filter(e => NEGATIVE_EMOTIONS.includes(e.emotion)).length;
    const negRatio = negCount / emotionLogs.length;
    if (negRatio > 0.7)      emotionScore = 30;
    else if (negRatio > 0.5) emotionScore = 22;
    else if (negRatio > 0.3) emotionScore = 14;
    else if (negRatio > 0.2) emotionScore = 7;
    else emotionScore = 2;
  } else {
    // Use emotionalSummary from attempts as fallback
    const totalConfused = attempts.reduce((s, a) => s + (a.emotionalSummary?.confusedCount || 0), 0);
    const totalCaptures = attempts.reduce((s, a) => s + (a.emotionalSummary?.totalEmotionCaptures || 0), 0);
    if (totalCaptures > 0) {
      const ratio = totalConfused / totalCaptures;
      emotionScore = Math.round(ratio * 30);
    }
  }

  // ── 3. HINT DEPENDENCY (0-20 points) ──────────────────────────────────────
  // Increasing hint usage = struggling more over time
  let hintScore = 0;
  const recentHints = hintUsages.filter(h => {
    const d = new Date(h.timestamp || h.createdAt);
    return d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }).length;
  const totalHintsPerQuiz = attempts.length > 0
    ? hintUsages.length / attempts.length : 0;
  if (totalHintsPerQuiz > 3)      hintScore = 20;
  else if (totalHintsPerQuiz > 2) hintScore = 14;
  else if (totalHintsPerQuiz > 1) hintScore = 8;
  else if (recentHints > 5)       hintScore = 12;
  else hintScore = 2;

  // ── 4. ENGAGEMENT DROP (0-15 points) ──────────────────────────────────────
  // Gap between quiz attempts = disengagement
  let engagementScore = 0;
  if (attempts.length >= 2) {
    const latest   = new Date(attempts[0].completedAt);
    const previous = new Date(attempts[1].completedAt);
    const dayGap = (latest - previous) / (1000 * 60 * 60 * 24);
    if (dayGap > 14)     engagementScore = 15;
    else if (dayGap > 7) engagementScore = 10;
    else if (dayGap > 3) engagementScore = 5;
    else engagementScore = 0;
  }

  // ── 5. LOW SCORE STREAK (0-10 points) ─────────────────────────────────────
  let streakScore = 0;
  const recentScores = attempts.slice(0, 5).map(a => a.finalScore || 0);
  const lowStreak = recentScores.filter(s => s < 40).length;
  if (lowStreak >= 4)      streakScore = 10;
  else if (lowStreak >= 3) streakScore = 7;
  else if (lowStreak >= 2) streakScore = 4;
  else streakScore = 0;

  const total = scoreTrendScore + emotionScore + hintScore + engagementScore + streakScore;
  const burnoutScore = Math.min(100, Math.round(total));

  return {
    burnoutScore,
    breakdown: {
      scoreTrend:    { score: scoreTrendScore,  max: 25, label: 'Score Decline'      },
      emotionHealth: { score: emotionScore,     max: 30, label: 'Negative Emotions'  },
      hintDependency:{ score: hintScore,        max: 20, label: 'Hint Dependency'    },
      engagement:    { score: engagementScore,  max: 15, label: 'Engagement Drop'    },
      lowStreak:     { score: streakScore,      max: 10, label: 'Low Score Streak'   },
    }
  };
};

const getRiskLevel = (score) => {
  if (score >= 70) return { level: 'Critical', color: 'red',    emoji: '🔴', message: 'Immediate support needed' };
  if (score >= 50) return { level: 'High',     color: 'orange', emoji: '🟠', message: 'Intervention recommended' };
  if (score >= 30) return { level: 'Moderate', color: 'yellow', emoji: '🟡', message: 'Monitor closely'          };
  return             { level: 'Low',      color: 'green',  emoji: '🟢', message: 'Student is doing well'   };
};

// GET /api/burnout/my-risk  (student)
export const getMyBurnoutRisk = async (req, res) => {
  try {
    const userId = req.user._id;
    await computeBurnout(userId, res);
  } catch (error) {
    console.error('❌ Burnout detection error:', error);
    res.status(500).json({ message: 'Failed to calculate burnout risk', error: error.message });
  }
};

// GET /api/burnout/student/:userId  (teacher/admin)
export const getStudentBurnoutRisk = async (req, res) => {
  try {
    const { userId } = req.params;
    await computeBurnout(userId, res);
  } catch (error) {
    console.error('❌ Burnout detection error:', error);
    res.status(500).json({ message: 'Failed to calculate burnout risk', error: error.message });
  }
};

// GET /api/burnout/class-overview  (teacher)
export const getClassBurnoutOverview = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const TeacherQuiz = (await import('../models/teacherQuiz.js')).default;

    const quizzes = await TeacherQuiz.find({ teacherId }).select('_id');
    const quizIds = quizzes.map(q => q._id);

    const attempts = await QuizAttempt.find({ quizId: { $in: quizIds } });
    const userIds = [...new Set(attempts.map(a => a.userId?.toString()).filter(Boolean))];

    const results = await Promise.all(userIds.map(async (uid) => {
      const userAttempts = attempts
        .filter(a => a.userId?.toString() === uid)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      const emotionLogs = await EmotionLog.find({ userId: uid })
        .sort({ timestamp: -1 }).limit(100);
      const hintUsages = await HintUsage.find({ userId: uid });

      const result = calculateBurnoutScore(userAttempts, emotionLogs, hintUsages);
      if (!result) return null;

      // Get student name
      const user = await mongoose.connection.db.collection('users')
        .findOne({ _id: new mongoose.Types.ObjectId(uid) }, { projection: { name: 1, email: 1 } });

      return {
        userId: uid,
        studentName: user?.name || 'Unknown',
        email: user?.email || '',
        ...result,
        riskLevel: getRiskLevel(result.burnoutScore),
        quizzesAnalyzed: userAttempts.length,
      };
    }));

    const validResults = results.filter(Boolean).sort((a, b) => b.burnoutScore - a.burnoutScore);

    const summary = {
      totalStudents: validResults.length,
      critical: validResults.filter(r => r.burnoutScore >= 70).length,
      high:     validResults.filter(r => r.burnoutScore >= 50 && r.burnoutScore < 70).length,
      moderate: validResults.filter(r => r.burnoutScore >= 30 && r.burnoutScore < 50).length,
      low:      validResults.filter(r => r.burnoutScore < 30).length,
      avgBurnoutScore: validResults.length > 0
        ? Math.round(validResults.reduce((s, r) => s + r.burnoutScore, 0) / validResults.length)
        : 0,
    };

    res.json({ summary, students: validResults });
  } catch (error) {
    console.error('❌ Class burnout error:', error);
    res.status(500).json({ message: 'Failed to calculate class burnout', error: error.message });
  }
};

// Shared computation
const computeBurnout = async (userId, res) => {
  const attempts = await QuizAttempt.find({ userId })
    .sort({ completedAt: -1 }).limit(20);

  if (attempts.length === 0) {
    return res.json({
      hasData: false,
      message: 'Complete some quizzes to see your burnout risk assessment.',
    });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const emotionLogs = await EmotionLog.find({
    userId,
    timestamp: { $gte: sevenDaysAgo }
  }).sort({ timestamp: -1 });

  const hintUsages = await HintUsage.find({ userId });

  const result = calculateBurnoutScore(attempts, emotionLogs, hintUsages);
  const risk   = getRiskLevel(result.burnoutScore);

  // Build trend data (last 10 attempts for chart)
  const trendData = attempts.slice(0, 10).reverse().map((a, i) => ({
    attempt: i + 1,
    score: Math.round(a.finalScore || 0),
    emotion: a.emotionalSummary?.mostCommonEmotion || 'neutral',
    hints: a.hintsUsed || 0,
    date: new Date(a.completedAt).toLocaleDateString(),
  }));

  // Recommendations based on risk
  const recommendations = generateBurnoutRecommendations(risk.level, result.breakdown);

  res.json({
    hasData: true,
    burnoutScore: result.burnoutScore,
    riskLevel: risk,
    breakdown: result.breakdown,
    trendData,
    recommendations,
    dataPoints: {
      quizzesAnalyzed: attempts.length,
      emotionLogsAnalyzed: emotionLogs.length,
      hintsAnalyzed: hintUsages.length,
    }
  });
};

const generateBurnoutRecommendations = (level, breakdown) => {
  const recs = [];

  if (breakdown.emotionHealth.score > 15) {
    recs.push({
      icon: '💜',
      title: 'Emotional Support Needed',
      description: 'Your emotion data shows high negative feelings during quizzes. Consider talking to a counselor or taking short breaks between study sessions.',
      action: 'Visit the Wellness Centre'
    });
  }
  if (breakdown.scoreTrend.score > 15) {
    recs.push({
      icon: '📚',
      title: 'Review Core Concepts',
      description: 'Your scores have been declining. Go back to basics and review foundational material before attempting new quizzes.',
      action: 'Schedule a review session'
    });
  }
  if (breakdown.hintDependency.score > 10) {
    recs.push({
      icon: '🎯',
      title: 'Build Independent Problem Solving',
      description: 'You\'re relying heavily on hints. Try attempting questions fully before using hints to build confidence.',
      action: 'Practice without hints first'
    });
  }
  if (breakdown.engagement.score > 8) {
    recs.push({
      icon: '⚡',
      title: 'Re-engage With Regular Practice',
      description: 'Large gaps between quiz attempts signal disengagement. Short daily practice keeps knowledge fresh.',
      action: 'Set a daily study reminder'
    });
  }
  if (recs.length === 0) {
    recs.push({
      icon: '🌟',
      title: 'Keep Up the Great Work!',
      description: 'Your burnout risk is low. Maintain your current study habits and emotional balance.',
      action: 'Continue your current routine'
    });
  }

  return recs;
};