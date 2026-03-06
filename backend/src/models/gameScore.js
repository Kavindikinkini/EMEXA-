// backend/src/models/gameScore.js
import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  gameType: {
    type: String,
    enum: ['trivia', 'memory', 'word-scramble'],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  pointsEarned: {
    type: Number,
    required: true
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
gameScoreSchema.index({ studentId: 1, playedAt: -1 });
gameScoreSchema.index({ gameType: 1, percentage: -1 });
gameScoreSchema.index({ subject: 1 });

const GameScore = mongoose.model('GameScore', gameScoreSchema);

export default GameScore;