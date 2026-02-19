import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mood: {
    type: String,
    required: true,
    enum: ["Very Sad", "Sad", "Neutral", "Happy", "Very Happy"],
  },
  emoji: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  date: {
    type: Date,
    default: Date.now,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    maxlength: 500,
    default: ''
  },
}, {
  timestamps: true
});

// Create index for faster queries by userId and timestamp
moodSchema.index({ userId: 1, timestamp: -1 });
moodSchema.index({ userId: 1, date: -1 });

const Mood = mongoose.model("Mood", moodSchema);

export default Mood;