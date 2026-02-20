import { HfInference } from '@huggingface/inference';
import EmotionLog from '../models/emotionLog.js';

// Initialize Hugging Face client
const hf = process.env.HF_API_KEY && process.env.HF_API_KEY !== 'hf_dummy_key_for_testing' 
  ? new HfInference(process.env.HF_API_KEY) 
  : null;

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

    // Check if HF client is available
    if (!hf) {
      return res.status(503).json({
        success: false,
        message: 'Emotion detection not available - API key not configured'
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
    const emotion = topPrediction.label.toLowerCase();
    const confidence = topPrediction.score;

    // Save emotion log to database (NOT the image)
    const emotionLog = new EmotionLog({
      userId,
      sessionId,
      questionIndex,
      emotion,
      confidence,
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

    res.status(200).json({
      success: true,
      data: {
        totalCaptures: emotions.length,
        mostCommonEmotion,
        emotionCounts,
        timeline: emotions.map(e => ({
          emotion: e.emotion,
          questionIndex: e.questionIndex,
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
