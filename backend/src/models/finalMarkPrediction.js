import mongoose from 'mongoose';

const finalMarkPredictionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },

  // ── Clustering output ──────────────────────────────────────────
  clusterLabel: {
    type: String,
    enum: ['high-performer', 'average-performer', 'at-risk', 'insufficient-data'],
    default: 'insufficient-data'
  },
  clusterScore: { type: Number, default: 0 }, // 0-100 numeric cluster centroid score

  // ── Classification output ──────────────────────────────────────
  predictedScore: { type: Number, min: 0, max: 100, default: null }, // percentage
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // ── Teacher override ───────────────────────────────────────────
  adjustedScore: { type: Number, min: 0, max: 100, default: null }, // teacher-edited score
  teacherNote: { type: String, default: '' },

  // ── Approval workflow ──────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: { type: Date, default: null },

  // ── Psychological readiness summary ───────────────────────────
  psychologicalReadiness: {
    dominantEmotion: { type: String, default: 'neutral' },     // most frequent emotion
    stressIndex: { type: Number, min: 0, max: 100, default: 0 }, // derived from angry+anxious+confused
    confidenceIndex: { type: Number, min: 0, max: 100, default: 0 }, // derived from happy+neutral
    frictionAvg: { type: Number, default: 0 },                // avg frictionScore from emotionLogs
    readinessLabel: {
      type: String,
      enum: ['well-prepared', 'moderately-prepared', 'needs-support'],
      default: 'moderately-prepared'
    },
    summary: { type: String, default: '' }
  },

  // ── Physical readiness (quiz behaviour proxy) ─────────────────
  physicalReadiness: {
    avgScore: { type: Number, default: 0 },
    totalQuizzesTaken: { type: Number, default: 0 },
    scoretrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    },
    hintsUsedAvg: { type: Number, default: 0 },
    summary: { type: String, default: '' }
  },

  // ── Raw snapshot used for this prediction ─────────────────────
  dataSnapshot: {
    quizCount: { type: Number, default: 0 },
    avgQuizScore: { type: Number, default: 0 },
    emotionLogCount: { type: Number, default: 0 },
    happyRatio: { type: Number, default: 0 },
    confusedRatio: { type: Number, default: 0 },
    anxiousRatio: { type: Number, default: 0 },
    angryRatio: { type: Number, default: 0 },
    neutralRatio: { type: Number, default: 0 },
    avgConfidence: { type: Number, default: 0 },
    avgFriction: { type: Number, default: 0 }
  },

  // ── Version tracking (re-generated on each new quiz) ──────────
  version: { type: Number, default: 1 },
  generatedAt: { type: Date, default: Date.now }

}, { timestamps: true });

// One active prediction per student-teacher pair
finalMarkPredictionSchema.index({ studentId: 1, teacherId: 1 }, { unique: true });
finalMarkPredictionSchema.index({ teacherId: 1, status: 1 });

const FinalMarkPrediction = mongoose.models.FinalMarkPrediction
  || mongoose.model('FinalMarkPrediction', finalMarkPredictionSchema);

export default FinalMarkPrediction;