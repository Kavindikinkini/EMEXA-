import Mood from "../models/mood.js";
import WellnessActivity from "../models/wellnessActivity.js";

// Save user mood
export const saveMood = async (req, res) => {
  try {
    const { mood, emoji } = req.body;
    const userId = req.user._id || req.userId; // Support both formats

    const newMood = new Mood({
      userId,
      mood,
      emoji,
      timestamp: new Date(),
    });

    await newMood.save();

    res.status(201).json({
      success: true,
      message: "Mood saved successfully",
      data: newMood,
    });
  } catch (error) {
    console.error("Error saving mood:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save mood",
      error: error.message,
    });
  }
};

// Get mood history for a user
export const getMoodHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.userId;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const moodHistory = await Mood.find({
      userId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: moodHistory,
    });
  } catch (error) {
    console.error("Error fetching mood history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mood history",
      error: error.message,
    });
  }
};

// Get latest mood for a user
export const getLatestMood = async (req, res) => {
  try {
    const userId = req.user._id || req.userId;

    const latestMood = await Mood.findOne({ userId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: latestMood,
    });
  } catch (error) {
    console.error("Error fetching latest mood:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest mood",
      error: error.message,
    });
  }
};

// Save wellness activity
export const saveActivity = async (req, res) => {
  try {
    const { activityType, duration, notes } = req.body;
    const userId = req.user._id || req.userId;

    const newActivity = new WellnessActivity({
      userId,
      activityType,
      duration,
      notes,
      completedAt: new Date(),
    });

    await newActivity.save();

    res.status(201).json({
      success: true,
      message: "Activity saved successfully",
      data: newActivity,
    });
  } catch (error) {
    console.error("Error saving activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save activity",
      error: error.message,
    });
  }
};

// Get user wellness activities
export const getActivities = async (req, res) => {
  try {
    const userId = req.user._id || req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activities = await WellnessActivity.find({
      userId,
      completedAt: { $gte: startDate },
    }).sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};

// Get random wellness tips
export const getWellnessTips = async (req, res) => {
  try {
    const tips = [
      "Small steps every day lead to big changes over time. Be patient with yourself.",
      "Take a 5-minute break every hour to stretch and breathe deeply.",
      "Practice gratitude by writing down three things you're thankful for each day.",
      "Stay hydrated - drink at least 8 glasses of water throughout the day.",
      "Get 7-9 hours of quality sleep each night for better mental health.",
      "Connect with friends or family - social connections boost wellbeing.",
      "Try mindfulness meditation for just 10 minutes a day.",
      "Exercise regularly - even a short walk can improve your mood.",
      "Set small, achievable goals to build confidence and momentum.",
      "Remember to celebrate your wins, no matter how small they are.",
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    res.status(200).json({
      success: true,
      data: { tip: randomTip },
    });
  } catch (error) {
    console.error("Error fetching wellness tips:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wellness tips",
      error: error.message,
    });
  }
};