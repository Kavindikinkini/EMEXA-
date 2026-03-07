// backend/src/models/selfReflection.js
import mongoose from 'mongoose';

const selfReflectionSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attemptId:           { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt', required: true },
  quizId:              { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherQuiz', required: true },
  selfReportedEmotion: { type: String, enum: ['happy','sad','angry','confused','neutral','anxious','confident','frustrated'], required: true },
  confidenceRating:    { type: Number, min: 1, max: 5, required: true },
  effortRating:        { type: Number, min: 1, max: 5, required: true },
  reflectionText:      { type: String, maxlength: 500, default: '' },
  aiDetectedEmotion:   { type: String, default: 'neutral' },
  emotionGap:          { type: String, default: 'aligned' },
  awarenessScore:      { type: Number, min: 0, max: 100, default: 50 }
}, { timestamps: true });

selfReflectionSchema.index({ userId: 1, attemptId: 1 }, { unique: true });
selfReflectionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('SelfReflection', selfReflectionSchema);