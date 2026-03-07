import { HfInference } from '@huggingface/inference';
import EmotionLog from '../models/emotionLog.js';
import QuizAttempt from '../models/quizAttempt.js';

// Initialize Hugging Face client
const hf = process.env.HF_API_KEY && process.env.HF_API_KEY !== 'hf_dummy_key_for_testing' 
  ? new HfInference(process.env.HF_API_KEY) 
  : null;

  // Emotion → standardized category mapping
const mapEmotion = (raw) => {
  const map = {
    happy: 'happy', joy: 'happy', excited: 'happy',
    sad: 'sad', disappointed: 'sad',
    angry: 'angry', frustrated: 'angry',
    confused: 'confused', surprised: 'confused', disgust: 'confused',
    fear: 'anxious', anxious: 'anxious',
    neutral: 'neutral', calm: 'neutral'
  };
  return map[raw?.toLowerCase()] || 'neutral';
};

// Feature 3: Friction score per emotion (0 = positive, 5 = high friction)
const frictionScore = {
  happy: 0, neutral: 1, sad: 3, confused: 4, anxious: 4, angry: 5
};

// Create an Express API endpoint that receives a base64 image,
// sends it to Hugging Face emotion recognition model using axios,
// returns detected emotion label and confidence,
// and does NOT store the image.
// Use process.env.HF_API_KEY for authorization.

export const detectEmotion = async (req, res) => {
  try {
    const { image, userId, sessionId, questionIndex } = req.body;

    if (!image || !userId || !sessionId || questionIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: image, userId, sessionId, questionIndex'
      });
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Check if HF client is available - graceful fallback
    if (!hf) {
      const emotionLog = new EmotionLog({
        userId, sessionId, questionIndex,
        emotion: 'neutral',
        confidence: 1.0,
        frictionScore: 1,
        timestamp: new Date()
      });
      await emotionLog.save();
      return res.status(200).json({
        success: true,
        data: { emotion: 'neutral', confidence: 1.0, timestamp: emotionLog.timestamp }
      });
    }

    // Call Hugging Face emotion recognition model
    // Using a popular emotion detection model
    const result = await hf.imageClassification({
      data: imageBuffer,
      model: 'dima806/facial_emotions_image_detection'
    });

    if (!result || result.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to detect emotion'
      });
    }

    // Get the top prediction
    const topPrediction = result[0];
    const emotion = mapEmotion(topPrediction.label);   // ← mapped now
    const confidence = topPrediction.score;

    // Save emotion log to database (NOT the image)
    const emotionLog = new EmotionLog({
      userId,
      sessionId,
      questionIndex,
      emotion,
      confidence,
      frictionScore: frictionScore[emotion] || 1,      // ← new field
      timestamp: new Date()
    });

    await emotionLog.save();

    // Return emotion and confidence
    res.status(200).json({
      success: true,
      data: {
        emotion,
        confidence,
        timestamp: emotionLog.timestamp
      }
    });

  } catch (error) {
    console.error('Emotion detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting emotion',
      error: error.message
    });
  }
};

// Get emotion summary for a session
export const getEmotionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const emotions = await EmotionLog.find({ sessionId }).sort({ timestamp: 1 });

    if (emotions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalCaptures: 0,
          summary: {}
        }
      });
    }

    // Calculate emotion summary
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
    res.status(500).json({
      success: false,
      message: 'Error fetching emotion summary',
      error: error.message
    });
  }
};

// ── Feature 3: Class Emotional Heatmap (Teacher view) ───────────────
export const getClassEmotionHeatmap = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { sessionIds } = req.query;

    let query = {};
    if (sessionIds) {
      query.sessionId = { $in: sessionIds.split(',') };
    } else if (quizId) {
      const attempts = await QuizAttempt.find({ quizId }).select('sessionId userId');
      query.sessionId = { $in: attempts.map(a => a.sessionId) };
    }

    const emotionLogs = await EmotionLog.find(query)
      .populate('userId', 'name')
      .sort({ questionIndex: 1 });

    if (emotionLogs.length === 0) {
      return res.status(200).json({
        success: true,
        data: { heatmap: [], summary: {}, totalStudents: 0 }
      });
    }

    // Build per-question heatmap
    const byQuestion = {};
    const studentSet = new Set();

    emotionLogs.forEach(log => {
      const qIdx = log.questionIndex;
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

    // Convert to array with computed metrics
    const heatmap = Object.values(byQuestion).map(q => {
      const avgFriction = q.totalFriction / q.totalCaptures;
      const dominantEmotion = Object.entries(q.emotions)
        .sort(([, a], [, b]) => b - a)[0][0];
      const intensity = Math.min(1, avgFriction / 5);   // 0.0–1.0 for frontend colour

      return {
        questionIndex: q.questionIndex,
        totalCaptures: q.totalCaptures,
        studentsAffected: q.students.size,
        avgFriction: Math.round(avgFriction * 100) / 100,
        intensity,
        dominantEmotion,
        emotionBreakdown: q.emotions,
        frustrationRate: Math.round(
          ((q.emotions.angry || 0) + (q.emotions.confused || 0) + (q.emotions.anxious || 0))
          / q.totalCaptures * 100
        )
      };
    }).sort((a, b) => a.questionIndex - b.questionIndex);

    // Class-level summary
    const overallEmotions = {};
    emotionLogs.forEach(l => {
      overallEmotions[l.emotion] = (overallEmotions[l.emotion] || 0) + 1;
    });

    const frictionHotspots = [...heatmap]
      .sort((a, b) => b.avgFriction - a.avgFriction)
      .slice(0, 3)
      .map(q => q.questionIndex);

    res.status(200).json({
      success: true,
      data: {
        heatmap,
        summary: {
          totalStudents: studentSet.size,
          totalEmotionCaptures: emotionLogs.length,
          overallEmotionBreakdown: overallEmotions,
          frictionHotspots,
          classAvgFriction: Math.round(
            heatmap.reduce((s, q) => s + q.avgFriction, 0) / heatmap.length * 100
          ) / 100
        }
      }
    });

  } catch (error) {
    console.error('Class heatmap error:', error);
    res.status(500).json({ success: false, message: 'Error generating heatmap', error: error.message });
  }
};

// ── Feature 3: Per-student emotion report (Teacher view) ────────────
export const getStudentEmotionReport = async (req, res) => {
  try {
    const { studentId, sessionId } = req.params;

    const logs = await EmotionLog.find({ userId: studentId, sessionId })
      .sort({ questionIndex: 1 });

    if (logs.length === 0) {
      return res.status(200).json({ success: true, data: { logs: [], summary: {} } });
    }

    // Group emotions by question
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
        studentId,
        sessionId,
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
