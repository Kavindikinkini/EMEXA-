// backend/src/models/predictionHistory.js
// Stores every prediction snapshot — never overwritten, append-only.
// This powers the Exam Readiness Timeline chart.

import mongoose from 'mongoose';

const predictionHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },

  // Snapshot of the prediction at this point in time
  version:        { type: Number, required: true },
  predictedScore: { type: Number, min: 0, max: 100, default: null },
  adjustedScore:  { type: Number, min: 0, max: 100, default: null },
  clusterLabel: {
    type: String,
    enum: ['high-performer', 'average-performer', 'at-risk', 'insufficient-data'],
    default: 'insufficient-data'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Emotion snapshot
  stressIndex:     { type: Number, default: 0 },
  confidenceIndex: { type: Number, default: 0 },
  dominantEmotion: { type: String, default: 'neutral' },
  readinessLabel: {
    type: String,
    enum: ['well-prepared', 'moderately-prepared', 'needs-support'],
    default: 'moderately-prepared'
  },

  // Quiz performance snapshot
  avgQuizScore:      { type: Number, default: 0 },
  totalQuizzesTaken: { type: Number, default: 0 },
  scoretrend: {
    type: String,
    enum: ['improving', 'stable', 'declining'],
    default: 'stable'
  },

  // What triggered this snapshot
  trigger: {
    type: String,
    enum: ['quiz_submission', 'manual_regenerate', 'seed', 'initial'],
    default: 'quiz_submission'
  },

  recordedAt: { type: Date, default: Date.now }
}, { timestamps: false });

// Compound index for efficient per-student timeline queries
predictionHistorySchema.index({ studentId: 1, teacherId: 1, recordedAt: 1 });

const PredictionHistory = mongoose.models.PredictionHistory
  || mongoose.model('PredictionHistory', predictionHistorySchema);

export default PredictionHistory;