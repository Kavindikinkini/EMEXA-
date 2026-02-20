// backend/src/controllers/teacherController.js
// FIXED VERSION - Corrected quiz time-based status categorization

import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import User from '../models/user.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import Notification from '../models/notification.js';
import { 
  sendEmailNotification, 
  sendProfileUpdateEmail,
  sendSettingsChangeEmail 
} from '../services/notificationEmail.service.js';

import { QuizResult } from '../models/quiz.js';
import QuizAttempt from '../models/quizAttempt.js'; 

// ============================================================================
// FIXED: Calculate teacher stats (ONLY for assigned students)
// ============================================================================
const calculateTeacherStats = async (teacherId) => {
  console.log('📊 Calculating teacher stats for:', teacherId);

  // Get all quizzes created by this teacher
  const teacherQuizzes = await TeacherQuiz.find({
    teacherId: teacherId,
    isDeleted: false
  }).lean();

  console.log('📚 Found teacher quizzes:', teacherQuizzes.length);

  // Get all quiz IDs
  const quizIds = teacherQuizzes.map(q => q._id);

  // CRITICAL FIX: Get ONLY students assigned to this teacher's quizzes
  const notifications = await Notification.find({
    quizId: { $in: quizIds },
    type: 'quiz_assigned',
    recipientRole: 'student'
  }).lean();

  // Get unique student IDs (ONLY students assigned to teacher's quizzes)
  const studentIds = [...new Set(notifications.map(n => n.recipientId.toString()))];
  const totalStudents = studentIds.length;

  console.log('👥 Total students assigned to teacher quizzes:', totalStudents);

  // Get all quiz results for these quizzes
  const quizResults = await QuizResult.find({
    quizId: { $in: quizIds }
  }).lean();

  console.log('📝 Found quiz results:', quizResults.length);

  // Calculate average progress (average score from all quiz results)
  let averageProgress = 0;
  if (quizResults.length > 0) {
    const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
    averageProgress = Math.round(totalScore / quizResults.length);
  }

  // FIXED: Calculate engagement level based on completion rate
  let engagementLevel = 'Low';
  let engagementPercentage = 0;
  
  if (totalStudents > 0) {
    // Total assignments = number of unique (student, quiz) pairs
    const totalAssignments = notifications.length;
    
    // Completed assignments = number of quiz submissions
    const completedAssignments = quizResults.length;
    
    engagementPercentage = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;
    
    if (engagementPercentage >= 80) {
      engagementLevel = 'High';
    } else if (engagementPercentage >= 60) {
      engagementLevel = 'Medium';
    } else {
      engagementLevel = 'Low';
    }
  }

  // Calculate present today (students who took a quiz today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Count unique students who submitted today
  const todayResults = await QuizResult.find({
    quizId: { $in: quizIds },
    submittedAt: { $gte: today, $lt: tomorrow }
  }).lean();
  
  const presentToday = [...new Set(todayResults.map(r => r.userId.toString()))].length;

  console.log('✅ Stats calculated:', {
    totalStudents,
    presentToday,
    averageProgress,
    engagementLevel,
    engagementPercentage
  });

  return {
    totalStudents,
    presentToday,
    averageProgress,
    targetProgress: 80,
    engagementLevel,
    engagementPercentage,
    weeklyChange: 5 // This would need historical data to calculate accurately
  };
};

/**
 * Get teacher dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    
    console.log('📊 Fetching dashboard stats for teacher:', teacherId);

    const stats = await calculateTeacherStats(teacherId);

    res.json({
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

/**
 * Get class progress data for chart (last 4 weeks)
 */
