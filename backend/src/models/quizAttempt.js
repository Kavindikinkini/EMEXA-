import mongoose from 'mongoose';

// Create a Mongoose schema for quiz_attempts
// fields: userId, quizId, sessionId, score, rawScore, hintsUsed, emotionalSummary, aiFeedback
const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  rawScore: {
    type: Number,
    required: true,
    default: 0
  },
  hintsUsed: {
    type: Number,
    default: 0
  },
  finalScore: {
    type: Number,
    required: true,
    default: 0
  },
  emotionalSummary: {
    mostCommonEmotion: String,
    confusedCount: Number,
    happyCount: Number,
    neutralCount: Number,
    totalEmotionCaptures: Number
  },
  aiFeedback: {
    type: String,
    default: ''
  },
  answers: [{
    questionId: {
      type: String,  // Changed from ObjectId to String to accept any question identifier
      required: false
    },
    selectedAnswer: String,
    isCorrect: Boolean
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
quizAttemptSchema.index({ userId: 1, quizId: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
