import mongoose from "mongoose";
import EmotionSession from "../models/EmotionSession.js";
import LearningPath from "../models/LearningPath.js";

// Helper: convert string id to ObjectId safely
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// ─────────────────────────────────────────────────────────────
// POST /api/learning-path/session
// ─────────────────────────────────────────────────────────────
const logEmotionSession = async (req, res) => {
  try {
    const studentId = req.userId;
    const {
      topic,
      subject = "General",
      emotionLog = [],
      correctAnswers = 0,
      totalQuestions = 1,
      durationMinutes = 0,
      quizId = null,
    } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "topic is required" });
    }

    const scores = EmotionSession.computeScores(emotionLog);
    const scorePercent =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const now = new Date();

    const session = await EmotionSession.create({
      studentId: toObjectId(studentId),
      topic,
      subject,
      quizId,
      emotionLog,
      durationMinutes,
      correctAnswers,
      totalQuestions,
      scorePercent,
      timeOfDay: EmotionSession.getTimeOfDay(now),
      sessionDate: now,
      ...scores,
    });

    // Rebuild path in background
    rebuildLearningPath(studentId).catch((err) =>
      console.error("[AELP] Path rebuild error:", err.message)
    );

    res.status(201).json({ message: "Session logged successfully", sessionId: session._id });
  } catch (error) {
    console.error("[AELP] logEmotionSession:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/learning-path
// ─────────────────────────────────────────────────────────────
const getLearningPath = async (req, res) => {
  try {
    const studentId = req.userId;

    let path = await LearningPath.findOne({ studentId: toObjectId(studentId) });

    if (!path) {
      // Try to build from existing sessions
      path = await rebuildLearningPath(studentId);
    }

    // Still no data (no sessions yet) — return empty state
    if (!path) {
      return res.json({
        topics: [],
        overallEngagement: 50,
        overallFrustration: 0,
        burnoutRisk: "low",
        currentStreak: 0,
        longestStreak: 0,
        recommendedDailyMinutes: 30,
        lastUpdated: new Date(),
      });
    }

    res.json(path);
  } catch (error) {
    console.error("[AELP] getLearningPath:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/learning-path/emotion-history
// ─────────────────────────────────────────────────────────────
const getEmotionHistory = async (req, res) => {
  try {
    const studentId = req.userId;
    const { topic, days = 30 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const filter = {
      studentId: toObjectId(studentId),
      sessionDate: { $gte: since },
    };
    if (topic) filter.topic = topic;

    const sessions = await EmotionSession.find(filter)
      .sort({ sessionDate: 1 })
      .select(
        "topic subject sessionDate engagementScore frustrationScore calmScore scorePercent dominantEmotion timeOfDay durationMinutes"
      )
      .lean();

    res.json(sessions);
  } catch (error) {
    console.error("[AELP] getEmotionHistory:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/learning-path/topic-summary
// ─────────────────────────────────────────────────────────────
const getTopicSummary = async (req, res) => {
  try {
    const studentId = req.userId;

    const summary = await EmotionSession.aggregate([
      { $match: { studentId: toObjectId(studentId) } },
      {
        $group: {
          _id: "$topic",
          subject: { $last: "$subject" },
          sessionCount: { $sum: 1 },
          avgEngagement: { $avg: "$engagementScore" },
          avgFrustration: { $avg: "$frustrationScore" },
          avgScore: { $avg: "$scorePercent" },
          lastStudied: { $max: "$sessionDate" },
          dominantEmotions: { $push: "$dominantEmotion" },
        },
      },
      {
        $project: {
          topic: "$_id",
          subject: 1,
          sessionCount: 1,
          avgEngagement: { $round: ["$avgEngagement", 1] },
          avgFrustration: { $round: ["$avgFrustration", 1] },
          avgScore: { $round: ["$avgScore", 1] },
          lastStudied: 1,
          dominantEmotions: 1,
        },
      },
      { $sort: { avgFrustration: -1 } },
    ]);

    res.json(summary);
  } catch (error) {
    console.error("[AELP] getTopicSummary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/learning-path/best-time
// ─────────────────────────────────────────────────────────────
const getBestStudyTime = async (req, res) => {
  try {
    const studentId = req.userId;

    const result = await EmotionSession.aggregate([
      { $match: { studentId: toObjectId(studentId) } },
      {
        $group: {
          _id: "$timeOfDay",
          avgEngagement: { $avg: "$engagementScore" },
          avgScore: { $avg: "$scorePercent" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgEngagement: -1 } },
    ]);

    const best = result[0] || {
      _id: "morning",
      avgEngagement: 50,
      avgScore: 50,
      count: 0,
    };

    res.json({
      bestTimeOfDay: best._id,
      avgEngagement: Math.round(best.avgEngagement),
      avgScore: Math.round(best.avgScore),
      breakdown: result,
    });
  } catch (error) {
    console.error("[AELP] getBestStudyTime:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/learning-path/rebuild
// ─────────────────────────────────────────────────────────────
const rebuildPath = async (req, res) => {
  try {
    const studentId = req.userId;
    const path = await rebuildLearningPath(studentId);
    res.json({ message: "Learning path rebuilt", path });
  } catch (error) {
    console.error("[AELP] rebuildPath:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// INTERNAL: full path rebuild from all emotion sessions
// ─────────────────────────────────────────────────────────────
async function rebuildLearningPath(studentId) {
  try {
    const objectId = toObjectId(studentId);

    const topicStats = await EmotionSession.aggregate([
      { $match: { studentId: objectId } },
      {
        $group: {
          _id: "$topic",
          subject: { $last: "$subject" },
          sessionCount: { $sum: 1 },
          avgEngagement: { $avg: "$engagementScore" },
          avgFrustration: { $avg: "$frustrationScore" },
          avgScore: { $avg: "$scorePercent" },
          lastStudied: { $max: "$sessionDate" },
          timeOfDayEntries: { $push: "$timeOfDay" },
        },
      },
    ]);

    if (!topicStats.length) return null;

    const topics = topicStats.map((t) => {
      const profile = {
        topic: t._id,
        subject: t.subject,
        sessionCount: t.sessionCount,
        lastStudied: t.lastStudied,
        avgEngagement: Math.round(t.avgEngagement),
        avgFrustration: Math.round(t.avgFrustration),
        avgScore: Math.round(t.avgScore),
      };
      profile.priorityScore = LearningPath.computePriority(profile);
      profile.status = LearningPath.computeStatus(profile);
      profile.bestTimeOfDay = findBestTime(t.timeOfDayEntries);
      return profile;
    });

    topics.sort((a, b) => b.priorityScore - a.priorityScore);

    const overallEngagement = Math.round(
      topics.reduce((s, t) => s + t.avgEngagement, 0) / topics.length
    );
    const overallFrustration = Math.round(
      topics.reduce((s, t) => s + t.avgFrustration, 0) / topics.length
    );
    const burnoutRisk =
      overallFrustration > 70 ? "high" : overallFrustration > 40 ? "moderate" : "low";
    const recommendedDailyMinutes =
      burnoutRisk === "high" ? 20 : burnoutRisk === "moderate" ? 30 : 45;

    const recentSessions = await EmotionSession.find({ studentId: objectId })
      .sort({ sessionDate: -1 })
      .select("sessionDate")
      .lean();

    const { currentStreak, longestStreak, lastActiveDate } = computeStreak(recentSessions);

    const path = await LearningPath.findOneAndUpdate(
      { studentId: objectId },
      {
        $set: {
          topics,
          overallEngagement,
          overallFrustration,
          burnoutRisk,
          recommendedDailyMinutes,
          currentStreak,
          longestStreak,
          lastActiveDate,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return path;
  } catch (err) {
    console.error("[AELP] rebuildLearningPath error:", err.message);
    return null;
  }
}

function findBestTime(entries) {
  if (!entries || !entries.length) return "unknown";
  const counts = {};
  entries.forEach((e) => { counts[e] = (counts[e] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function computeStreak(sessions) {
  if (!sessions.length) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }
  const days = [
    ...new Set(sessions.map((s) => s.sessionDate.toISOString().split("T")[0])),
  ].sort().reverse();

  let streak = 1;
  let longestStreak = 1;

  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]) - new Date(days[i])) / 86400000;
    if (diff === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const currentStreak = days[0] === today || days[0] === yesterday ? streak : 0;

  return { currentStreak, longestStreak, lastActiveDate: new Date(days[0]) };
}

export {
  logEmotionSession,
  getLearningPath,
  getEmotionHistory,
  getTopicSummary,
  getBestStudyTime,
  rebuildPath,
};