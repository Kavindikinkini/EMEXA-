import EmotionLog from '../models/emotionLog.js';
import QuizAttempt from '../models/quizAttempt.js';
import mongoose from 'mongoose';
import { classifyEmotion, frictionScore } from '../utils/emotionClassifier.js';

export const detectEmotion = async (req, res) => {
  try {
    const { image, userId, sessionId, questionIndex, quizId } = req.body;

    if (!image || !userId || !sessionId || questionIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: image, userId, sessionId, questionIndex'
      });
    }

    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const result = await classifyEmotion(imageBuffer, mimeType);
    if (result.isFallback) {
      console.warn('⚠️ HF_API_KEY not configured — using neutral default, not a live reading');
    }

    const emotionLog = new EmotionLog({
      userId, sessionId, questionIndex,
      quizId: quizId || null,
      emotion: result.emotion,
      confidence: result.confidence,
      frictionScore: result.frictionScore,
      timestamp: new Date()
    });
    await emotionLog.save();

    res.status(200).json({
      success: true,
      data: { emotion: result.emotion, confidence: result.confidence, timestamp: emotionLog.timestamp }
    });

  } catch (error) {
    console.error('Emotion detection error:', error);
    res.status(500).json({ success: false, message: 'Error detecting emotion', error: error.message });
  }
};

