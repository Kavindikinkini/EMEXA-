import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'student', immutable: true },
  isActive: { type: Boolean, default: false },
  
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
  
  // Profile image
  profileImage: { type: String, default: null },
  
  // Student-specific fields
  studentId: { type: String, unique: true, sparse: true },
  grade: { type: String },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  
  // Notification settings
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    inAppNotifications: { type: Boolean, default: true }
  },
  
  // Privacy settings
  privacySettings: {
    emotionDataConsent: { type: Boolean, default: true }
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
  
  // Password reset fields
  resetPasswordCode: { type: String, select: false },
  resetPasswordExpiry: { type: Date, select: false },
  
  // Profile data fields
  recentActivity: { type: Array, default: [] },
  totalQuizzes: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  studyTime: { type: Number, default: 0 },
  upcomingQuizzes: { type: Array, default: [] }
}, { timestamps: true });

// Hash password before saving - BUT ONLY if password is actually modified
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  // CRITICAL: Check if password is already hashed (starts with $2b$ or $2a$)
  if (this.password && (this.password.startsWith('$2b$') || this.password.startsWith('$2a$'))) {
    console.log('🔑 Student password already hashed, skipping hash');
    return next();
  }
  
  // Only hash if it's a plain text password
  console.log('🔑 Hashing new student password');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Auto-generate student ID before saving
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    try {
      // Find the highest existing student ID
      const lastStudent = await mongoose.model('Student')
        .findOne({}, { studentId: 1 })
        .sort({ studentId: -1 })
        .lean();
      
      let nextNumber = 1;
      if (lastStudent && lastStudent.studentId) {
        // Extract the number from the last student ID (e.g., "STU00066" -> 66)
        const lastNumber = parseInt(lastStudent.studentId.replace('STU', ''), 10);
        nextNumber = lastNumber + 1;
      }
      
      this.studentId = `STU${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating student ID:', error);
      // Fallback to timestamp-based ID if there's an error
      this.studentId = `STU${Date.now().toString().slice(-5)}`;
    }
  }
  next();
});

// Compare plain password with hashed
studentSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// Generate JWT token
studentSchema.methods.generateAuthToken = function() {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: this._id, role: 'student' }, secret, { expiresIn });
};

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;