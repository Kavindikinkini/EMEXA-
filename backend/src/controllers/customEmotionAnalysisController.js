// backend/controllers/customEmotionAnalysisController.js
// ✅ FIXES:
// 1. EmotionLog.find({ studentId }) → { userId: studentId } (wrong field name)
// 2. QuizAttempt.find({ studentId }) → { userId: studentId } (wrong field name)
// 3. Emotion weight keys now lowercase to match stored data ('happy' not 'Happy')
// 4. Added fallbacks: tries sessionId join if userId query returns nothing

import EmotionLog from '../models/emotionLog.js';
import QuizAttempt from '../models/quizAttempt.js';
import mongoose from 'mongoose';

export const detectEmotionPatterns = async (req, res) => {
  try {
    const { studentId, days = 30 } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // ✅ FIX: EmotionLog stores 'userId' not 'studentId'
    let logs = await EmotionLog.find({
      userId: studentId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Fallback: try without date filter (older data)
    if (logs.length === 0) {
      logs = await EmotionLog.find({ userId: studentId })
        .sort({ timestamp: 1 }).limit(100);
    }

    // Fallback: join through QuizAttempts → sessionIds
    if (logs.length === 0) {
      const attempts = await QuizAttempt.find({ userId: studentId })
        .select('sessionId').lean();
      const sessionIds = attempts.map(a => a.sessionId).filter(Boolean);
      if (sessionIds.length > 0) {
        logs = await EmotionLog.find({ sessionId: { $in: sessionIds } })
          .sort({ timestamp: 1 }).limit(100);
      }
    }

    console.log(`🔍 detectEmotionPatterns: studentId=${studentId}, logs=${logs.length}`);

    const patterns = analyzeEmotionSequences(logs);
    const stressScore = calculateCustomStressScore(logs);
    const recommendations = generateCustomRecommendations(patterns, stressScore);

    res.json({
      studentId,
      analysisType: 'Custom Pattern Detection',
      period: `${days} days`,
      patterns,
      stressScore,
      recommendations,
      algorithm: 'Proprietary EMEXA Emotion Sequence Analyzer v1.0'
    });

  } catch (error) {
    console.error('❌ detectEmotionPatterns error:', error);
    res.status(500).json({ message: 'Pattern detection failed', error: error.message });
  }
};

function analyzeEmotionSequences(logs) {
  if (logs.length < 3) return { sequences: [], confidence: 0, totalDataPoints: logs.length };

  const sequenceMap = new Map();

  for (let i = 0; i < logs.length - 2; i++) {
    const pattern = `${logs[i].emotion || 'neutral'} → ${logs[i+1].emotion || 'neutral'} → ${logs[i+2].emotion || 'neutral'}`;
    sequenceMap.set(pattern, (sequenceMap.get(pattern) || 0) + 1);
  }

  const sequences = Array.from(sequenceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => ({
      pattern,
      occurrences: count,
      frequency: ((count / (logs.length - 2)) * 100).toFixed(2) + '%'
    }));

  return {
    sequences,
    totalDataPoints: logs.length,
    confidence: logs.length >= 10 ? 'High' : logs.length >= 5 ? 'Medium' : 'Low'
  };
}

function calculateCustomStressScore(logs) {
  if (logs.length === 0) {
    return { score: 0, level: 'Unknown', dataPoints: 0, algorithm: 'EMEXA Custom Weighted Stress Index' };
  }

  // ✅ FIX: lowercase keys to match stored emotion strings
  const emotionWeights = {
    'happy': -2, 'calm': -1, 'neutral': 0,
    'confused': 1, 'anxious': 2, 'stressed': 3,
    'frustrated': 2.5, 'sad': 1.5, 'angry': 2.5, 'fear': 2
  };

  let totalScore = 0;
  logs.forEach(log => {
    const em = (log.emotion || 'neutral').toLowerCase();
    totalScore += emotionWeights[em] ?? 0;
  });

  const avgScore = totalScore / logs.length;
  const normalizedScore = Math.min(100, Math.max(0, (avgScore + 3) * 16.67));

  let level, recommendation;
  if (normalizedScore < 30)      { level = 'Low';       recommendation = 'Excellent emotional wellbeing!'; }
  else if (normalizedScore < 50) { level = 'Moderate';  recommendation = 'Monitor stress levels, consider relaxation techniques.'; }
  else if (normalizedScore < 70) { level = 'High';      recommendation = 'Consider wellness resources and stress management tools.'; }
  else                           { level = 'Very High'; recommendation = 'Immediate support recommended - contact counseling services.'; }

  return {
    score: Math.round(normalizedScore),
    level, recommendation,
    dataPoints: logs.length,
    algorithm: 'EMEXA Custom Weighted Stress Index'
  };
}

function generateCustomRecommendations(patterns, stressScore) {
  const recommendations = [];

  if (patterns.sequences?.length > 0) {
    const topPattern = patterns.sequences[0].pattern.toLowerCase();

    if (topPattern.includes('anxious')) {
      recommendations.push({ type: 'Pattern-Based', title: 'Recurring Anxiety Detected', suggestion: 'Practice breathing exercises before quizzes', priority: 'High' });
    }
    if (topPattern.includes('frustrated') || topPattern.includes('angry')) {
      recommendations.push({ type: 'Pattern-Based', title: 'Stress Escalation Pattern', suggestion: 'Take short breaks during difficult questions', priority: 'High' });
    }
    if (topPattern.includes('confused')) {
      recommendations.push({ type: 'Pattern-Based', title: 'Recurring Confusion Detected', suggestion: 'Review material before quizzes; ask teacher for clarification', priority: 'Medium' });
    }
  }

  if (stressScore.score > 60) {
    recommendations.push({ type: 'Stress-Based', title: 'High Stress Level Detected', suggestion: 'Schedule counseling session or use wellness resources', priority: 'Critical' });
  } else if (stressScore.score > 40) {
    recommendations.push({ type: 'Stress-Based', title: 'Moderate Stress', suggestion: 'Try mindfulness meditation or physical exercise', priority: 'Medium' });
  }

  return recommendations.length > 0 ? recommendations : [{
    type: 'General', title: 'Emotional Wellbeing Good',
    suggestion: 'Continue current stress management practices', priority: 'Low'
  }];
}

export const analyzePerformanceEmotionCorrelation = async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    // ✅ FIX: QuizAttempt schema uses 'userId' not 'studentId'
    const attempts = await QuizAttempt.find({ userId: studentId })
      .sort({ createdAt: -1 }).limit(20);

    console.log(`🔍 analyzeCorrelation: studentId=${studentId}, attempts=${attempts.length}`);

    if (attempts.length < 3) {
      return res.json({
        studentId,
        analysisType: 'Performance-Emotion Correlation',
        message: 'Insufficient data for correlation analysis',
        minRequired: 3,
        dataPoints: attempts.length,
        algorithm: 'EMEXA Custom Correlation Analyzer'
      });
    }

    const correlationData = [];
    for (const attempt of attempts) {
      const attemptStart = attempt.createdAt || attempt.completedAt || new Date();
      const timeSpentMs = (attempt.timeSpent || 30) * 60 * 1000;

      // ✅ FIX: EmotionLog uses 'userId' not 'studentId'
      let emotions = await EmotionLog.find({
        userId: studentId,
        timestamp: {
          $gte: new Date(attemptStart.getTime() - 5 * 60000),
          $lte: new Date(attemptStart.getTime() + timeSpentMs)
        }
      });

      // Fallback: try sessionId match
      if (emotions.length === 0 && attempt.sessionId) {
        emotions = await EmotionLog.find({ sessionId: attempt.sessionId });
      }

      // Fallback: use embedded emotionalSummary
      let dominantEmotion = 'neutral';
      if (emotions.length > 0) {
        dominantEmotion = getDominantEmotion(emotions);
      } else if (attempt.emotionalSummary?.mostCommonEmotion) {
        dominantEmotion = attempt.emotionalSummary.mostCommonEmotion;
      }

      correlationData.push({
        score: attempt.finalScore || attempt.score || 0,
        emotion: dominantEmotion,
        timeSpent: attempt.timeSpent || 0
      });
    }

    const correlation = calculateCustomCorrelation(correlationData);

    res.json({
      studentId,
      analysisType: 'Performance-Emotion Correlation',
      dataPoints: correlationData.length,
      correlation,
      insights: generateCorrelationInsights(correlation),
      algorithm: 'EMEXA Custom Correlation Analyzer'
    });

  } catch (error) {
    console.error('❌ analyzeCorrelation error:', error);
    res.status(500).json({ message: 'Correlation analysis failed', error: error.message });
  }
};

