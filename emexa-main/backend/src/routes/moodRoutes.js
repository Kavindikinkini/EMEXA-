import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Mood from '../models/mood.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/moods
 * @desc    Save a new mood entry
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { mood, emoji, value, notes } = req.body;

    // Validation
    if (!mood || !emoji || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Mood, emoji, and value are required'
      });
    }

    if (value < 1 || value > 5) {
      return res.status(400).json({
        success: false,
        message: 'Value must be between 1 and 5'
      });
    }

    // Check if mood entry for today already exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingMood = await Mood.findOne({
      userId: req.user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    let moodEntry;

    if (existingMood) {
      // Update existing mood for today
      existingMood.mood = mood;
      existingMood.emoji = emoji;
      existingMood.value = value;
      if (notes) existingMood.notes = notes;
      
      moodEntry = await existingMood.save();
      
      console.log(`✅ Updated mood for user ${req.user._id}: ${mood} ${emoji}`);
    } else {
      // Create new mood entry
      moodEntry = await Mood.create({
        userId: req.user._id,
        mood,
        emoji,
        value,
        date: new Date(),
        notes: notes || ''
      });
      
      console.log(`✅ Created new mood for user ${req.user._id}: ${mood} ${emoji}`);
    }

    res.status(201).json({
      success: true,
      message: 'Mood saved successfully',
      data: moodEntry
    });

  } catch (error) {
    console.error('❌ Error saving mood:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save mood entry',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/moods/history
 * @desc    Get user's mood history (last 7 days)
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const moods = await Mood.find({
      userId: req.user._id,
      date: { $gte: startDate }
    })
    .sort({ date: 1 })
    .select('mood emoji value date notes');

    // Format for chart - ensure we have entries for all 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedMoods = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      date.setHours(0, 0, 0, 0);
      
      const dayName = dayNames[date.getDay()];
      
      // Find mood entry for this date
      const moodEntry = moods.find(m => {
        const moodDate = new Date(m.date);
        moodDate.setHours(0, 0, 0, 0);
        return moodDate.getTime() === date.getTime();
      });
      
      if (moodEntry) {
        formattedMoods.push({
          date: dayName,
          mood: moodEntry.mood,
          emoji: moodEntry.emoji,
          value: moodEntry.value,
          fullDate: date.toISOString()
        });
      } else {
        // No mood entry for this day - add placeholder with value 0
        formattedMoods.push({
          date: dayName,
          mood: 'No Entry',
          emoji: '⚪',
          value: 0,
          fullDate: date.toISOString()
        });
      }
    }

    console.log(`📊 Fetched ${moods.length} mood entries for user ${req.user._id}`);

    res.json({
      success: true,
      count: moods.length,
      data: formattedMoods
    });

  } catch (error) {
    console.error('❌ Error fetching mood history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mood history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/moods/weekly-summary
 * @desc    Get weekly mood summary with statistics
 * @access  Private
 */
router.get('/weekly-summary', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const moods = await Mood.find({
      userId: req.user._id,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 });

    if (moods.length === 0) {
      return res.json({
        success: true,
        message: 'No mood data available',
        data: {
          totalEntries: 0,
          averageMood: 0,
          positiveDays: 0,
          negativeDays: 0,
          neutralDays: 0,
          mostCommonMood: null
        }
      });
    }

    // Calculate statistics
    const totalValue = moods.reduce((sum, m) => sum + m.value, 0);
    const averageMood = totalValue / moods.length;
    
    const positiveDays = moods.filter(m => m.value >= 4).length;
    const negativeDays = moods.filter(m => m.value <= 2).length;
    const neutralDays = moods.filter(m => m.value === 3).length;

    // Find most common mood
    const moodCounts = {};
    moods.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
    
    const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b
    );

    const summary = {
      totalEntries: moods.length,
      averageMood: Math.round(averageMood * 10) / 10,
      positiveDays,
      negativeDays,
      neutralDays,
      mostCommonMood,
      trend: averageMood >= 4 ? 'positive' : averageMood >= 3 ? 'neutral' : 'concerning'
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Error fetching weekly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly summary',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/moods/today
 * @desc    Get today's mood entry
 * @access  Private
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMood = await Mood.findOne({
      userId: req.user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (!todayMood) {
      return res.json({
        success: true,
        message: 'No mood entry for today',
        data: null
      });
    }

    res.json({
      success: true,
      data: todayMood
    });

  } catch (error) {
    console.error('❌ Error fetching today\'s mood:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s mood',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/moods/:id
 * @desc    Delete a mood entry
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const mood = await Mood.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!mood) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    await mood.deleteOne();

    console.log(`🗑️ Deleted mood entry ${req.params.id} for user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Mood entry deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting mood:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mood entry',
      error: error.message
    });
  }
});

export default router;