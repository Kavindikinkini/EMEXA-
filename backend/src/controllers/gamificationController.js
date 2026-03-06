// backend/src/controllers/gamificationController.js
import { Achievement, LeaderboardEntry, PointsHistory, Streak } from '../models/gamification.js';
import Student from '../models/student.js';
import QuizAttempt from '../models/quizAttempt.js';

// Achievement definitions
const ACHIEVEMENTS = {
  first_quiz: { title: '🎯 First Steps', description: 'Complete your first quiz', points: 10, icon: '🎯' },
  perfect_score: { title: '💯 Perfect Score', description: 'Score 100% on a quiz', points: 50, icon: '💯' },
  quiz_streak_3: { title: '🔥 On Fire!', description: 'Complete 3 quizzes in a row', points: 30, icon: '🔥' },
  quiz_streak_5: { title: '⚡ Unstoppable', description: 'Complete 5 quizzes in a row', points: 50, icon: '⚡' },
  quiz_streak_10: { title: '👑 Legend', description: 'Complete 10 quizzes in a row', points: 100, icon: '👑' },
  early_bird: { title: '🌅 Early Bird', description: 'Complete a quiz before 8 AM', points: 20, icon: '🌅' },
  night_owl: { title: '🦉 Night Owl', description: 'Complete a quiz after 10 PM', points: 20, icon: '🦉' },
  mood_tracker_7days: { title: '😊 Week Warrior', description: 'Track mood for 7 consecutive days', points: 25, icon: '😊' },
  mood_tracker_30days: { title: '🌟 Mood Master', description: 'Track mood for 30 consecutive days', points: 100, icon: '🌟' },
  wellness_warrior: { title: '💪 Wellness Warrior', description: 'Complete 10 wellness activities', points: 40, icon: '💪' },
  calm_master: { title: '🧘 Calm Master', description: 'Maintain calm emotion for entire quiz', points: 30, icon: '🧘' },
  quick_learner: { title: '⚡ Quick Learner', description: 'Complete quiz in under 10 minutes', points: 25, icon: '⚡' },
  no_hints_used: { title: '🎖️ Self-Reliant', description: 'Complete quiz without using hints', points: 40, icon: '🎖️' },
  level_up_5: { title: '⭐ Level 5', description: 'Reach level 5', points: 50, icon: '⭐' },
  level_up_10: { title: '🌟 Level 10', description: 'Reach level 10', points: 100, icon: '🌟' },
  hundred_points: { title: '💰 Century', description: 'Earn 100 total points', points: 10, icon: '💰' },
  thousand_points: { title: '💎 Millionaire', description: 'Earn 1000 total points', points: 50, icon: '💎' }
};

// Award points and check for achievements
export const awardPoints = async (req, res) => {
  try {
    const { studentId, points, reason, source, relatedId } = req.body;

    // Create points history
    const pointsEntry = await PointsHistory.create({
      studentId,
      points,
      reason,
      source,
      relatedId
    });

    // Update leaderboard
    let leaderboardEntry = await LeaderboardEntry.findOne({ studentId });
    
    if (!leaderboardEntry) {
      leaderboardEntry = await LeaderboardEntry.create({
        studentId,
        totalPoints: points
      });
    } else {
      leaderboardEntry.totalPoints += points;
      leaderboardEntry.weeklyPoints += points;
      leaderboardEntry.monthlyPoints += points;
      
      // Calculate level (100 points per level)
      leaderboardEntry.level = Math.floor(leaderboardEntry.totalPoints / 100) + 1;
      
      await leaderboardEntry.save();
    }

    // Check for point-based achievements
    await checkPointAchievements(studentId, leaderboardEntry.totalPoints, leaderboardEntry.level);

    res.json({
      success: true,
      pointsAwarded: points,
      totalPoints: leaderboardEntry.totalPoints,
      level: leaderboardEntry.level
    });
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({ message: 'Failed to award points', error: error.message });
  }
};

// Check and unlock achievements
const checkPointAchievements = async (studentId, totalPoints, level) => {
  const achievementsToUnlock = [];

  // Check point milestones
  if (totalPoints >= 100 && !(await Achievement.findOne({ studentId, type: 'hundred_points' }))) {
    achievementsToUnlock.push('hundred_points');
  }
  if (totalPoints >= 1000 && !(await Achievement.findOne({ studentId, type: 'thousand_points' }))) {
    achievementsToUnlock.push('thousand_points');
  }

  // Check level milestones
  if (level >= 5 && !(await Achievement.findOne({ studentId, type: 'level_up_5' }))) {
    achievementsToUnlock.push('level_up_5');
  }
  if (level >= 10 && !(await Achievement.findOne({ studentId, type: 'level_up_10' }))) {
    achievementsToUnlock.push('level_up_10');
  }

  // Unlock achievements
  for (const type of achievementsToUnlock) {
    await unlockAchievement(studentId, type);
  }
};