const getClassProgress = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    
    console.log('📈 Fetching class progress for teacher:', teacherId);

    // Get all quizzes by this teacher
    const teacherQuizzes = await TeacherQuiz.find({
      teacherId: teacherId,
      isDeleted: false
    }).lean();

    const quizIds = teacherQuizzes.map(q => q._id);

    // Calculate progress for last 4 weeks
    const progressData = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      // Get quiz results for this week
      const weekResults = await QuizResult.find({
        quizId: { $in: quizIds },
        submittedAt: { $gte: weekStart, $lte: weekEnd }
      }).lean();

      // Calculate average score for this week
      let completed = 0;
      if (weekResults.length > 0) {
        const totalScore = weekResults.reduce((sum, r) => sum + r.score, 0);
        completed = Math.round(totalScore / weekResults.length);
      }

      progressData.push({
        label: `Week ${4 - i}`,
        completed: completed,
        target: 80 // Fixed target
      });
    }

    res.json({
      success: true,
      data: progressData,
      message: 'Class progress retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching class progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class progress',
      error: error.message
    });
  }
};

// ============================================================================
// FIXED: Get engagement trend (last 5 days with data, not current week)
// ============================================================================
const getEngagementTrend = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    
    console.log('📊 Fetching engagement trend for teacher:', teacherId);

    // Get all quizzes by this teacher
    const teacherQuizzes = await TeacherQuiz.find({
      teacherId: teacherId,
      isDeleted: false
    }).lean();

    const quizIds = teacherQuizzes.map(q => q._id);

    // FIXED: Get total ASSIGNED students (not all students in database)
    const notifications = await Notification.find({
      quizId: { $in: quizIds },
      type: 'quiz_assigned',
      recipientRole: 'student'
    }).lean();
    
    const assignedStudentIds = [...new Set(notifications.map(n => n.recipientId.toString()))];
    const totalAssignedStudents = assignedStudentIds.length;

    console.log('📚 Total assigned students:', totalAssignedStudents);

    const engagementData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const today = new Date();
    
    // FIXED: Get last 5 weekdays instead of current week
    // This ensures we always show 5 days with actual data
    for (let i = 4; i >= 0; i--) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() - i);
      
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Get quiz results for this day
      const dayResults = await QuizResult.find({
        quizId: { $in: quizIds },
        submittedAt: { $gte: dayStart, $lte: dayEnd }
      }).lean();
      
      // Count unique students active on this day
      const activeStudents = [...new Set(dayResults.map(r => r.userId.toString()))].length;

      // FIXED: Calculate engagement as % of assigned students who were active
      let score = totalAssignedStudents > 0 
        ? Math.round((activeStudents / totalAssignedStudents) * 100)
        : 0;
      
      // Ensure score is between 0-100
      score = Math.min(Math.max(score, 0), 100);

      // Get day name
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

      engagementData.push({
        day: dayName,
        score: score
      });
    }

    res.json({
      success: true,
      data: engagementData,
      message: 'Engagement trend retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching engagement trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engagement trend',
      error: error.message
    });
  }
};

/**
 * Get emotional state distribution
 * NOTE: This requires emotion tracking to be implemented
 * For now, returns placeholder data
 */
const getEmotionalState = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    
    console.log('😊 Fetching emotional state for teacher:', teacherId);

    // TODO: Implement actual emotion tracking
    // For now, return placeholder data
    const emotionalData = {
      happy: 40,
      confused: 30,
      frustrated: 20,
      neutral: 10
    };

    res.json({
      success: true,
      data: emotionalData,
      message: 'Emotional state retrieved successfully (placeholder data)'
    });
  } catch (error) {
    console.error('❌ Error fetching emotional state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emotional state',
      error: error.message
    });
  }
};

/**
 * Get student overview list with actual data
 */