export const getEmotionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const emotions = await EmotionLog.find({ sessionId }).sort({ timestamp: 1 });

    if (emotions.length === 0) {
      return res.status(200).json({ success: true, data: { totalCaptures: 0, summary: {} } });
    }

    const emotionCounts = {};
    emotions.forEach(log => {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
    });

    const mostCommonEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    const avgFriction = emotions.reduce((s, e) => s + (e.frictionScore || 1), 0) / emotions.length;

    res.status(200).json({
      success: true,
      data: {
        totalCaptures: emotions.length,
        mostCommonEmotion,
        emotionCounts,
        avgFriction: Math.round(avgFriction * 10) / 10,
        timeline: emotions.map(e => ({
          emotion: e.emotion,
          questionIndex: e.questionIndex,
          confidence: e.confidence,
          frictionScore: e.frictionScore,
          timestamp: e.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching emotion summary:', error);
    res.status(500).json({ success: false, message: 'Error fetching emotion summary', error: error.message });
  }
};

// ── Feature 3: Class Emotional Heatmap (Teacher view) ───────────────
export const getClassEmotionHeatmap = async (req, res) => {
  try {
    const { quizId } = req.params;

    let quizObjectId;
    try {
      quizObjectId = new mongoose.Types.ObjectId(quizId);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid quizId' });
    }

    const attempts = await QuizAttempt.find({ quizId: quizObjectId })
      .select('sessionId userId')
      .lean();

    console.log(`🔍 Heatmap quizId=${quizId}: ${attempts.length} attempts`);

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          questionHeatmap: [], totalStudents: 0,
          avgClassFriction: 0, avgFrustrationRate: 0, frictionHotspots: []
        }
      });
    }

    const sessionIds = attempts.map(a => a.sessionId).filter(Boolean);
    const userIds = [...new Set(attempts.map(a => a.userId?.toString()).filter(Boolean))];

    const emotionLogs = await EmotionLog.find({
      $or: [
        { sessionId: { $in: sessionIds } },
        { quizId: quizObjectId }
      ]
    }).lean().sort({ questionIndex: 1 });

    console.log(`🔍 EmotionLogs found: ${emotionLogs.length}`);

    if (emotionLogs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          questionHeatmap: [], totalStudents: userIds.length,
          avgClassFriction: 0, avgFrustrationRate: 0, frictionHotspots: []
        }
      });
    }

    const byQuestion = {};
    const studentSet = new Set();

    emotionLogs.forEach(log => {
      const qIdx = log.questionIndex ?? 0;
      studentSet.add(log.userId?.toString() || log.sessionId);

      if (!byQuestion[qIdx]) {
        byQuestion[qIdx] = {
          questionIndex: qIdx,
          totalCaptures: 0,
          emotions: {},
          totalFriction: 0,
          students: new Set()
        };
      }
      byQuestion[qIdx].totalCaptures++;
      byQuestion[qIdx].totalFriction += log.frictionScore || frictionScore[log.emotion] || 1;
      byQuestion[qIdx].emotions[log.emotion] = (byQuestion[qIdx].emotions[log.emotion] || 0) + 1;
      byQuestion[qIdx].students.add(log.userId?.toString() || log.sessionId);
    });

    const questionHeatmap = Object.values(byQuestion).map(q => {
      const avgFriction = q.totalFriction / q.totalCaptures;
      const dominantEmotion = Object.entries(q.emotions).sort(([, a], [, b]) => b - a)[0][0];
      const intensity = Math.min(1, avgFriction / 5);

      const frustrationRate = (
        (q.emotions.angry || 0) + (q.emotions.confused || 0) + (q.emotions.anxious || 0)
      ) / q.totalCaptures;

      return {
        questionIndex: q.questionIndex,
        totalCaptures: q.totalCaptures,
        studentsAffected: q.students.size,
        avgFriction: Math.round(avgFriction * 100) / 100,
        intensity,
        dominantEmotion,
        emotionBreakdown: q.emotions,
        frustrationRate: Math.round(frustrationRate * 100) / 100
      };
    }).sort((a, b) => a.questionIndex - b.questionIndex);

    const avgClassFriction = questionHeatmap.length > 0
      ? Math.round(
          (questionHeatmap.reduce((s, q) => s + q.avgFriction, 0) / questionHeatmap.length)
          / 5 * 100
        ) / 100
      : 0;

    const totalFrustration = emotionLogs.filter(l =>
      ['angry', 'confused', 'anxious'].includes(l.emotion)
    ).length;
    const avgFrustrationRate = Math.round((totalFrustration / emotionLogs.length) * 100) / 100;

    const frictionHotspots = [...questionHeatmap]
      .sort((a, b) => b.avgFriction - a.avgFriction)
      .slice(0, 3);

    res.status(200).json({
      success: true,
      data: {
        questionHeatmap,
        totalStudents: studentSet.size,
        avgClassFriction,
        avgFrustrationRate,
        frictionHotspots,
        totalEmotionCaptures: emotionLogs.length
      }
    });

  } catch (error) {
    console.error('Class heatmap error:', error);
    res.status(500).json({ success: false, message: 'Error generating heatmap', error: error.message });
  }
};

export const getStudentEmotionReport = async (req, res) => {
  try {
    const { studentId, sessionId } = req.params;
    const logs = await EmotionLog.find({ userId: studentId, sessionId }).sort({ questionIndex: 1 });

    if (logs.length === 0) {
      return res.status(200).json({ success: true, data: { logs: [], summary: {} } });
    }

    const byQuestion = {};
    logs.forEach(l => {
      if (!byQuestion[l.questionIndex]) byQuestion[l.questionIndex] = [];
      byQuestion[l.questionIndex].push(l.emotion);
    });

    const questionSummary = Object.entries(byQuestion).map(([qIdx, emotions]) => ({
      questionIndex: parseInt(qIdx),
      dominantEmotion: emotions.sort((a, b) =>
        emotions.filter(e => e === b).length - emotions.filter(e => e === a).length
      )[0],
      emotionChanges: emotions
    }));

    res.status(200).json({
      success: true,
      data: {
        studentId, sessionId,
        totalCaptures: logs.length,
        questionSummary,
        timeline: logs.map(l => ({
          questionIndex: l.questionIndex,
          emotion: l.emotion,
          confidence: l.confidence,
          frictionScore: l.frictionScore,
          timestamp: l.timestamp
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching student emotion report', error: error.message });
  }
};