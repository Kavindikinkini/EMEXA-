import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'teacher', immutable: true },
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
  
  // Teacher-specific fields
  teacherId: { type: String, unique: true, sparse: true },
  department: { type: String },
    specialization: { type: String },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    // Settings field for cross-device sync
    settings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      inAppNotifications: { type: Boolean, default: true },
      emotionConsent: { type: Boolean, default: true },
    },

    // Additional fields for notification and privacy settings
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      inAppNotifications: { type: Boolean, default: true },
    },
    privacySettings: {
      emotionDataConsent: { type: Boolean, default: true },
    },

    // Optional teacher fields
    qualifications: { type: String, default: "" },
    subjects: [{ type: String }],
  },
  { timestamps: true }
);

// ============================================
// COMBINED PRE-SAVE HOOK
// ============================================
teacherSchema.pre("save", async function (next) {
  try {
    // 1. Handle password hashing
    if (this.isModified("password")) {
      // Check if password is already hashed
      const isHashed =
        this.password.startsWith("$2a$") || this.password.startsWith("$2b$");

      if (!isHashed) {
        console.log("🔐 Hashing teacher password...");
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      } else {
        console.log("🔑 Teacher password already hashed, skipping hash");
      }
    }

    // 2. Generate teacherId if not present
    if (!this.teacherId) {
      console.log("🆔 Generating teacherId...");

      // FIXED: Find the highest existing teacherId instead of using count
      const lastTeacher = await this.constructor
        .findOne({ teacherId: { $exists: true, $ne: null } })
        .sort({ teacherId: -1 })
        .select("teacherId")
        .lean();

      let nextNumber = 1;

      if (lastTeacher && lastTeacher.teacherId) {
        // Extract number from format "TCH00086"
        const match = lastTeacher.teacherId.match(/TCH(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Generate new ID with leading zeros (5 digits)
      this.teacherId = `TCH${String(nextNumber).padStart(5, "0")}`;
      console.log("✅ Generated teacherId:", this.teacherId);

      // Double-check it doesn't exist (race condition protection)
      const exists = await this.constructor.findOne({
        teacherId: this.teacherId,
      });
      if (exists) {
        console.warn("⚠️ TeacherId collision detected, incrementing...");
        nextNumber++;
        this.teacherId = `TCH${String(nextNumber).padStart(5, "0")}`;
        console.log("✅ New teacherId after collision:", this.teacherId);
      }
    }

    next();
  } catch (error) {
    console.error("❌ Error in teacher pre-save hook:", error);
    next(error);
  }
});

// ============================================
// INSTANCE METHODS
// ============================================

// Compare plain password with hashed
teacherSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Generate JWT token
teacherSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || "dev_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: this._id, role: "teacher" }, secret, { expiresIn });
};

const Teacher =
  mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
export default Teacher;