const getStudentOverview = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    const limit = parseInt(req.query.limit) || 4;
    
    console.log('👨‍🎓 Fetching student overview for teacher:', teacherId);

    // Get all quizzes by this teacher
    const teacherQuizzes = await TeacherQuiz.find({
      teacherId: teacherId,
      isDeleted: false
    }).lean();

    const quizIds = teacherQuizzes.map(q => q._id);

    // Get all students who have been assigned quizzes
    const notifications = await Notification.find({
      quizId: { $in: quizIds },
      type: 'quiz_assigned',
      recipientRole: 'student'
    }).lean();

    // Get unique student IDs
    const studentIds = [...new Set(notifications.map(n => n.recipientId))];

    // Get student details and their quiz results
    const studentsData = await Promise.all(
      studentIds.slice(0, limit).map(async (studentId) => {
        // Find student
        let student = await Student.findById(studentId).select('name email profileImage').lean();
        if (!student) {
          student = await User.findById(studentId).select('name email profileImage').lean();
        }

        if (!student) return null;

        // Get all quiz results for this student
        const studentResults = await QuizResult.find({
          userId: studentId,
          quizId: { $in: quizIds }
        }).lean();

        // Calculate average progress
        let progress = 0;
        if (studentResults.length > 0) {
          const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0);
          progress = Math.round(totalScore / studentResults.length);
        }

        // Calculate engagement level
        const totalAssigned = notifications.filter(n => n.recipientId.toString() === studentId.toString()).length;
        const completionRate = totalAssigned > 0 
          ? Math.round((studentResults.length / totalAssigned) * 100)
          : 0;
        
        let engagement = 'Low';
        if (completionRate >= 80) {
          engagement = 'High';
        } else if (completionRate >= 60) {
          engagement = 'Medium';
        }

        return {
          id: student._id,
          name: student.name,
          engagement: engagement,
          progress: progress,
          profileImage: student.profileImage || null
        };
      })
    );

    // Filter out null values
    const students = studentsData.filter(s => s !== null);

    res.json({
      success: true,
      data: students,
      total: studentIds.length,
      message: 'Student overview retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching student overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student overview',
      error: error.message
    });
  }
};

