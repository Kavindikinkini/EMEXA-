import mongoose from 'mongoose';

// Create a Mongoose schema for hint_usage
// fields: userId, questionId, hintText, deduction, timestamp
const hintUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  questionIndex: {
    type: Number,
    required: true
  },
  hintText: {
    type: String,
    required: true
  },
  deduction: {
    type: Number,
    default: 1 // Each hint deducts 1 mark
  },
  effortLevel: {
    type: String,
    enum: ['none', 'minimal', 'some', 'good', 'strong', 'unknown'],
    default: 'unknown'
  },
  timeSpentBeforeHint: {
    type: Number,
    default: 0
  },
  quizId: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
hintUsageSchema.index({ userId: 1, sessionId: 1 });
hintUsageSchema.index({ userId: 1, sessionId: 1, questionId: 1 });
hintUsageSchema.index({ quizId: 1, questionIndex: 1 });

const HintUsage = mongoose.model('HintUsage', hintUsageSchema);

export default HintUsage;
