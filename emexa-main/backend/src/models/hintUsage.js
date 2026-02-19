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
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
hintUsageSchema.index({ userId: 1, sessionId: 1 });

const HintUsage = mongoose.model('HintUsage', hintUsageSchema);

export default HintUsage;
