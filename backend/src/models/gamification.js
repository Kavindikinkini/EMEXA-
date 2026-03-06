// backend/src/models/gamification.js
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  type: {
  type: String,
  enum: [
    'first_quiz',
    'perfect_score',
    'quiz_streak_3',
    'quiz_streak_5',
    'quiz_streak_10',
    'early_bird',
    'night_owl',
    'mood_tracker_7days',
    'mood_tracker_30days',
    'wellness_warrior',
    'calm_master',
    'quick_learner',
    'persistent_learner',
    'no_hints_used',
    'emotion_stable',
    'level_up_5',
    'level_up_10',
    'hundred_points',
    'thousand_points',
    // ✅ ADD THESE NEW GAME ACHIEVEMENTS:
    'game_perfect_score',
    'speed_demon',
    'game_enthusiast'
  ],
  required: true
},
  
  title: String,
  description: String,
  icon: String,
  points: Number,
  unlockedAt: {
    type: Date,
    default: Date.now
  }
});

const leaderboardEntrySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  rank: Number,
  weeklyPoints: {
    type: Number,
    default: 0
  },
  monthlyPoints: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const pointsHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['quiz', 'wellness', 'achievement', 'streak', 'bonus', 'game'],
    required: true
  },
  relatedId: mongoose.Schema.Types.ObjectId,
  earnedAt: {
    type: Date,
    default: Date.now
  }
});

const streakSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: Date,
  streakType: {
    type: String,
    enum: ['quiz', 'mood', 'wellness'],
    default: 'quiz'
  }
});

export const Achievement = mongoose.model('Achievement', achievementSchema);
export const LeaderboardEntry = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);
export const PointsHistory = mongoose.model('PointsHistory', pointsHistorySchema);
export const Streak = mongoose.model('Streak', streakSchema);