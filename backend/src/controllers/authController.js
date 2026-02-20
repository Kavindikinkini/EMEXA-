import User from '../models/user.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendResetCodeEmail, sendPasswordChangeEmail, sendPasswordResetEmail } from '../config/email.config.js';

const generateResetCode = () => {
  // Generate a 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// REGISTER - Saves to User collection with pending status
// ============================================
export const register = async (req, res) => {
  try {
    const { fullName, name, email, password, accountType, year, semester } = req.body;
    const userName = fullName || name;
    
    if (!userName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const role = accountType || 'student';
    const normalizedEmail = email.toLowerCase().trim();

    console.log('📝 Registration attempt:', { userName, email: normalizedEmail, role, year, semester });

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    const existingTeacher = await Teacher.findOne({ email: normalizedEmail });
    
    if (existingUser || existingStudent || existingTeacher) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with PENDING status
    const newUser = new User({
      name: userName,
      email: normalizedEmail,
      password: hashedPassword,
      role: role,
      approvalStatus: 'pending',
      status: 'Pending',
      isActive: false,
      year: year || null,
      semester: semester || null
      
    });

    await newUser.save();

    console.log('✅ User registered with pending status:', {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      approvalStatus: newUser.approvalStatus,
      year: newUser.year,
      semester: newUser.semester
    });

    res.status(201).json({
      message: 'Registration successful! Your account is pending approval.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'Pending',
        approvalStatus: 'pending'
      },
      pendingApproval: true
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ============================================
// LOGIN - Check approval status
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 Login attempt for:', normalizedEmail);
    
    // Check User collection first
    const userInUserCollection = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (userInUserCollection) {
      console.log('👤 Found in User collection:', {
        role: userInUserCollection.role,
        approvalStatus: userInUserCollection.approvalStatus
      });
      
      // ADMIN LOGIN
      if (userInUserCollection.role === 'admin' || userInUserCollection.role === 'Admin') {
        console.log('✅ Admin login');
        
        const isPasswordValid = await bcrypt.compare(password, userInUserCollection.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const token = jwt.sign(
          { id: userInUserCollection._id, email: userInUserCollection.email, role: userInUserCollection.role },
          process.env.JWT_SECRET || 'dev_secret',
          { expiresIn: '24h' }
        );
        
        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: userInUserCollection._id,
            name: userInUserCollection.name || 'Admin',
            email: userInUserCollection.email,
            role: 'admin',
            profileImage: userInUserCollection.profileImage
          }
        });
      }
      
      // REGULAR USER - Check if still pending
      if (userInUserCollection.approvalStatus === 'pending') {
        console.log('⏳ User pending approval');
        return res.status(403).json({ 
          message: 'Your account is pending approval. Please wait for admin approval.',
          pendingApproval: true 
        });
      }
      
      if (userInUserCollection.approvalStatus === 'rejected') {
        console.log('❌ User rejected');
        return res.status(403).json({ 
          message: 'Your account registration was rejected. Please contact support.',
          rejected: true 
        });
      }
    }
    
    // Check Student/Teacher collections
    console.log('🔍 Checking Student/Teacher collections...');
    
    let foundUser;
    let foundModel;
    
    foundUser = await Student.findOne({ email: normalizedEmail }).select('+password');
    if (foundUser) {
      foundModel = 'Student';
      console.log('✅ Found in Student collection');
    }
    
    if (!foundUser) {
      foundUser = await Teacher.findOne({ email: normalizedEmail }).select('+password');
      if (foundUser) {
        foundModel = 'Teacher';
        console.log('✅ Found in Teacher collection');
      }
    }
    
    if (!foundUser) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    console.log('🔑 Verifying password...');
    const isPasswordValid = await foundUser.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check approval status
    if (foundUser.approvalStatus !== 'approved') {
      console.log('⏳ User not approved');
      if (foundUser.approvalStatus === 'pending') {
        return res.status(403).json({ 
          message: 'Your account is pending approval.',
          pendingApproval: true 
        });
      } else if (foundUser.approvalStatus === 'rejected') {
        return res.status(403).json({ 
          message: 'Your account was rejected.',
          rejected: true 
        });
      }
    }
    
    // Generate token
    const token = foundUser.generateAuthToken();
    
    const userResponse = {
      id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      profileImage: foundUser.profileImage,
      notificationSettings: foundUser.notificationSettings,
      privacySettings: foundUser.privacySettings
    };
    
    console.log('✅ Login successful');
    return res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
    
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// ============================================
// GET APPROVALS
// ============================================
export const getStudentApprovals = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    console.log('📋 Student approvals:', students.length);
    res.json(students);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTeacherApprovals = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    console.log('📋 Teacher approvals:', teachers.length);
    res.json(teachers);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// APPROVE STUDENT
// ============================================
export const approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userRecord = await User.findById(id).select('+password');
    
    if (!userRecord) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (userRecord.role !== 'student') {
      return res.status(400).json({ message: 'Not a student account' });
    }
    
    console.log('✅ Approving student:', userRecord.email);
    console.log('🔑 Password exists:', !!userRecord.password);
    
    // Check if already exists
    const existingStudent = await Student.findOne({ email: userRecord.email });
    if (existingStudent) {
      userRecord.approvalStatus = 'approved';
      userRecord.status = 'Active';
      userRecord.isActive = true;
      await userRecord.save();
      
      return res.json({ 
        message: 'Student already approved',
        student: {
          id: existingStudent._id,
          name: existingStudent.name,
          email: existingStudent.email
        }
      });
    }
    
    // Create in Student collection
    const newStudent = new Student({
      name: userRecord.name,
      email: userRecord.email,
      password: userRecord.password, // Already hashed
      role: 'student',
      approvalStatus: 'approved',
      status: 'Active',
      isActive: true,
      profileImage: userRecord.profileImage,
      notificationSettings: userRecord.notificationSettings,
      privacySettings: userRecord.privacySettings,
      year: userRecord.year,
      semester: userRecord.semester
    });
    
    await newStudent.save();
    
    console.log('✅ Student created');
    
    // Update User record
    userRecord.approvalStatus = 'approved';
    userRecord.status = 'Active';
    userRecord.isActive = true;
    await userRecord.save();
    
    res.json({ 
      message: 'Student approved successfully',
      student: {
        id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// FIXED approveTeacher function for authController.js
// ============================================

export const approveTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Attempting to approve teacher with ID:', id);
    
    const userRecord = await User.findById(id).select('+password');
    
    if (!userRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Teacher not found in approval queue'
      });
    }
    
    if (userRecord.role !== 'teacher') {
      return res.status(400).json({ 
        success: false,
        message: 'Not a teacher account'
      });
    }
    
    console.log('✅ Teacher found:', userRecord.email);
    
    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email: userRecord.email });
    
    if (existingTeacher) {
      console.log('⚠️ Teacher already exists in Teacher collection');
      
      // Update User record
      userRecord.approvalStatus = 'approved';
      userRecord.status = 'Active';
      userRecord.isActive = true;
      await userRecord.save();
      
      return res.status(200).json({ 
        success: true,
        message: 'Teacher already approved',
        alreadyExists: true,
        teacher: {
          id: existingTeacher._id,
          name: existingTeacher.name,
          email: existingTeacher.email,
          role: existingTeacher.role
        }
      });
    }
    
    // Create new teacher - DON'T set teacherId, let the model generate it
    console.log('📝 Creating NEW teacher...');
    
    const newTeacherData = {
      name: userRecord.name,
      email: userRecord.email,
      password: userRecord.password,
      role: 'teacher',
      approvalStatus: 'approved',
      status: 'Active',
      isActive: true,
      profileImage: userRecord.profileImage || null,
      qualifications: userRecord.qualifications || '',
      subjects: userRecord.subjects || [],
      notificationSettings: userRecord.notificationSettings || {
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true
      },
      privacySettings: userRecord.privacySettings || {
        emotionDataConsent: true
      }
      // DON'T SET teacherId - it will be auto-generated
    };
    
    console.log('📦 Creating teacher:', newTeacherData.email);
    
    const newTeacher = new Teacher(newTeacherData);
    await newTeacher.save();
    
    console.log('✅ NEW TEACHER CREATED');
    console.log('   ID:', newTeacher._id);
    console.log('   Email:', newTeacher.email);
    console.log('   TeacherId:', newTeacher.teacherId);
    
    // Update User record
    userRecord.approvalStatus = 'approved';
    userRecord.status = 'Active';
    userRecord.isActive = true;
    await userRecord.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Teacher approved successfully',
      alreadyExists: false,
      teacher: {
        id: newTeacher._id,
        name: newTeacher.name,
        email: newTeacher.email,
        role: newTeacher.role,
        teacherId: newTeacher.teacherId
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR APPROVING TEACHER');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    // Handle duplicate email
    if (error.code === 11000) {
      console.log('🔄 Handling duplicate...');
      
      try {
        const userRecord = await User.findById(req.params.id);
        if (!userRecord) {
          return res.status(404).json({
            success: false,
            message: 'User record not found'
          });
        }
        
        const existingTeacher = await Teacher.findOne({ email: userRecord.email });
        
        if (existingTeacher) {
          // Update User record
          userRecord.approvalStatus = 'approved';
          userRecord.status = 'Active';
          userRecord.isActive = true;
          await userRecord.save();
          
          return res.status(200).json({ 
            success: true,
            message: 'Teacher already approved',
            alreadyExists: true,
            teacher: {
              id: existingTeacher._id,
              name: existingTeacher.name,
              email: existingTeacher.email,
              role: existingTeacher.role
            }
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Duplicate error but could not find existing teacher'
        });
        
      } catch (innerError) {
        console.error('❌ Inner error:', innerError);
        return res.status(500).json({
          success: false,
          message: 'Failed to handle duplicate'
        });
      }
    }
    
    // Generic error
    res.status(500).json({ 
      success: false,
      message: 'Server error while approving teacher',
      error: error.message 
    });
  }
};


// ============================================
// REJECT
// ============================================
export const rejectStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await User.findByIdAndUpdate(
      id,
      { approvalStatus: 'rejected', status: 'Inactive', isActive: false },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('❌ Student rejected');
    res.json({ message: 'Student rejected', student });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const rejectTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    
    const teacher = await User.findByIdAndUpdate(
      id,
      { approvalStatus: 'rejected', status: 'Inactive', isActive: false },
      { new: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    console.log('❌ Teacher rejected');
    res.json({ message: 'Teacher rejected', teacher });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// OTHER FUNCTIONS
// ============================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('📧 Password reset requested for:', normalizedEmail);
    
    // Find user in Student or Teacher collection
    let user = await Student.findOne({ email: normalizedEmail });
    
    if (!user) {
      user = await Teacher.findOne({ email: normalizedEmail });
    }
    
    if (!user) {
      // Don't reveal if email exists (security best practice)
      console.log('⚠️ Email not found, but returning success message');
      return res.status(200).json({ 
        message: 'If your email exists in our system, you will receive a reset code shortly.' 
      });
    }
    
    // Generate reset code
    const resetCode = generateResetCode();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Save reset code to user
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpiry = resetCodeExpiry;
    await user.save();
    
    console.log('✅ Reset code generated:', resetCode);
    console.log('⏰ Code expires at:', resetCodeExpiry);
    
    // Send email with reset code
    try {
      await sendResetCodeEmail(user.email, user.name, resetCode);
      console.log('✅ Reset code email sent successfully');
      
      return res.status(200).json({ 
        message: 'Password reset code has been sent to your email.',
        success: true
      });
    } catch (emailError) {
      console.error('❌ Failed to send reset code email:', emailError);
      return res.status(500).json({ 
        message: 'Failed to send reset code. Please try again later.' 
      });
    }
    
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    
    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔐 Reset password attempt for:', normalizedEmail);
    console.log('📝 Reset code provided:', resetCode);
    
    // Find user
    let user = await Student.findOne({ email: normalizedEmail }).select('+password +resetPasswordCode +resetPasswordExpiry');
    
    if (!user) {
      user = await Teacher.findOne({ email: normalizedEmail }).select('+password +resetPasswordCode +resetPasswordExpiry');
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or reset code' });
    }
    
    // Check if reset code exists
    if (!user.resetPasswordCode || !user.resetPasswordExpiry) {
      return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
    }
    
    // Check if code expired
    if (new Date() > user.resetPasswordExpiry) {
      console.log('⏰ Reset code expired');
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }
    
    // Verify reset code
    if (user.resetPasswordCode !== resetCode.trim()) {
      console.log('❌ Invalid reset code');
      return res.status(400).json({ message: 'Invalid reset code' });
    }
    
    console.log('✅ Reset code verified');
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear reset code
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    
    console.log('✅ Password reset successful');
    
    // Send confirmation email
    try {
      await sendPasswordResetEmail(user.email, user.name);
      console.log('✅ Password reset confirmation email sent');
    } catch (emailError) {
      console.error('⚠️ Password reset successful but confirmation email failed:', emailError);
    }
    
    return res.status(200).json({ 
      message: 'Password reset successful! You can now login with your new password.',
      success: true
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    let user = await Student.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      user = await Teacher.findOne({ email: normalizedEmail }).select('+password');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    // Send email notification
    try {
      await sendPasswordChangeEmail(user.email, user.name);
      console.log('✅ Password changed successfully - Email sent');
    } catch (emailError) {
      console.error('⚠️ Password changed but email failed:', emailError);
      // Don't fail the request if email fails
    }
    
    return res.status(200).json({ 
      message: 'Password changed successfully. A confirmation email has been sent.' 
    });
  } catch (err) {
    console.error('❌ Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  changePassword, 
  getStudentApprovals, 
  getTeacherApprovals,
  approveStudent, 
  approveTeacher,
  rejectStudent,
  rejectTeacher
};