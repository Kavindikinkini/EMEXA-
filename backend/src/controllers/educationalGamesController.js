// backend/src/controllers/educationalGamesController.js
import { 
  generateTriviaQuestions, 
  generateMemoryPairs, 
  generateWordScrambles,
  generateGameFeedback 
} from '../services/geminiGameService.js';
import { PointsHistory, LeaderboardEntry, Achievement } from '../models/gamification.js';
import GameScore from '../models/gameScore.js';

// Get trivia questions
export const getTriviaQuestions = async (req, res) => {
  try {
    const { subject, difficulty = 'medium', count = 5 } = req.query;

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const questions = await generateTriviaQuestions(subject, difficulty, parseInt(count));

    res.json({
      success: true,
      questions,
      subject,
      difficulty,
      count: questions.length
    });
  } catch (error) {
    console.error('Error getting trivia questions:', error);
    // Return fallback questions if API fails
    res.status(200).json({
      questions: [
        { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"], correctIndex: 1, explanation: "Mitochondria produce ATP energy for the cell.", funFact: "Mitochondria have their own DNA!" },
        { question: "What is H2O?", options: ["Oxygen", "Hydrogen", "Water", "Salt"], correctIndex: 2, explanation: "H2O is the chemical formula for water.", funFact: "Water covers 71% of Earth's surface." },
        { question: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], correctIndex: 1, explanation: "There are 8 planets after Pluto was reclassified.", funFact: "Jupiter is larger than all other planets combined." },
        { question: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2, explanation: "Plants absorb CO2 for photosynthesis.", funFact: "A single tree can absorb 48 lbs of CO2 per year." },
        { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"], correctIndex: 0, explanation: "Light travels at approximately 300,000 km per second.", funFact: "Light from the Sun takes 8 minutes to reach Earth." }
      ]
    });
  }
};

// Get memory match pairs
export const getMemoryPairs = async (req, res) => {
  try {
    const { subject, difficulty = 'medium', count = 8 } = req.query;

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const pairs = await generateMemoryPairs(subject, difficulty, parseInt(count));

    res.json({
      success: true,
      pairs,
      subject,
      difficulty,
      count: pairs.length
    });
  } catch (error) {
    console.error('Error getting memory pairs:', error);
    res.status(500).json({ 
      message: 'Failed to generate memory pairs',
      error: error.message 
    });
  }
};

// Get word scrambles
export const getWordScrambles = async (req, res) => {
  try {
    const { subject, difficulty = 'medium', count = 10 } = req.query;

    if (!subject) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const words = await generateWordScrambles(subject, difficulty, parseInt(count));

    res.json({
      success: true,
      words,
      subject,
      difficulty,
      count: words.length
    });
  } catch (error) {
    console.error('Error getting word scrambles:', error);
    res.status(500).json({ 
      message: 'Failed to generate word scrambles',
      error: error.message 
    });
  }
};

// Submit game score and award points
export const submitGameScore = async (req, res) => {
  try {
    const { studentId, gameType, score, totalQuestions, timeSpent, subject, difficulty } = req.body;

    if (!studentId || !gameType || score === undefined || !totalQuestions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate points based on performance
    const percentage = (score / totalQuestions) * 100;
    let points = Math.floor(percentage / 2); // Base points (0-50)

    // Difficulty multiplier
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2
    };
    points = Math.floor(points * (difficultyMultiplier[difficulty] || 1));

    // Time bonus (if completed quickly)
    const avgTimePerQuestion = timeSpent / totalQuestions;
    if (avgTimePerQuestion < 10) points += 10; // Quick completion bonus
    if (avgTimePerQuestion < 5) points += 10; // Extra quick bonus

    // Perfect score bonus
    if (percentage === 100) points += 20;

    // Minimum points
    points = Math.max(points, 5);

    // Save game score
    const gameScore = await GameScore.create({
      studentId,
      gameType,
      score,
      totalQuestions,
      percentage,
      timeSpent,
      subject,
      difficulty,
      pointsEarned: points
    });

    // Award points to gamification system
    await PointsHistory.create({
      studentId,
      points,
      reason: `${gameType} Game: ${subject} (${difficulty})`,
      source: 'game',
      relatedId: gameScore._id
    });

    // Update leaderboard
    let leaderboard = await LeaderboardEntry.findOne({ studentId });
    if (!leaderboard) {
      leaderboard = await LeaderboardEntry.create({ studentId, totalPoints: points });
    } else {
      leaderboard.totalPoints += points;
      leaderboard.weeklyPoints += points;
      leaderboard.monthlyPoints += points;
      leaderboard.level = Math.floor(leaderboard.totalPoints / 100) + 1;
      await leaderboard.save();
    }

    // Check for game achievements
    await checkGameAchievements(studentId, gameType, percentage, timeSpent, totalQuestions);

    // Generate AI feedback
    const feedback = await generateGameFeedback(gameType, score, totalQuestions, timeSpent);

    res.json({
      success: true,
      pointsEarned: points,
      totalPoints: leaderboard.totalPoints,
      level: leaderboard.level,
      feedback,
      gameScore: {
        score,
        percentage: Math.round(percentage),
        timeSpent
      }
    });
  } catch (error) {
    console.error('Error submitting game score:', error);
    res.status(500).json({ 
      message: 'Failed to submit game score',
      error: error.message 
    });
  }
};

// Check and unlock game achievements
const checkGameAchievements = async (studentId, gameType, percentage, timeSpent, totalQuestions) => {
  try {
    const achievements = [];

    // Perfect score
    if (percentage === 100) {
      const existing = await Achievement.findOne({ studentId, type: 'game_perfect_score' });
      if (!existing) {
        const achievement = await Achievement.create({
          studentId,
          type: 'game_perfect_score',
          title: '🎯 Game Master',
          description: 'Perfect score in an educational game',
          icon: '🎯',
          points: 30
        });
        achievements.push(achievement);
        
        await PointsHistory.create({
          studentId,
          points: 30,
          reason: 'Achievement: Game Master',
          source: 'achievement',
          relatedId: achievement._id
        });
      }
    }

    // Speed demon (avg < 5 seconds per question)
    const avgTime = timeSpent / totalQuestions;
    if (avgTime < 5 && percentage >= 80) {
      const existing = await Achievement.findOne({ studentId, type: 'speed_demon' });
      if (!existing) {
        const achievement = await Achievement.create({
          studentId,
          type: 'speed_demon',
          title: '⚡ Speed Demon',
          description: 'Complete game quickly with high score',
          icon: '⚡',
          points: 25
        });
        achievements.push(achievement);
        
        await PointsHistory.create({
          studentId,
          points: 25,
          reason: 'Achievement: Speed Demon',
          source: 'achievement',
          relatedId: achievement._id
        });
      }
    }

    // Game streak (play 5 games in a day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gamesPlayedToday = await GameScore.countDocuments({
      studentId,
      playedAt: { $gte: today }
    });

    if (gamesPlayedToday >= 5) {
      const existing = await Achievement.findOne({ studentId, type: 'game_enthusiast' });
      if (!existing) {
        const achievement = await Achievement.create({
          studentId,
          type: 'game_enthusiast',
          title: '🎮 Game Enthusiast',
          description: 'Play 5 games in one day',
          icon: '🎮',
          points: 40
        });
        achievements.push(achievement);
        
        await PointsHistory.create({
          studentId,
          points: 40,
          reason: 'Achievement: Game Enthusiast',
          source: 'achievement',
          relatedId: achievement._id
        });
      }
    }

    return achievements;
  } catch (error) {
    console.error('Error checking game achievements:', error);
    return [];
  }
};

