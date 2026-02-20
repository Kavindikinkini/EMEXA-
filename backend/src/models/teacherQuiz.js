import mongoose from 'mongoose';

// Question schema for teacher-created quizzes
const teacherQuestionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'short'],
    default: 'mcq'
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    id: Number,
    text: String,
    isCorrect: Boolean
  }],
  shortAnswer: {
    type: String, // For teacher reference in short answer questions
    default: ''
  },
  hints: {
    type: [String],
    default: ['', '', '', ''], // 4 hints per question
    validate: [arrayLimit, '{PATH} must have exactly 4 hints']
  }
});

// Validator for hints array
function arrayLimit(val) {
  return val.length === 4;
}

// Main Teacher Quiz Schema (for assignments/quizzes created by teachers)
const teacherQuizSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true // Free text field, not dropdown
  },
  gradeLevel: {
    type: [String], // Array of grade IDs (e.g., ["1-1", "1-2"])
    required: true
  },
  
  // Semester and academic year selection (filters for which students receive this quiz)
  semester: {
    type: String,
    enum: ['1st semester', '2nd semester', null],
    default: null
  },
  academicYear: {
    type: Number, // Year like 1, 2, 3, 4
    default: null
  },
  
  // ✅ NEW: Maximum attempts allowed for students
  maxAttempts: {
    type: Number,
    enum: [1, 2, 3, 99],
    default: 1,
    required: true
  },
  
  dueDate: {
    type: Date,
    required: false
  },
  questions: {
    type: [teacherQuestionSchema],
    default: []
  },
  
  // Schedule information
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleDate: {
    type: Date
  },
  startTime: {
    type: String // Format: "HH:MM" (24-hour)
  },
  endTime: {
    type: String // Format: "HH:MM" (24-hour)
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'closed'],
    default: 'draft',
    index: true
  },
  
  // Auto-removal after 1 month
  expiryDate: {
    type: Date,
    index: true // For efficient cleanup queries
  },
  
  // Student interaction tracking
  studentsTaken: {
    type: Number,
    default: 0
  },
  hasStudentAttempts: {
    type: Boolean,
    default: false
  },
  
  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Metadata
  lastEdited: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Indexes for better query performance
teacherQuizSchema.index({ teacherId: 1, status: 1 });
teacherQuizSchema.index({ teacherId: 1, isDeleted: 1 });
teacherQuizSchema.index({ scheduleDate: 1, status: 1 });

// Pre-save middleware to update lastEdited
teacherQuizSchema.pre('save', function(next) {
  this.lastEdited = new Date();
  
  // Auto-calculate expiry date if quiz is scheduled
  if (this.isScheduled && this.scheduleDate && this.endTime && !this.expiryDate) {
    this.calculateExpiryDate();
  }
  
  next();
});

// Instance method to calculate progress
teacherQuizSchema.methods.calculateProgress = function() {
  if (this.questions.length === 0) {
    this.progress = 0;
    return 0;
  }
  
  const filledQuestions = this.questions.filter(q => {
    if (q.type === 'mcq') {
      return q.questionText && q.options.some(opt => opt.text && opt.isCorrect);
    } else {
      return q.questionText; // Short answer just needs question text
    }
  }).length;
  
  this.progress = Math.round((filledQuestions / this.questions.length) * 100);
  return this.progress;
};

// Instance method to calculate expiry date (1 month after end time)
teacherQuizSchema.methods.calculateExpiryDate = function() {
  if (!this.scheduleDate || !this.endTime) {
    this.expiryDate = null;
    return null;
  }
  
  const scheduleDate = new Date(this.scheduleDate);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  
  const endDateTime = new Date(scheduleDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  // If end time is before start time (spans to next day), adjust
  if (this.startTime) {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
  }
  
  // Add 1 month to the end time
  const expiryDate = new Date(endDateTime);
  expiryDate.setMonth(expiryDate.getMonth() + 1);
  
  this.expiryDate = expiryDate;
  return this.expiryDate;
};

// Instance method to check if quiz is currently active based on schedule
teacherQuizSchema.methods.isCurrentlyActive = function() {
  if (!this.isScheduled || !this.scheduleDate || !this.startTime || !this.endTime) {
    return false;
  }
  
  const now = new Date();
  const scheduleDate = new Date(this.scheduleDate);
  
  // Parse start and end times (format: "HH:MM")
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  
  // Create start and end datetime objects for the scheduled date
  const startDateTime = new Date(scheduleDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date(scheduleDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  // If end time is before start time, quiz spans to next day
  if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }
  
  // Check if current time is between start and end time
  return now >= startDateTime && now < endDateTime;
};

// Instance method to get quiz time status (upcoming, active, expired)
teacherQuizSchema.methods.getTimeStatus = function() {
  if (!this.isScheduled || !this.scheduleDate || !this.startTime || !this.endTime) {
    return 'unscheduled';
  }
  
  const now = new Date();
  const scheduleDate = new Date(this.scheduleDate);
  
  // Parse start and end times
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  
  const startDateTime = new Date(scheduleDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date(scheduleDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  // If end time is before start time, quiz spans to next day
  if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }
  
  if (now < startDateTime) {
    return 'upcoming';
  } else if (now >= startDateTime && now < endDateTime) {
    return 'active';
  } else {
    return 'expired';
  }
};

// Static method to clean up expired quizzes and notifications
teacherQuizSchema.statics.cleanupExpiredQuizzes = async function() {
  const now = new Date();
  
  try {
    // Find all expired quizzes
    const expiredQuizzes = await this.find({
      expiryDate: { $lte: now },
      isDeleted: false
    });
    
    // Soft delete expired quizzes
    const result = await this.updateMany(
      { expiryDate: { $lte: now }, isDeleted: false },
      { 
        $set: { 
          isDeleted: true,
          status: 'closed'
        } 
      }
    );
    
    console.log(`Cleaned up ${result.modifiedCount} expired quizzes`);
    return { success: true, count: result.modifiedCount, quizIds: expiredQuizzes.map(q => q._id) };
  } catch (error) {
    console.error('Error cleaning up expired quizzes:', error);
    return { success: false, error: error.message };
  }
};

// Static method to find quizzes that should be visible (not expired)
teacherQuizSchema.statics.findVisibleQuizzes = function(teacherId) {
  const now = new Date();
  return this.find({
    teacherId,
    isDeleted: false,
    $or: [
      { expiryDate: { $gt: now } },
      { expiryDate: null }
    ]
  }).sort({ updatedAt: -1 });
};

// Static method to find teacher's quizzes
teacherQuizSchema.statics.findByTeacher = function(teacherId, includeDeleted = false) {
  const query = { teacherId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return this.find(query).sort({ updatedAt: -1 });
};

// Static method to find drafts
teacherQuizSchema.statics.findDrafts = function(teacherId) {
  return this.find({
    teacherId,
    status: 'draft',
    isDeleted: false
  }).sort({ updatedAt: -1 });
};

// Static method to find scheduled quizzes
teacherQuizSchema.statics.findScheduled = function(teacherId) {
  return this.find({
    teacherId,
    isScheduled: true,
    isDeleted: false
  }).sort({ scheduleDate: 1 });
};

// Virtual for formatted last edited
teacherQuizSchema.virtual('lastEditedFormatted').get(function() {
  const now = new Date();
  const diff = now - this.lastEdited;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Ensure virtuals are included in JSON
teacherQuizSchema.set('toJSON', { virtuals: true });
teacherQuizSchema.set('toObject', { virtuals: true });

export const TeacherQuiz = mongoose.model('TeacherQuiz', teacherQuizSchema);
export default TeacherQuiz;