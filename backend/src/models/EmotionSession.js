import mongoose from "mongoose";

const emotionDataPointSchema = new mongoose.Schema({
  emotion: {
    type: String,
    enum: ["happy", "sad", "angry", "fearful", "disgusted", "surprised", "neutral"],
    required: true,
  },
  confidence: { type: Number, min: 0, max: 1, default: 1 },
  timestamp: { type: Date, default: Date.now },
});

const emotionSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "General",
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
    sessionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    emotionLog: [emotionDataPointSchema],

    // Aggregated scores saved at session end for fast querying
    dominantEmotion: {
      type: String,
      enum: ["happy", "sad", "angry", "fearful", "disgusted", "surprised", "neutral"],
      default: "neutral",
    },
    // 0-100: derived from happy+surprised vs negative emotions
    engagementScore: { type: Number, min: 0, max: 100, default: 50 },
    // 0-100: weighted angry + fearful + sad
    frustrationScore: { type: Number, min: 0, max: 100, default: 0 },
    // 0-100: neutral dominance
    calmScore: { type: Number, min: 0, max: 100, default: 50 },

    // Quiz performance linked to emotion
    correctAnswers: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    scorePercent: { type: Number, default: 0 },

    // Time-of-day bucket for pattern analysis
    timeOfDay: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
      default: "morning",
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
emotionSessionSchema.index({ studentId: 1, topic: 1, sessionDate: -1 });
emotionSessionSchema.index({ studentId: 1, sessionDate: -1 });

// Static: compute time-of-day bucket from a Date
emotionSessionSchema.statics.getTimeOfDay = function (date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

// Static: compute aggregated emotion scores from a raw log array
emotionSessionSchema.statics.computeScores = function (emotionLog) {
  if (!emotionLog || emotionLog.length === 0) {
    return {
      dominantEmotion: "neutral",
      engagementScore: 50,
      frustrationScore: 0,
      calmScore: 50,
    };
  }

  const counts = {};
  emotionLog.forEach(({ emotion }) => {
    counts[emotion] = (counts[emotion] || 0) + 1;
  });

  const total = emotionLog.length;
  const pct = (e) => ((counts[e] || 0) / total) * 100;

  const engagementScore = Math.min(100, Math.round(pct("happy") + pct("surprised") * 0.6));
  const frustrationScore = Math.min(
    100,
    Math.round(pct("angry") * 1.2 + pct("fearful") * 0.8 + pct("sad") * 0.6)
  );
  const calmScore = Math.min(100, Math.round(pct("neutral") + pct("happy") * 0.3));
  const dominantEmotion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  return { dominantEmotion, engagementScore, frustrationScore, calmScore };
};

export default mongoose.model("EmotionSession", emotionSessionSchema);