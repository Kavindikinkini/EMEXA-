import mongoose from 'mongoose';

// Create a Mongoose schema for emotion_logs
// fields: userId, sessionId, questionIndex, emotion, confidence, timestamp
const emotionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  questionIndex: {
    type: Number,
    required: true
  },
  emotion: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'confused', 'neutral', 'anxious'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  frictionScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
emotionLogSchema.index({ userId: 1, sessionId: 1, questionIndex: 1 });
emotionLogSchema.index({ sessionId: 1 });

const EmotionLog = mongoose.model('EmotionLog', emotionLogSchema);

export default EmotionLog;
