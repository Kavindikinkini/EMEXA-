// backend/controllers/customEmotionAnalysisController.js
// ============================================
// CUSTOM EMOTION ANALYSIS ALGORITHM
// YOUR OWN IMPLEMENTATION (Not using external libraries)
// ============================================

import EmotionLog from '../models/emotionLog.js';
import Student from '../models/student.js';
import QuizAttempt from '../models/quizAttempt.js';

/**
 * CUSTOM ALGORITHM 1: Emotion Pattern Detection
 * Detects recurring emotional patterns using YOUR OWN scoring system
 */
export const detectEmotionPatterns = async (req, res) => {
  try {
    const { studentId, days = 30 } = req.query;
    
    // Get emotion logs for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const logs = await EmotionLog.find({
      studentId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // YOUR CUSTOM PATTERN DETECTION ALGORITHM
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
    res.status(500).json({ message: 'Pattern detection failed', error: error.message });
  }
};

/**
 * YOUR CUSTOM ALGORITHM: Sequence Pattern Analyzer
 * Detects repeating emotion sequences (e.g., Anxious → Stressed → Calm)
 */
function analyzeEmotionSequences(logs) {
  if (logs.length < 3) return { sequences: [], confidence: 0 };

  const sequences = [];
  const sequenceMap = new Map();

  // Sliding window of 3 emotions
  for (let i = 0; i < logs.length - 2; i++) {
    const pattern = `${logs[i].emotion} → ${logs[i+1].emotion} → ${logs[i+2].emotion}`;
    sequenceMap.set(pattern, (sequenceMap.get(pattern) || 0) + 1);
  }

  // Find most common sequences
  const sortedSequences = Array.from(sequenceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  sortedSequences.forEach(([pattern, count]) => {
    sequences.push({
      pattern,
      occurrences: count,
      frequency: ((count / (logs.length - 2)) * 100).toFixed(2) + '%'
    });
  });

  return {
    sequences,
    totalDataPoints: logs.length,
    confidence: logs.length >= 10 ? 'High' : logs.length >= 5 ? 'Medium' : 'Low'
  };
}

/**
 * YOUR CUSTOM ALGORITHM: Stress Score Calculator
 * Custom weighted scoring system (YOUR implementation, not external library)
 */
function calculateCustomStressScore(logs) {
  if (logs.length === 0) return { score: 0, level: 'Unknown' };

  // YOUR CUSTOM WEIGHTS for each emotion
  const emotionWeights = {
    'Happy': -2,      // Reduces stress
    'Calm': -1,       // Slightly reduces stress
    'Neutral': 0,     // No impact
    'Anxious': 2,     // Increases stress
    'Stressed': 3,    // High stress
    'Frustrated': 2.5,
    'Sad': 1.5
  };

  let totalScore = 0;
  let validEmotions = 0;

  logs.forEach(log => {
    const weight = emotionWeights[log.emotion] || 0;
    totalScore += weight;
    validEmotions++;
  });

  // YOUR CUSTOM NORMALIZATION (0-100 scale)
  const avgScore = totalScore / validEmotions;
  const normalizedScore = Math.min(100, Math.max(0, (avgScore + 3) * 16.67));

  // YOUR CUSTOM STRESS LEVEL CATEGORIES
  let level, color, recommendation;
  if (normalizedScore < 30) {
    level = 'Low';
    color = 'green';
    recommendation = 'Excellent emotional wellbeing!';
  } else if (normalizedScore < 50) {
    level = 'Moderate';
    color = 'yellow';
    recommendation = 'Monitor stress levels, consider relaxation techniques.';
  } else if (normalizedScore < 70) {
    level = 'High';
    color = 'orange';
    recommendation = 'Consider wellness resources and stress management tools.';
  } else {
    level = 'Very High';
    color = 'red';
    recommendation = 'Immediate support recommended - contact counseling services.';
  }

  return {
    score: Math.round(normalizedScore),
    level,
    color,
    recommendation,
    dataPoints: validEmotions,
    algorithm: 'EMEXA Custom Weighted Stress Index'
  };
}

/**
 * YOUR CUSTOM ALGORITHM: Personalized Recommendation Engine
 */
function generateCustomRecommendations(patterns, stressScore) {
  const recommendations = [];

  // Pattern-based recommendations
  if (patterns.sequences.length > 0) {
    const topPattern = patterns.sequences[0].pattern;
    
    if (topPattern.includes('Anxious')) {
      recommendations.push({
        type: 'Pattern-Based',
        title: 'Recurring Anxiety Detected',
        suggestion: 'Practice breathing exercises before quizzes',
        priority: 'High'
      });
    }
    
    if (topPattern.includes('Stressed → Frustrated')) {
      recommendations.push({
        type: 'Pattern-Based',
        title: 'Stress Escalation Pattern',
        suggestion: 'Take short breaks during difficult questions',
        priority: 'High'
      });
    }
  }

  // Stress-based recommendations
  if (stressScore.score > 60) {
    recommendations.push({
      type: 'Stress-Based',
      title: 'High Stress Level Detected',
      suggestion: 'Schedule counseling session or use wellness resources',
      priority: 'Critical'
    });
  } else if (stressScore.score > 40) {
    recommendations.push({
      type: 'Stress-Based',
      title: 'Moderate Stress',
      suggestion: 'Try mindfulness meditation or physical exercise',
      priority: 'Medium'
    });
  }

  return recommendations.length > 0 ? recommendations : [{
    type: 'General',
    title: 'Emotional Wellbeing Good',
    suggestion: 'Continue current stress management practices',
    priority: 'Low'
  }];
}

/**
 * CUSTOM ALGORITHM 2: Quiz Performance vs Emotion Correlation
 * YOUR OWN correlation analysis (not using external stats libraries)
 */
export const analyzePerformanceEmotionCorrelation = async (req, res) => {
  try {
    const { studentId } = req.query;

    // Get quiz attempts with emotions
    const attempts = await QuizAttempt.find({ studentId }).sort({ createdAt: -1 }).limit(20);
    
    if (attempts.length < 3) {
      return res.json({
        message: 'Insufficient data for correlation analysis',
        minRequired: 3,
        currentData: attempts.length
      });
    }

    // Get emotions during each quiz
    const correlationData = [];
    for (const attempt of attempts) {
      const emotions = await EmotionLog.find({
        studentId,
        timestamp: {
          $gte: new Date(attempt.createdAt.getTime() - 5 * 60000),
          $lte: new Date(attempt.createdAt.getTime() + attempt.timeSpent * 60000)
        }
      });

      const dominantEmotion = getDominantEmotion(emotions);
      correlationData.push({
        score: attempt.score,
        emotion: dominantEmotion,
        timeSpent: attempt.timeSpent
      });
    }

    // YOUR CUSTOM CORRELATION CALCULATOR
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
    res.status(500).json({ message: 'Correlation analysis failed', error: error.message });
  }
};

function getDominantEmotion(emotions) {
  if (emotions.length === 0) return 'Neutral';
  
  const emotionCounts = {};
  emotions.forEach(e => {
    emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
  });

  return Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * YOUR CUSTOM CORRELATION ALGORITHM
 * Simple Pearson-like correlation (YOUR implementation)
 */
function calculateCustomCorrelation(data) {
  const emotionScoreMap = {
    'Happy': 5,
    'Calm': 4,
    'Neutral': 3,
    'Anxious': 2,
    'Stressed': 1,
    'Frustrated': 1,
    'Sad': 1
  };

  const emotionScores = data.map(d => emotionScoreMap[d.emotion] || 3);
  const quizScores = data.map(d => d.score);

  const meanEmotion = emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length;
  const meanQuiz = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;

  let numerator = 0;
  let denomEmotionSq = 0;
  let denomQuizSq = 0;

  for (let i = 0; i < data.length; i++) {
    const emotionDiff = emotionScores[i] - meanEmotion;
    const quizDiff = quizScores[i] - meanQuiz;
    
    numerator += emotionDiff * quizDiff;
    denomEmotionSq += emotionDiff * emotionDiff;
    denomQuizSq += quizDiff * quizDiff;
  }

  const correlation = numerator / Math.sqrt(denomEmotionSq * denomQuizSq);

  return {
    coefficient: isNaN(correlation) ? 0 : correlation.toFixed(3),
    strength: getCorrelationStrength(correlation),
    interpretation: getCorrelationInterpretation(correlation)
  };
}

function getCorrelationStrength(r) {
  const absR = Math.abs(r);
  if (absR > 0.7) return 'Strong';
  if (absR > 0.4) return 'Moderate';
  if (absR > 0.2) return 'Weak';
  return 'Very Weak';
}

function getCorrelationInterpretation(r) {
  if (r > 0.5) return 'Positive emotions strongly correlate with better performance';
  if (r > 0.2) return 'Positive emotions moderately improve performance';
  if (r > -0.2) return 'Minimal correlation between emotions and performance';
  if (r > -0.5) return 'Negative emotions moderately impact performance';
  return 'Negative emotions significantly impact performance';
}

function generateCorrelationInsights(correlation) {
  const insights = [];
  
  if (parseFloat(correlation.coefficient) > 0.3) {
    insights.push({
      finding: 'Positive emotional state improves quiz performance',
      action: 'Use relaxation techniques before quizzes'
    });
  }
  
  if (parseFloat(correlation.coefficient) < -0.3) {
    insights.push({
      finding: 'Stress and anxiety negatively impact scores',
      action: 'Consider counseling or stress management workshops'
    });
  }

  return insights;
}