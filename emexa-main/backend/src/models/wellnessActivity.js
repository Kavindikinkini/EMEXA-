import mongoose from 'mongoose';

const wellnessActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      "Breathing Exercise",
      "Meditation",
      "Journaling",
      "Physical Exercise",
      "Social Connection",
      "Creative Activity",
      "Reading",
      "Music",
      "Other",
    ],
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 1,
  },
  notes: {
    type: String,
    maxlength: 1000,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  moodBefore: {
    type: String,
    enum: ["Very Sad", "Sad", "Neutral", "Happy", "Very Happy"],
  },
  moodAfter: {
    type: String,
    enum: ["Very Sad", "Sad", "Neutral", "Happy", "Very Happy"],
  },
});

// Create index for faster queries by userId and completedAt
wellnessActivitySchema.index({ userId: 1, completedAt: -1 });

const WellnessActivity = mongoose.model("WellnessActivity", wellnessActivitySchema);

export default WellnessActivity;