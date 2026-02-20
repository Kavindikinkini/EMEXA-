import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import User from '../models/user.js';
import ApiError from '../utils/apiError.js';

class UserService {
  // ============================================
  // REGISTRATION - Now handled by authController
  // These are kept for backward compatibility
  // ============================================
  async registerStudent(userData) {
    const email = userData.email.toLowerCase().trim();
    
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });
    const existingUser = await User.findOne({ email });
    
    if (existingStudent || existingTeacher || existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const student = await Student.create({ ...userData, email });
    const token = student.generateAuthToken();

    const userResponse = {
      _id: student._id,
      id: student._id,
      name: student.name,
      email: student.email,
      role: 'student',
      isActive: student.isActive,
      studentId: student.studentId
    };

    return { user: userResponse, token };
  }

  async registerTeacher(userData) {
    const email = userData.email.toLowerCase().trim();
    
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });
    const existingUser = await User.findOne({ email });
    
    if (existingStudent || existingTeacher || existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const teacher = await Teacher.create({ ...userData, email });
    const token = teacher.generateAuthToken();

    const userResponse = {
      _id: teacher._id,
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: 'teacher',
      isActive: teacher.isActive,
      teacherId: teacher.teacherId
    };

    return { user: userResponse, token };
  }

  async registerUser(userData) {
    if (userData.role === 'teacher') {
      return this.registerTeacher(userData);
    } else {
      return this.registerStudent(userData);
    }
  }

  // ============================================
  // FIND USER BY EMAIL
  // ============================================
  async findByEmail(email) {
    const student = await Student.findOne({ email });
    if (student) return student;
    
    const teacher = await Teacher.findOne({ email });
    if (teacher) return teacher;
    
    const user = await User.findOne({ email });
    if (user) return user;
    
    return null;
  }

  // ============================================
  // LOGIN - Now handled by authController
  // Kept for backward compatibility
  // ============================================
  async loginUser(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    
    let user = await Student.findOne({ email: normalizedEmail }).select('+password');
    let userRole = 'student';
    
    if (!user) {
      user = await Teacher.findOne({ email: normalizedEmail }).select('+password');
      userRole = 'teacher';
    }
    
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated. Please contact support.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Incorrect password. Please try again.');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = user.generateAuthToken();

    const userResponse = {
      _id: user._id,
      id: user._id,
      name: user.name || user.fullName || user.full_name || '',
      email: user.email,
      role: user.role || userRole || 'student',
      isActive: user.isActive,
      profileImage: user.profileImage || null,
      notificationSettings: user.notificationSettings || {
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true
      },
      privacySettings: user.privacySettings || {
        emotionDataConsent: true
      },
      ...(user.studentId && { studentId: user.studentId }),
      ...(user.teacherId && { teacherId: user.teacherId })
    };

    return { user: userResponse, token };
  }

  // ============================================
  // GET USER BY ID
  // ============================================
  async getUserById(id) {
    let user = await Student.findById(id);
    if (user) return user;
    
    user = await Teacher.findById(id);
    if (user) return user;
    
    user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  // ============================================
  // GET ALL APPROVED USERS (FIXED VERSION)
  // Returns students, teachers, and admins who can login
  // ============================================
  async getAllUsers(filter = {}, options = {}) {
    try {
      console.log('📋 Fetching all approved users...');
      console.log('Filter received:', filter);
      
      // Build query for approved users only
      const studentQuery = { 
        approvalStatus: 'approved',
        isActive: true
      };
      
      const teacherQuery = { 
        approvalStatus: 'approved',
        isActive: true
      };
      
      // Apply additional filters if provided
      if (filter.role) {
        console.log('Role filter applied:', filter.role);
      }
      
      // Fetch approved students
      const students = await Student.find(studentQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(options?.limit || 1000)
        .lean();
      
      console.log(`Found ${students.length} approved students`);
      
      // Fetch approved teachers
      const teachers = await Teacher.find(teacherQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(options?.limit || 1000)
        .lean();
      
      console.log(`Found ${teachers.length} approved teachers`);
      
      // Fetch admins (all admins are automatically approved)
      const admins = await User.find({ 
        role: { $in: ['admin', 'Admin'] },
        isActive: true
      })
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(options?.limit || 1000)
        .lean();
      
      console.log(`Found ${admins.length} admins`);
      
      // Normalize data structure
      const normalizedStudents = students.map(s => ({
        _id: s._id,
        name: s.name || 'N/A',
        email: s.email,
        role: 'student',
        status: s.status || 'Active',
        approvalStatus: s.approvalStatus || 'approved',
        profileImage: s.profileImage || null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        isActive: s.isActive !== undefined ? s.isActive : true
      }));
      
      const normalizedTeachers = teachers.map(t => ({
        _id: t._id,
        name: t.name || 'N/A',
        email: t.email,
        role: 'teacher',
        status: t.status || 'Active',
        approvalStatus: t.approvalStatus || 'approved',
        profileImage: t.profileImage || null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        isActive: t.isActive !== undefined ? t.isActive : true
      }));
      
      const normalizedAdmins = admins.map(a => ({
        _id: a._id,
        name: a.name || 'N/A',
        email: a.email,
        role: 'admin',
        status: a.status || 'Active',
        approvalStatus: 'approved',
        profileImage: a.profileImage || null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        isActive: a.isActive !== undefined ? a.isActive : true
      }));
      
      // Combine all users
      let allUsers = [
        ...normalizedStudents,
        ...normalizedTeachers,
        ...normalizedAdmins
      ];
      
      // Apply role filter if specified
      if (filter.role) {
        allUsers = allUsers.filter(u => u.role === filter.role.toLowerCase());
      }
      
      // Sort by creation date (newest first)
      allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('✅ Users fetched and normalized:', {
        students: normalizedStudents.length,
        teachers: normalizedTeachers.length,
        admins: normalizedAdmins.length,
        total: allUsers.length,
        roleFilter: filter.role || 'none'
      });
      
      return {
        users: allUsers,
        students: normalizedStudents,
        teachers: normalizedTeachers,
        admins: normalizedAdmins,
        total: allUsers.length
      };
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error);
      throw error;
    }
  }

  // ============================================
  // UPDATE USER
  // ============================================
  async updateUser(id, updateData) {
    let user = await Student.findById(id);
    let Model = Student;
    
    if (!user) {
      user = await Teacher.findById(id);
      Model = Teacher;
    }
    
    if (!user) {
      user = await User.findById(id);
      Model = User;
    }
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingStudent = await Student.findOne({ email: updateData.email });
      const existingTeacher = await Teacher.findOne({ email: updateData.email });
      const existingUser = await User.findOne({ email: updateData.email });
      
      if (existingStudent || existingTeacher || existingUser) {
        throw ApiError.conflict('Email already in use');
      }
    }

    return await Model.findByIdAndUpdate(id, updateData, { new: true });
  }

  // ============================================
  // DELETE USER
  // ============================================
  async deleteUser(id) {
    let user = await Student.findById(id);
    let Model = Student;
    let collection = 'Student';
    
    if (!user) {
      user = await Teacher.findById(id);
      Model = Teacher;
      collection = 'Teacher';
    }
    
    if (!user) {
      user = await User.findById(id);
      Model = User;
      collection = 'User';
    }
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    console.log(`🗑️ Deleting user from ${collection} collection:`, user.email);
    
    // Also delete from User collection if exists (for approval records)
    if (collection === 'Student' || collection === 'Teacher') {
      await User.deleteOne({ email: user.email });
      console.log('🗑️ Also deleted approval record from User collection');
    }
    
    return await Model.findByIdAndDelete(id);
  }
}

export default new UserService();