function getDominantEmotion(emotions) {
  if (emotions.length === 0) return 'neutral';
  const counts = {};
  emotions.forEach(e => {
    const em = (e.emotion || 'neutral').toLowerCase();
    counts[em] = (counts[em] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function calculateCustomCorrelation(data) {
  // ✅ FIX: lowercase keys to match stored emotion data
  const emotionScoreMap = {
    'happy': 5, 'calm': 4, 'neutral': 3,
    'confused': 2, 'anxious': 2, 'stressed': 1,
    'frustrated': 1, 'sad': 1, 'angry': 1, 'fear': 1
  };

  const emotionScores = data.map(d => {
    const em = (d.emotion || 'neutral').toLowerCase();
    return emotionScoreMap[em] ?? 3;
  });
  const quizScores = data.map(d => d.score || 0);

  const meanEmotion = emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length;
  const meanQuiz = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;

  let numerator = 0, denomEmotionSq = 0, denomQuizSq = 0;

  for (let i = 0; i < data.length; i++) {
    const ed = emotionScores[i] - meanEmotion;
    const qd = quizScores[i] - meanQuiz;
    numerator += ed * qd;
    denomEmotionSq += ed * ed;
    denomQuizSq += qd * qd;
  }

  const denom = Math.sqrt(denomEmotionSq * denomQuizSq);
  const correlation = denom === 0 ? 0 : numerator / denom;

  return {
    coefficient: isNaN(correlation) ? '0.000' : correlation.toFixed(3),
    strength: getCorrelationStrength(correlation),
    interpretation: getCorrelationInterpretation(correlation)
  };
}

function getCorrelationStrength(r) {
  const a = Math.abs(r);
  if (a > 0.7) return 'Strong';
  if (a > 0.4) return 'Moderate';
  if (a > 0.2) return 'Weak';
  return 'Very Weak';
}

function getCorrelationInterpretation(r) {
  if (r > 0.5)  return 'Positive emotions strongly correlate with better performance';
  if (r > 0.2)  return 'Positive emotions moderately improve performance';
  if (r > -0.2) return 'Minimal correlation between emotions and performance';
  if (r > -0.5) return 'Negative emotions moderately impact performance';
  return 'Negative emotions significantly impact performance';
}

function generateCorrelationInsights(correlation) {
  const coeff = parseFloat(correlation.coefficient);
  const insights = [];

  if (coeff > 0.3) {
    insights.push({ finding: 'Positive emotional state improves quiz performance', action: 'Use relaxation techniques before quizzes' });
  }
  if (coeff < -0.3) {
    insights.push({ finding: 'Stress and anxiety negatively impact scores', action: 'Consider counseling or stress management workshops' });
  }
  if (insights.length === 0) {
    insights.push({ finding: 'No strong emotion-performance link detected yet', action: 'Continue collecting data — more quiz attempts will reveal patterns' });
  }

  return insights;
}