// Unlock achievement
const unlockAchievement = async (studentId, type) => {
  const achievementData = ACHIEVEMENTS[type];
  
  const achievement = await Achievement.create({
    studentId,
    type,
    title: achievementData.title,
    description: achievementData.description,
    icon: achievementData.icon,
    points: achievementData.points
  });

  // Award points for achievement
  await PointsHistory.create({
    studentId,
    points: achievementData.points,
    reason: `Achievement unlocked: ${achievementData.title}`,
    source: 'achievement',
    relatedId: achievement._id
  });

  return achievement;
};

// Get student achievements
export const getAchievements = async (req, res) => {
  try {
    const { studentId } = req.params;

    const achievements = await Achievement.find({ studentId }).sort('-unlockedAt');
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = achievements.length;

    // Get locked achievements
    const unlockedTypes = achievements.map(a => a.type);
    const lockedAchievements = Object.keys(ACHIEVEMENTS)
      .filter(type => !unlockedTypes.includes(type))
      .map(type => ({
        type,
        ...ACHIEVEMENTS[type],
        locked: true
      }));

    res.json({
      unlocked: achievements,
      locked: lockedAchievements,
      progress: {
        unlocked: unlockedCount,
        total: totalAchievements,
        percentage: Math.round((unlockedCount / totalAchievements) * 100)
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Failed to get achievements' });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'all', limit = 10 } = req.query;

    let sortField = 'totalPoints';
    if (type === 'weekly') sortField = 'weeklyPoints';
    if (type === 'monthly') sortField = 'monthlyPoints';

    const leaderboard = await LeaderboardEntry.find()
      .populate('studentId', 'name profileImage')
      .sort(`-${sortField}`)
      .limit(parseInt(limit));

    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      student: entry.studentId,
      points: entry[sortField],
      totalPoints: entry.totalPoints,
      level: entry.level
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
};

// Get student stats
export const getStudentStats = async (req, res) => {
  try {
    const { studentId } = req.params;

    const leaderboard = await LeaderboardEntry.findOne({ studentId });
    const achievements = await Achievement.find({ studentId });
    const pointsHistory = await PointsHistory.find({ studentId })
      .sort('-earnedAt')
      .limit(10);
    const streak = await Streak.findOne({ studentId });

    res.json({
      points: {
        total: leaderboard?.totalPoints || 0,
        weekly: leaderboard?.weeklyPoints || 0,
        monthly: leaderboard?.monthlyPoints || 0
      },
      level: leaderboard?.level || 1,
      achievements: achievements.length,
      streak: streak?.currentStreak || 0,
      recentPoints: pointsHistory
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ message: 'Failed to get student stats' });
  }
};

// Update streak
export const updateStreak = async (req, res) => {
  try {
    const { studentId, type } = req.body;

    let streak = await Streak.findOne({ studentId, streakType: type });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      streak = await Streak.create({
        studentId,
        streakType: type,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today
      });
    } else {
      const lastDate = new Date(streak.lastActivityDate);
      lastDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Continue streak
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        streak.currentStreak = 1;
      }
      // daysDiff === 0 means already counted today

      streak.lastActivityDate = today;
      await streak.save();
    }

    // Check for streak achievements
    if (type === 'quiz') {
      if (streak.currentStreak === 3) await unlockAchievement(studentId, 'quiz_streak_3');
      if (streak.currentStreak === 5) await unlockAchievement(studentId, 'quiz_streak_5');
      if (streak.currentStreak === 10) await unlockAchievement(studentId, 'quiz_streak_10');
    }

    res.json({
      success: true,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak
    });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ message: 'Failed to update streak' });
  }
};

// Check quiz completion achievements
export const checkQuizAchievements = async (req, res) => {
  try {
    const { studentId, quizId, attemptId } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    const achievements = [];

    // First quiz
    const quizCount = await QuizAttempt.countDocuments({ studentId });
    if (quizCount === 1) {
      achievements.push(await unlockAchievement(studentId, 'first_quiz'));
    }

    // Perfect score
    if (attempt.percentage === 100) {
      achievements.push(await unlockAchievement(studentId, 'perfect_score'));
    }

    // No hints used
    if (attempt.hintsUsed === 0) {
      const existing = await Achievement.findOne({ studentId, type: 'no_hints_used' });
      if (!existing) {
        achievements.push(await unlockAchievement(studentId, 'no_hints_used'));
      }
    }

    // Quick learner (under 10 minutes)
    if (attempt.timeSpent < 10) {
      const existing = await Achievement.findOne({ studentId, type: 'quick_learner' });
      if (!existing) {
        achievements.push(await unlockAchievement(studentId, 'quick_learner'));
      }
    }

    // Time-based achievements
    const hour = new Date(attempt.submittedAt).getHours();
    if (hour < 8) {
      const existing = await Achievement.findOne({ studentId, type: 'early_bird' });
      if (!existing) {
        achievements.push(await unlockAchievement(studentId, 'early_bird'));
      }
    } else if (hour >= 22) {
      const existing = await Achievement.findOne({ studentId, type: 'night_owl' });
      if (!existing) {
        achievements.push(await unlockAchievement(studentId, 'night_owl'));
      }
    }

    res.json({
      success: true,
      achievementsUnlocked: achievements.length,
      achievements
    });
  } catch (error) {
    console.error('Check quiz achievements error:', error);
    res.status(500).json({ message: 'Failed to check achievements' });
  }
};