// Get game leaderboard
export const getGameLeaderboard = async (req, res) => {
  try {
    const { gameType, subject, limit = 10 } = req.query;

    const filter = {};
    if (gameType) filter.gameType = gameType;
    if (subject) filter.subject = subject;

    const topScores = await GameScore.find(filter)
      .populate('studentId', 'name profileImage')
      .sort('-percentage -pointsEarned')
      .limit(parseInt(limit));

    const leaderboard = topScores.map((score, index) => ({
      rank: index + 1,
      student: score.studentId,
      score: score.score,
      percentage: score.percentage,
      points: score.pointsEarned,
      timeSpent: score.timeSpent,
      gameType: score.gameType,
      subject: score.subject,
      playedAt: score.playedAt
    }));

    res.json({
      success: true,
      leaderboard,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Error getting game leaderboard:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
};

// Get student game stats
export const getStudentGameStats = async (req, res) => {
  try {
    const { studentId } = req.params;

    const totalGames = await GameScore.countDocuments({ studentId });
    const gameScores = await GameScore.find({ studentId }).sort('-playedAt').limit(10);
    
    const avgScore = gameScores.length > 0
      ? gameScores.reduce((sum, game) => sum + game.percentage, 0) / gameScores.length
      : 0;

    const totalPointsEarned = gameScores.reduce((sum, game) => sum + game.pointsEarned, 0);

    const favoriteSubject = await GameScore.aggregate([
      { $match: { studentId: studentId } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      success: true,
      stats: {
        totalGames,
        averageScore: Math.round(avgScore),
        totalPointsEarned,
        favoriteSubject: favoriteSubject[0]?._id || 'None',
        recentGames: gameScores
      }
    });
  } catch (error) {
    console.error('Error getting student game stats:', error);
    res.status(500).json({ message: 'Failed to get game stats' });
  }
};