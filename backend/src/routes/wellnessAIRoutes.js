// backend/src/routes/wellnessAIRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import wellnessAIService from '../services/wellnessAIService.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/wellness-ai/mood-advice
 * @desc    Get AI-generated advice based on mood
 * @access  Private
 */
router.post('/mood-advice', async (req, res) => {
  try {
    const { mood, emoji, recentMoods } = req.body;
    const userName = req.user?.name || req.user?.username || 'Student';

    if (!mood) {
      return res.status(400).json({
        success: false,
        message: 'Mood is required'
      });
    }

    console.log(`🧘 Generating mood advice for ${userName}: ${mood} ${emoji}`);

    const result = await wellnessAIService.generateMoodAdvice({
      mood,
      emoji,
      userName,
      recentMoods: recentMoods || []
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Error in mood-advice route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate mood advice',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/wellness-ai/daily-tip
 * @desc    Get AI-generated daily wellness tip
 * @access  Private
 */
router.get('/daily-tip', async (req, res) => {
  try {
    const userContext = {
      recentActivity: req.query.activity || null
    };

    const result = await wellnessAIService.generateDailyTip(userContext);

    res.json(result);

  } catch (error) {
    console.error('❌ Error in daily-tip route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily tip',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/wellness-ai/analyze-patterns
 * @desc    Analyze mood patterns and get insights
 * @access  Private
 */
router.post('/analyze-patterns', async (req, res) => {
  try {
    const { moodHistory } = req.body;

    if (!moodHistory || !Array.isArray(moodHistory)) {
      return res.status(400).json({
        success: false,
        message: 'Mood history is required'
      });
    }

    const result = await wellnessAIService.analyzeMoodPatterns(moodHistory);

    res.json(result);

  } catch (error) {
    console.error('❌ Error in analyze-patterns route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze patterns',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/wellness-ai/chat
 * @desc    Chat with AI wellness coach (uses Gemini API)
 * @access  Private
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const userName = req.user?.name || req.user?.username || 'Student';

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log(`💬 Processing chat message for ${userName}`);

    const result = await wellnessAIService.generateChatResponse({
      message: message.trim(),
      history: history || [],
      userName
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Error in chat route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate chat response',
      error: error.message
    });
  }
});

export default router;