// ============================================================================
// FIXED: Sort recent quizzes - Active/Scheduled first, Drafts last
// ============================================================================
const getRecentQuizzes = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    const limit = parseInt(req.query.limit) || 3;
    
    console.log('📝 Fetching recent quizzes for teacher:', teacherId);

    // Get recent quizzes - NO STATUS FILTER (shows all including drafts)
    const quizzes = await TeacherQuiz.find({
      teacherId: teacherId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .lean();

    // FIXED: Sort by status priority (active/scheduled first, drafts last)
    const sortedQuizzes = quizzes.sort((a, b) => {
      const statusPriority = {
        'active': 1,
        'scheduled': 2,
        'closed': 3,
        'draft': 4
      };
      
      const aPriority = statusPriority[a.status] || 5;
      const bPriority = statusPriority[b.status] || 5;
      
      // First sort by status priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Within same status, sort by most recent
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Take only the limit
    const limitedQuizzes = sortedQuizzes.slice(0, limit);

    // Get completion stats for each quiz
    const quizzesWithStats = await Promise.all(
      limitedQuizzes.map(async (quiz) => {
        const totalStudents = await Notification.countDocuments({
          quizId: quiz._id,
          type: 'quiz_assigned',
          recipientRole: 'student'
        });

        const completed = await QuizResult.countDocuments({
          quizId: quiz._id
        });

        return {
          id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          dueDate: quiz.dueDate,
          scheduleDate: quiz.scheduleDate,
          totalStudents: totalStudents,
          completed: completed,
          status: quiz.status
        };
      })
    );

    res.json({
      success: true,
      data: quizzesWithStats,
      message: 'Recent quizzes retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching recent quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent quizzes',
      error: error.message
    });
  }
};

/**
 * Get teacher profile
 */
const getProfile = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    const teacher = await Teacher.findById(teacherId).select('-password');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: {
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
        department: teacher.department,
        specialization: teacher.specialization,
        role: teacher.role,
        profileImage: teacher.profileImage || null,
        settings: teacher.settings || {
          emailNotifications: true,
          smsNotifications: false,
          inAppNotifications: true,
          emotionConsent: true
        }
      },
      profileImage: teacher.profileImage || null
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * Update teacher profile (name)
 */
const updateProfile = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Send email notification if enabled
    try {
      const emailHtml = await sendProfileUpdateEmail(teacher.email, teacher.name || 'Teacher');
      await sendEmailNotification(
        teacherId,
        teacher.email,
        '✏️ Profile Updated - EMEXA',
        emailHtml
      );
    } catch (emailError) {
      console.error('❌ Error sending profile update email:', emailError.message);
    }

    res.json({
      success: true,
      data: {
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
        department: teacher.department,
        specialization: teacher.specialization,
        role: teacher.role
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Change password for authenticated teacher
 */
const changePassword = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const teacher = await Teacher.findById(teacherId).select('+password');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const isMatch = await teacher.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    teacher.password = newPassword;
    await teacher.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * Upload teacher profile image to Cloudinary
 */
const uploadProfileImage = async (req, res) => {
  try {
    console.log('📸 Upload profile image request received');
    console.log('User:', req.user || req.userId);
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const teacherId = req.userId || req.user._id || req.user.id;

    // Cloudinary URL from multer-storage-cloudinary
    const profileImageUrl = req.file.path;
    console.log('☁️  Cloudinary URL:', profileImageUrl);

    // Update teacher's profile image in database
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { profileImage: profileImageUrl },
      { new: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    console.log('✅ Profile image updated in database');

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: profileImageUrl,
      data: {
        profileImage: profileImageUrl
      }
    });

  } catch (error) {
    console.error('❌ Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
};

/**
 * Get teacher settings (notifications & privacy)
 */
const getSettings = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    
    const teacher = await Teacher.findById(teacherId).select('settings');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Default settings if none exist
    const settings = teacher.settings || {
      emailNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      emotionConsent: true
    };

    console.log('✅ Settings retrieved from database:', settings);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Update teacher settings (notifications & privacy)
 */
const updateSettings = async (req, res) => {
  try {
    const teacherId = req.userId || req.user._id;
    const { 
      emailNotifications, 
      smsNotifications, 
      inAppNotifications, 
      emotionConsent 
    } = req.body;

    console.log('📝 Updating settings for teacher:', teacherId);
    console.log('Received settings:', req.body);

    // Get current settings first to preserve existing values
    const teacher = await Teacher.findById(teacherId).select('settings email name');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Store previous settings for comparison
    const previousSettings = { ...teacher.settings } || {};

    // Merge with existing settings - only update provided fields
    const currentSettings = teacher.settings || {};
    const settings = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : (currentSettings.emailNotifications ?? true),
      smsNotifications: smsNotifications !== undefined ? smsNotifications : (currentSettings.smsNotifications ?? false),
      inAppNotifications: inAppNotifications !== undefined ? inAppNotifications : (currentSettings.inAppNotifications ?? true),
      emotionConsent: emotionConsent !== undefined ? emotionConsent : (currentSettings.emotionConsent ?? true)
    };

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { settings },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Settings saved to database:', updatedTeacher.settings);

    // Prepare changed settings for email
    const changedSettings = {};
    if (emailNotifications !== undefined && emailNotifications !== previousSettings.emailNotifications) {
      changedSettings.emailNotifications = emailNotifications;
    }
    if (smsNotifications !== undefined && smsNotifications !== previousSettings.smsNotifications) {
      changedSettings.smsNotifications = smsNotifications;
    }
    if (inAppNotifications !== undefined && inAppNotifications !== previousSettings.inAppNotifications) {
      changedSettings.inAppNotifications = inAppNotifications;
    }
    if (emotionConsent !== undefined && emotionConsent !== previousSettings.emotionConsent) {
      changedSettings.emotionConsent = emotionConsent;
    }

    // Send email notification if settings were changed (only if email notifications are still enabled)
    if (Object.keys(changedSettings).length > 0 && settings.emailNotifications) {
      try {
        const emailHtml = await sendSettingsChangeEmail(
          teacher.email,
          teacher.name || 'Teacher',
          changedSettings
        );
        await sendEmailNotification(
          teacherId,
          teacher.email,
          '⚙️ Settings Updated - EMEXA',
          emailHtml
        );
      } catch (emailError) {
        console.error('❌ Error sending settings change email:', emailError.message);
      }
    }

    res.json({
      success: true,
      data: updatedTeacher.settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

// ============================================
// FIXED: GET TEACHER ACTIVITIES with time-based status
// ============================================
export const getTeacherActivities = async (req, res) => {
  try {
    const teacherId = req.user?.id || req.user?._id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('📊 Fetching activities for teacherId:', teacherId);

    // Get all quizzes created by this teacher
    const teacherQuizzes = await TeacherQuiz.find({
      teacherId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${teacherQuizzes.length} quizzes`);

    const now = new Date();

    // Transform data for frontend with additional statistics
    const formattedActivities = await Promise.all(
      teacherQuizzes.map(async (quiz) => {
        // Get submission statistics for this quiz
        const submissions = await QuizAttempt.find({ quizId: quiz._id }).lean();
        
        const totalAttempts = submissions.length;
        const averageScore = submissions.length > 0
          ? Math.round(submissions.reduce((sum, s) => sum + s.finalScore, 0) / submissions.length * 100) / 100
          : 0;

        // Get unique students who attempted
        const uniqueStudents = [...new Set(submissions.map(s => s.userId.toString()))];
        const studentCount = uniqueStudents.length;

        // Calculate completion rate
        const completedSubmissions = submissions.filter(s => s.completedAt).length;
        const completionRate = totalAttempts > 0 
          ? Math.round((completedSubmissions / totalAttempts) * 100)
          : 0;

        // ✅ CRITICAL FIX: Calculate ACTUAL status based on time
        let actualStatus = quiz.status;
        
        if (quiz.isScheduled && quiz.scheduleDate && quiz.startTime && quiz.endTime) {
          const scheduleDate = new Date(quiz.scheduleDate);
          const [startHour, startMinute] = quiz.startTime.split(':').map(Number);
          const [endHour, endMinute] = quiz.endTime.split(':').map(Number);
          
          const startDateTime = new Date(scheduleDate);
          startDateTime.setHours(startHour, startMinute, 0, 0);
          
          const endDateTime = new Date(scheduleDate);
          endDateTime.setHours(endHour, endMinute, 0, 0);
          
          // Handle case where quiz spans across midnight
          if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
            endDateTime.setDate(endDateTime.getDate() + 1);
          }
          
          // Determine actual status based on current time
          if (now < startDateTime) {
            actualStatus = 'scheduled';
          } else if (now >= startDateTime && now < endDateTime) {
            actualStatus = 'active';
          } else {
            actualStatus = 'closed';
          }
        }

        return {
          id: quiz._id,
          quizTitle: quiz.title,
          subject: quiz.subject,
          gradeLevel: Array.isArray(quiz.gradeLevel) ? quiz.gradeLevel.join(', ') : quiz.gradeLevel,
          status: actualStatus, // ✅ CHANGED: was quiz.status
          isScheduled: quiz.isScheduled,
          scheduleDate: quiz.scheduleDate,
          createdAt: quiz.createdAt,
          lastEdited: quiz.lastEdited,
          totalQuestions: quiz.questions?.length || 0,
          totalAttempts,
          studentCount,
          averageScore,
          completionRate,
          progress: quiz.progress || 0
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formattedActivities.length,
      data: formattedActivities
    });
  } catch (error) {
    console.error('❌ Error fetching teacher activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// ============================================
// ADDED: GET TEACHER ACTIVITY STATISTICS
// ============================================
export const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user?.id || req.user?._id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('📊 Fetching stats for teacherId:', teacherId);

    // Get all quizzes by this teacher
    const quizzes = await TeacherQuiz.find({
      teacherId,
      isDeleted: false
    }).lean();

    // Get all attempts for teacher's quizzes
    const quizIds = quizzes.map(q => q._id);
    const allAttempts = await QuizAttempt.find({
      quizId: { $in: quizIds }
    }).lean();

    // Calculate statistics
    const totalQuizzes = quizzes.length;
    const draftQuizzes = quizzes.filter(q => q.status === 'draft').length;
    const scheduledQuizzes = quizzes.filter(q => q.isScheduled).length;
    const activeQuizzes = quizzes.filter(q => q.status === 'active').length;
    const closedQuizzes = quizzes.filter(q => q.status === 'closed').length; 

    const totalAttempts = allAttempts.length;
    const averageScore = allAttempts.length > 0
      ? Math.round(allAttempts.reduce((sum, a) => sum + a.finalScore, 0) / allAttempts.length * 100) / 100
      : 0;

    // Get unique students
    const uniqueStudents = [...new Set(allAttempts.map(a => a.userId.toString()))];
    const totalStudents = uniqueStudents.length;

    // Calculate engagement rate (students who completed vs total attempts)
    const completedAttempts = allAttempts.filter(a => a.completedAt).length;
    const engagementRate = totalAttempts > 0
      ? Math.round((completedAttempts / totalAttempts) * 100)
      : 0;

    console.log('✅ Stats calculated:', {
      totalQuizzes,
      totalAttempts,
      averageScore,
      totalStudents
    });

    res.status(200).json({
      success: true,
      data: {
        totalQuizzes,
        draftQuizzes,
        scheduledQuizzes,
        activeQuizzes,
        closedQuizzes,
        totalAttempts,
        totalStudents,
        averageScore,
        engagementRate
      }
    });
  } catch (error) {
    console.error('❌ Error fetching teacher stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// ============================================
// ADDED: GET QUIZ PERFORMANCE DETAILS
// ============================================
export const getQuizPerformance = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user?.id || req.user?._id;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('📊 Fetching performance for quizId:', quizId);

    // Verify quiz ownership
    const quiz = await TeacherQuiz.findOne({
      _id: quizId,
      teacherId,
      isDeleted: false
    }).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or unauthorized'
      });
    }

    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({ quizId }).lean();

    // Get student details for each attempt
    const studentIds = [...new Set(attempts.map(a => a.userId))];
    const students = await Student.find({
      _id: { $in: studentIds }
    }).select('name email').lean();

    const studentMap = {};
    students.forEach(s => {
      studentMap[s._id.toString()] = s;
    });

    // Format attempts with student info
    const formattedAttempts = attempts.map(attempt => ({
      attemptId: attempt._id,
      studentId: attempt.userId,
      studentName: studentMap[attempt.userId.toString()]?.name || 'Unknown Student',
      studentEmail: studentMap[attempt.userId.toString()]?.email || '',
      score: attempt.finalScore,
      correctAnswers: attempt.rawScore,
      totalQuestions: attempt.answers?.length || 0,
      hintsUsed: attempt.hintsUsed || 0,
      completedAt: attempt.completedAt,
      timeSpent: 0 // Add if you have this field
    }));

    // Calculate statistics
    const averageScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.finalScore, 0) / attempts.length * 100) / 100
      : 0;

    const highestScore = attempts.length > 0
      ? Math.max(...attempts.map(a => a.finalScore))
      : 0;

    const lowestScore = attempts.length > 0
      ? Math.min(...attempts.map(a => a.finalScore))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          totalQuestions: quiz.questions?.length || 0
        },
        statistics: {
          totalAttempts: attempts.length,
          uniqueStudents: studentIds.length,
          averageScore,
          highestScore,
          lowestScore
        },
        attempts: formattedAttempts.sort((a, b) => 
          new Date(b.completedAt) - new Date(a.completedAt)
        )
      }
    });
  } catch (error) {
    console.error('❌ Error fetching quiz performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz performance',
      error: error.message
    });
  }
};

export default {
  getDashboardStats,
  getClassProgress,
  getEngagementTrend,
  getEmotionalState,
  getStudentOverview,
  getRecentQuizzes,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  getSettings,
  updateSettings,
  getTeacherActivities, 
  getTeacherStats, 
  getQuizPerformance
};