import mongoose from "mongoose";

const topicProfileSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  subject: { type: String, default: "General" },
  sessionCount: { type: Number, default: 0 },
  lastStudied: { type: Date, default: null },

  // Rolling averages updated on each session
  avgEngagement: { type: Number, default: 50 },
  avgFrustration: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },

  // Derived: higher = study this topic sooner
  priorityScore: { type: Number, default: 50 },

  // Status tag shown in UI
  status: {
    type: String,
    enum: ["needs_attention", "progressing", "strong", "not_started"],
    default: "not_started",
  },

  // Best time-of-day based on emotion history
  bestTimeOfDay: {
    type: String,
    enum: ["morning", "afternoon", "evening", "night", "unknown"],
    default: "unknown",
  },
});

const learningPathSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Topics ordered by priority (index 0 = most urgent)
    topics: [topicProfileSchema],

    lastUpdated: { type: Date, default: Date.now },

    // Overall wellness snapshot
    overallEngagement: { type: Number, default: 50 },
    overallFrustration: { type: Number, default: 0 },
    burnoutRisk: {
      type: String,
      enum: ["low", "moderate", "high"],
      default: "low",
    },

    // Study streak
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },

    // Recommended daily study time in minutes based on emotional data
    recommendedDailyMinutes: { type: Number, default: 30 },
  },
  { timestamps: true }
);

// Compute priority score for a topic profile object (0–100)
learningPathSchema.statics.computePriority = function ({
  avgEngagement,
  avgFrustration,
  avgScore,
  sessionCount,
}) {
  const scoreFactor = (100 - avgScore) * 0.4;
  const frustrationFactor = avgFrustration * 0.35;
  const engagementBoost = (100 - avgEngagement) * 0.15;
  const newnessFactor = Math.max(0, 10 - sessionCount) * 1;
  return Math.min(100, Math.round(scoreFactor + frustrationFactor + engagementBoost + newnessFactor));
};

// Derive status label from averaged emotion/score data
learningPathSchema.statics.computeStatus = function ({
  avgScore,
  avgFrustration,
  sessionCount,
}) {
  if (sessionCount === 0) return "not_started";
  if (avgFrustration > 60 || avgScore < 40) return "needs_attention";
  if (avgScore >= 75 && avgFrustration < 30) return "strong";
  return "progressing";
};

export default mongoose.model("LearningPath", learningPathSchema);