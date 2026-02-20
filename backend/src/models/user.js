import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Quiz schema for upcoming quizzes
const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  score: { type: Number },
  completed: { type: Boolean, default: false }
});

// Activity schema for recent activity
const activitySchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Completed Quiz', 'Started Quiz', 'Viewed Results'],
    required: true 
  },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  score: { type: Number },
  status: { 
    type: String, 
    enum: ['completed', 'in-progress', 'viewed'] 
  }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  
  // Approval status fields
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Pending'], 
    default: 'Pending' 
  },
  
  // Profile settings
  profileImage: {
    type: String,
    default: null
  },
  
  // Notification settings
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    inAppNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  // Privacy settings
  privacySettings: {
    emotionDataConsent: {
      type: Boolean,
      default: true
    }
  },
  
  // Academic information
  year: { 
    type: String, 
    enum: ['1st year', '2nd year', '3rd year', '4th year', null],
    default: null 
  },
  semester: { 
    type: String, 
    enum: ['1st semester', '2nd semester', null],
    default: null 
  },
  
  // Dashboard statistics
  totalQuizzes: { type: Number, default: 24 },
  averageScore: { type: Number, default: 82 },
  studyTime: { type: Number, default: 32 },
  
  // Upcoming quizzes
  upcomingQuizzes: {
    type: [quizSchema],
    default: [
      {
        title: 'Matrix',
        date: new Date('2025-10-20'),
        description: 'Prepare for your Matrix quiz by revising matrix operations, determinants, and inverse concepts to strengthen your problem-solving skills.'
      },
      {
        title: 'Vectors',
        date: new Date('2025-10-25'),
        description: 'Review vector basics, dot and cross products, and geometric interpretations to get ready for your Vectors quiz.'
      },
      {
        title: 'Limits',
        date: new Date('2025-10-30'),
        description: 'Study the fundamentals of limits, continuity, and approaching values to perform well in your Limits quiz.'
      }
    ]
  },
  
  // Recent activity
  recentActivity: {
    type: [activitySchema],
    default: [
      {
        type: 'Completed Quiz',
        title: 'Limits Basics',
        date: new Date('2025-10-10'),
        score: 85,
        status: 'completed'
      },
      {
        type: 'Started Quiz',
        title: 'Trigonometry Fundamentals',
        date: new Date('2025-10-09'),
        status: 'in-progress'
      },
      {
        type: 'Viewed Results',
        title: 'History Timeline',
        date: new Date('2025-10-07'),
        score: 78,
        status: 'viewed'
      }
    ]
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Check if already hashed
  if (this.password && (this.password.startsWith('$2b$') || this.password.startsWith('$2a$'))) {
    console.log('🔑 User password already hashed, skipping');
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain password with hashed
userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: this._id }, secret, { expiresIn });
};

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ approvalStatus: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;