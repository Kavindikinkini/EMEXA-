import TeacherQuiz from '../models/teacherQuiz.js';
import Teacher from '../models/teacher.js';
import Notification from '../models/notification.js';
import { createQuizNotification } from './notificationController.js';
import { QuizResult } from '../models/quiz.js';
import { 
  sendEmailNotification, 
  sendQuizSubmissionEmail,
  sendQuizShareConfirmationEmail,
  sendMajorityCompletionEmail
} from '../services/notificationEmail.service.js';
import Student from '../models/student.js';

// Create a new quiz (draft)
export const createQuiz = async (req, res) => {
  try {
    const {
      title,
      subject,
      gradeLevel,
      questions
    } = req.body;

    console.log('📝 Create Quiz Request:', { title, subject, gradeLevel, questions: questions?.length });

    // Validate required fields
    if (!title || !subject || !gradeLevel) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, subject, or gradeLevel'
      });
    }

    // Get teacher ID from authenticated user
    const teacherId = req.user?.id || req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login as a teacher.'
      });
    }

    console.log('👤 Teacher ID:', teacherId);

    // Create new quiz
    const newQuiz = new TeacherQuiz({
      teacherId,
      title,
      subject,
      gradeLevel,
      questions: questions || [],
      status: 'draft',
      isScheduled: false
    });

    // Calculate initial progress
    newQuiz.calculateProgress();

    // Save to database
    await newQuiz.save();

    console.log('✅ Quiz saved to database:', newQuiz._id);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz: newQuiz
    });
  } catch (error) {
    console.error('❌ Error creating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message
    });
  }
};

export const getTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user?.id || req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const quizzes = await TeacherQuiz.findByTeacher(teacherId);
    
    // ✅ NEW: Update status based on current time
    const now = new Date();
    const updatedQuizzes = quizzes.map(quiz => {
      const quizObj = quiz.toObject();
      
      // Calculate real-time status
      if (quiz.isScheduled && quiz.scheduleDate && quiz.startTime && quiz.endTime) {
        const scheduleDate = new Date(quiz.scheduleDate);
        const [startHour, startMinute] = quiz.startTime.split(':').map(Number);
        const [endHour, endMinute] = quiz.endTime.split(':').map(Number);
        
        const startDateTime = new Date(scheduleDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        let endDateTime;
if (quiz.dueDate) {
  // Use dueDate if available
  endDateTime = new Date(quiz.dueDate);
  endDateTime.setHours(23, 59, 59, 999); 
} else if (quiz.endTime) {
  // Fallback to endTime if no dueDate
  const [endHour, endMinute] = quiz.endTime.split(':').map(Number);
  endDateTime = new Date(scheduleDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  // Handle midnight crossover
  if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
    endDateTime.setDate(endDateTime.getDate() + 1);
}

} else {
  // No end time specified - treat as active indefinitely after start
  endDateTime = new Date('2099-12-31');
}
        
        // ✅ Set real-time status
        if (now < startDateTime) {
          quizObj.status = 'scheduled';
        } else if (now >= startDateTime && now < endDateTime) {
          quizObj.status = 'active';
        } else {
          quizObj.status = 'closed';
        }
      }
      
      return quizObj;
    });
    
    res.status(200).json({
      success: true,
      count: updatedQuizzes.length,
      quizzes: updatedQuizzes
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: error.message
    });
  }
};

// Get all draft quizzes
export const getDrafts = async (req, res) => {
  try {
    const teacherId = req.user?.id || req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const drafts = await TeacherQuiz.findDrafts(teacherId);
    
    console.log('📋 Fetched drafts:', drafts.length);
    
    res.status(200).json({
      success: true,
      count: drafts.length,
      drafts
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drafts',
      error: error.message
    });
  }
};

// Get all scheduled quizzes
export const getScheduledQuizzes = async (req, res) => {
  try {
    const teacherId = req.user?.id || req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const scheduled = await TeacherQuiz.findScheduled(teacherId);
    
    console.log('📅 Fetched scheduled quizzes:', scheduled.length);
    
    res.status(200).json({
      success: true,
      count: scheduled.length,
      quizzes: scheduled
    });
  } catch (error) {
    console.error('Error fetching scheduled quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled quizzes',
      error: error.message
    });
  }
};

// Get a single quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📖 Get Quiz By ID:', id);
    
    // For testing without auth, just find by ID
    const quiz = await TeacherQuiz.findOne({
      _id: id,
      isDeleted: false
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    res.status(200).json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: error.message
    });
  }
};

// Update a quiz
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('✏️ Update Quiz:', id, updateData);
    
    // Find quiz (skip ownership check for testing)
    const quiz = await TeacherQuiz.findOne({
      _id: id,
      isDeleted: false
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'teacherId' && key !== 'createdAt') {
        quiz[key] = updateData[key];
      }
    });
    
    // Recalculate progress if questions were updated
    if (updateData.questions) {
      quiz.calculateProgress();
    }
    
    await quiz.save();
    
    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz',
      error: error.message
    });
  }
};

// Schedule a quiz
export const scheduleQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleDate, startTime, endTime, dueDate, semester, academicYear, maxAttempts } = req.body;
    console.log('🗓️ Schedule Quiz:', id, { scheduleDate, startTime, endTime, dueDate, semester, academicYear });
    
    // Validate schedule data
    if (!scheduleDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing schedule data: scheduleDate, startTime, or endTime'
      });
    }
    
    // Validate semester if provided
    if (semester && !['1st semester', '2nd semester'].includes(semester)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester. Must be "1st semester" or "2nd semester"'
      });
    }
    
    // Find quiz (skip ownership check for testing)
    const quiz = await TeacherQuiz.findOne({
      _id: id,
      isDeleted: false
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Update schedule information
    quiz.isScheduled = true;
    quiz.scheduleDate = new Date(scheduleDate);
    quiz.startTime = startTime;
    quiz.endTime = endTime;
    if (dueDate) {
      quiz.dueDate = new Date(dueDate);
    }
    // Store semester and academic year for filtering
    if (semester) {
      quiz.semester = semester;
    }
    if (academicYear) {
      quiz.academicYear = academicYear;
    }
    if (maxAttempts) {
     quiz.maxAttempts = parseInt(maxAttempts);
    }
    quiz.status = 'scheduled'; // Set to scheduled, not active
    
    await quiz.save();
    
    console.log('✅ Quiz scheduled:', quiz._id);
    
    // Get teacher and count students with matching semester/academic year
    const teacher = await Teacher.findById(quiz.teacherId);
    const teacherName = teacher ? teacher.name : 'Teacher';
    
    // Build filter for students based on semester and academic year
    const studentFilter = {};
    if (semester) {
      studentFilter.semester = semester;
    }
    if (academicYear) {
      // Convert numeric year to string format (1 -> '1st year', 2 -> '2nd year', etc.)
      const yearStrings = {
        1: '1st year',
        2: '2nd year',
        3: '3rd year',
        4: '4th year'
      };
      const yearString = yearStrings[parseInt(academicYear)];
      if (yearString) {
        studentFilter.year = yearString;
      }
    }
    
    const students = await Student.countDocuments(studentFilter);
    console.log(`📚 Filtered students by semester: ${semester}, year: ${academicYear} - Count: ${students}`);
    
    // Create notifications for filtered students
// ✅ Pass ALL required data including scheduleDate, startTime, endTime, and dueDate
const notificationResult = await createQuizNotification(quiz._id, {
  title: quiz.title,
  subject: quiz.subject,
  scheduleDate: scheduleDate,    
  startTime: startTime,          
  endTime: endTime,              
  dueDate: dueDate,              
  semester: semester,
  academicYear: academicYear
}, teacherName);
    console.log('🔔 Notification result:', notificationResult);
    
    // ✅ FIXED: Create in-app notification for teacher (removed incorrect require())
    try {
      // Format dates nicely for teacher notification
      const formatDateNice = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });
      };
      const formatTime12H = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hr = parseInt(h);
        const disp = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
        return `${disp}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
      };

      const availableFrom = `${formatDateNice(scheduleDate)} at ${formatTime12H(startTime)}`;
      const dueOn = dueDate
        ? `${formatDateNice(dueDate)} at ${formatTime12H(endTime)}`
        : `${formatDateNice(scheduleDate)} at ${formatTime12H(endTime)}`;

      await Notification.create({
        recipientId: quiz.teacherId,
        recipientRole: 'teacher',
        type: 'quiz_assigned',
        title: `Quiz Shared: ${quiz.title}`,
        description: `Your quiz "${quiz.title}" has been shared with ${students} students.\n\n📅 Available from: ${availableFrom}\n⏰ Due: ${dueOn}`,
        quizId: quiz._id,
        instructor: teacherName,
        dueDate: dueDate || scheduleDate,
        status: 'completed',
        isRead: false
      });
      console.log('✅ In-app notification created for teacher');
    } catch (notifError) {
      console.error('❌ Error creating in-app notification for teacher:', notifError.message);
      // Don't fail the request if notification creation fails
    }
    
    // Send confirmation email to teacher
    try {
      if (teacher && teacher.email) {
        const emailHtml = await sendQuizShareConfirmationEmail(
          teacher.email,
          teacherName,
          quiz.title,
          students,
          scheduleDate,
          startTime,
          endTime
        );
        
        await sendEmailNotification(
          quiz.teacherId,
          teacher.email,
          `✅ Quiz Shared: ${quiz.title}`,
          emailHtml
        );
        console.log('✅ Quiz share confirmation email sent to teacher:', teacher.email);
      }
    } catch (emailError) {
      console.error('❌ Error sending quiz share confirmation email to teacher:', emailError.message);
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Quiz scheduled successfully and notifications sent',
      quiz,
      notificationsSent: notificationResult.count || 0
    });
  } catch (error) {
    console.error('Error scheduling quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule quiz',
      error: error.message
    });
  }
};

// Delete a quiz (soft delete)
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Delete Quiz:', id);
    
    const quiz = await TeacherQuiz.findOne({
      _id: id,
      isDeleted: false
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    console.log(`🗑️ Deleting quiz: "${quiz.title}" (ID: ${id})`);
    
    // Soft delete the quiz
    quiz.isDeleted = true;
    await quiz.save();
    
    // Delete all related notifications for students
    const notificationResult = await Notification.deleteMany({ quizId: id });
    console.log(`🔔 Deleted ${notificationResult.deletedCount} notifications for quiz: ${id}`);
    
    // Trigger a refresh event for students (if you have socket.io set up)
    // This would notify connected students to refresh their quiz list
    console.log('✅ Quiz and related data deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Quiz and related notifications deleted successfully',
      deletedNotifications: notificationResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
      error: error.message
    });
  }
};

// Permanent delete (admin only or for cleanup)
export const permanentDeleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('⚠️ Permanent Delete Quiz:', id);
    
    // Get quiz info before deleting
    const quiz = await TeacherQuiz.findById(id);
    if (quiz) {
      console.log(`⚠️ Permanently deleting quiz: "${quiz.title}" (ID: ${id})`);
    }
    
    const result = await TeacherQuiz.findOneAndDelete({
      _id: id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Delete all related notifications for students
    const notificationResult = await Notification.deleteMany({ quizId: id });
    console.log(`🔔 Deleted ${notificationResult.deletedCount} notifications for permanently deleted quiz: ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Quiz and related notifications permanently deleted',
      deletedNotifications: notificationResult.deletedCount
    });
  } catch (error) {
    console.error('Error permanently deleting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
      error: error.message
    });
  }
};

// Get quiz statistics for teacher
export const getQuizStats = async (req, res) => {
  try {
    const teacherId = req.user?.id || req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log('📊 Get Quiz Stats for teacher:', teacherId);
    
    // Get all quizzes for this teacher
    const allQuizzes = await TeacherQuiz.find({
      teacherId: teacherId,
      isDeleted: false
    });
    
    console.log('📊 Total quizzes found:', allQuizzes.length);
    
    // Debug: Log each quiz's status
    allQuizzes.forEach((quiz, index) => {
      console.log(`Quiz ${index + 1}:`, {
        id: quiz._id,
        title: quiz.title,
        status: quiz.status,
        isScheduled: quiz.isScheduled,
        scheduleDate: quiz.scheduleDate,
        startTime: quiz.startTime,
        endTime: quiz.endTime
      });
    });
    
    // Count by status with custom logic for scheduled
    const formattedStats = {
      total: allQuizzes.length,
      drafts: 0,
      scheduled: 0,
      active: 0,
      closed: 0
    };
    
    allQuizzes.forEach(quiz => {
      // Check if scheduled quiz is currently active or expired
      const now = new Date();
      let isCurrentlyActive = false;
      let isExpired = false;
      let isUpcoming = false;
      
      if (quiz.isScheduled && quiz.scheduleDate && quiz.startTime && quiz.endTime) {
  const scheduleDate = new Date(quiz.scheduleDate);
  const [startHour, startMinute] = quiz.startTime.split(':').map(Number);
  
  const startDateTime = new Date(scheduleDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  let endDateTime;
  if (quiz.dueDate) {
    // Use dueDate if available
    endDateTime = new Date(quiz.dueDate);
    endDateTime.setHours(23, 59, 59, 999); 
  } else if (quiz.endTime) {
    // Fallback to endTime if no dueDate
    const [endHour, endMinute] = quiz.endTime.split(':').map(Number);
    endDateTime = new Date(scheduleDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    // Handle midnight crossover
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
  } else {
    // No end time specified - treat as active indefinitely after start
    endDateTime = new Date('2099-12-31');
  }
  
  isUpcoming = now < startDateTime;
  isCurrentlyActive = now >= startDateTime && now < endDateTime;
  isExpired = now >= endDateTime;
  
  console.log(`📊 Quiz "${quiz.title}": now=${now.toISOString()}, start=${startDateTime.toISOString()}, end=${endDateTime.toISOString()}, isActive=${isCurrentlyActive}, isExpired=${isExpired}`);
}
      
      // ✅ FIX #2: COMPLETELY TIME-BASED counting - separate logic for scheduled vs non-scheduled
      if (quiz.isScheduled) {
        // For SCHEDULED quizzes, ONLY use real-time calculation (ignore DB status)
        if (isUpcoming) {
          formattedStats.scheduled++;
        } else if (isCurrentlyActive) {
          formattedStats.active++;
        } else if (isExpired) {
          formattedStats.closed++;
        }
      } else {
        // For NON-SCHEDULED quizzes, use DB status
        if (quiz.status === 'draft') {
          formattedStats.drafts++;
        } else if (quiz.status === 'active') {
          formattedStats.active++;
        } else if (quiz.status === 'scheduled') {
          formattedStats.scheduled++;
        } else if (quiz.status === 'closed' || quiz.status === 'completed') {
          formattedStats.closed++;
        }
      }
    });
    
    console.log('📊 Formatted stats:', formattedStats);
    
    res.status(200).json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics',
      error: error.message
    });
  }
};

/**
 * Get shared quizzes for students
 * FIXED: Now filters by student's year and semester
 */
export const getSharedQuizzes = async (req, res) => {
  try {
    const userId = req.user.id; // Student ID from JWT token
    
    console.log('📚 Fetching shared quizzes for student:', userId);

    // CRITICAL: Get the student's year and semester
    const student = await Student.findById(userId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('👤 Student details:', {
      id: student._id,
      name: student.name,
      year: student.year,           // Using 'year' field from Student model
      semester: student.semester     // Using 'semester' field from Student model
    });

    const now = new Date();

    // Build the filter query
    const filterQuery = {
      isScheduled: true,  // Must be scheduled
      isDeleted: false,   // Not deleted
    };

    // CRITICAL FIX: Match student's year to quiz's academicYear
    // Convert student.year ("2nd year") to academicYear number (2)
    if (student.year) {
      const yearMapping = {
        '1st year': 1,
        '2nd year': 2,
        '3rd year': 3,
        '4th year': 4
      };
      
      const academicYearNum = yearMapping[student.year];
      if (academicYearNum) {
        filterQuery.academicYear = academicYearNum;
        console.log(`🔍 Filtering by academicYear: ${academicYearNum} (from student.year: ${student.year})`);
      }
    }

    // CRITICAL FIX: Match student's semester to quiz's semester
    if (student.semester) {
      filterQuery.semester = student.semester;
      console.log(`🔍 Filtering by semester: ${student.semester}`);
    }

    console.log('🔍 Final filter query:', filterQuery);

    // Query quizzes with the filter
    const quizzes = await TeacherQuiz.find(filterQuery)
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${quizzes.length} quizzes for ${student.year} - ${student.semester}`);

    // ✅ FIXED: Process each quiz with dueDate support
    const processedQuizzes = await Promise.all(quizzes.map(async quiz => {
      const quizObj = quiz.toObject();
      
      let timeStatus = 'active';
      let isCurrentlyActive = true;

      if (quiz.scheduleDate && quiz.startTime) {
        const scheduleDate = new Date(quiz.scheduleDate);
        const [startHour, startMinute] = quiz.startTime.split(':').map(Number);
        
        const startDateTime = new Date(scheduleDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        // Check if quiz hasn't started yet
        if (now < startDateTime) {
          timeStatus = 'upcoming';
          isCurrentlyActive = false;
        }
        
        // ✅ CRITICAL FIX: Use dueDate if available, otherwise use endTime
        let endDateTime;
        if (quiz.dueDate) {
          endDateTime = new Date(quiz.dueDate);
          endDateTime.setHours(23, 59, 59, 999); 
          console.log(`📅 Quiz "${quiz.title}" using dueDate: ${endDateTime.toISOString()}`);
        } else if (quiz.endTime) {
          const [endHour, endMinute] = quiz.endTime.split(':').map(Number);
          endDateTime = new Date(scheduleDate);
          endDateTime.setHours(endHour, endMinute, 0, 0);
          
          // Handle midnight-spanning quizzes
          if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
            endDateTime.setDate(endDateTime.getDate() + 1);
          }
          console.log(`⏰ Quiz "${quiz.title}" using endTime: ${endDateTime.toISOString()}`);
        }
        
        // Check if quiz has expired
        if (endDateTime && now > endDateTime) {
          timeStatus = 'expired';
          isCurrentlyActive = false;
        }
        
        console.log(`📊 Quiz "${quiz.title}": now=${now.toISOString()}, end=${endDateTime?.toISOString()}, status=${timeStatus}`);
      }

      // Get attempt tracking info for this student
      const attemptsUsed = await QuizResult.countDocuments({
        userId: req.user.id,
        quizId: quiz._id
      });

      const canAttempt = attemptsUsed < (quiz.maxAttempts || 1);

      return {
        ...quizObj,
        timeStatus,
        isCurrentlyActive,
        maxAttempts: quiz.maxAttempts || 1,
        attemptsUsed,
        canAttempt,
        attemptsRemaining: Math.max(0, (quiz.maxAttempts || 1) - attemptsUsed)
      };
    }));

    res.json({
      success: true,
      quizzes: processedQuizzes,
      studentInfo: {
        year: student.year,
        semester: student.semester
      }
    });

  } catch (error) {
    console.error('❌ Error fetching shared quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shared quizzes',
      error: error.message
    });
  }
};

// ✅ CORRECTED VERSION - Replace your submitQuizAnswers function with this

export const submitQuizAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeTaken, abandonedQuiz } = req.body;  // ✅ Add abandonedQuiz here
    const userId = req.user.id;

    console.log('📝 Student submitting quiz:', id, 'User:', userId);
    const quiz = await TeacherQuiz.findById(id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // ✅ STEP 1: Check for duplicate submission FIRST (prevent double-click)
    const recentSubmission = await QuizResult.findOne({
      userId,
      quizId: id,
      submittedAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (recentSubmission) {
      console.log('⚠️ Duplicate submission detected, returning existing result');
      return res.json({
        success: true,
        message: 'Quiz already submitted',
        result: {
          userId,
          quizId: id,
          score: recentSubmission.score,
          correctAnswers: recentSubmission.correctAnswers,
          totalQuestions: recentSubmission.totalQuestions,
          timeTaken: recentSubmission.timeTaken,
          answers: recentSubmission.answers,
          submittedAt: recentSubmission.submittedAt
        }
      });
    }

    // ✅ STEP 2: Count existing attempts
    const existingAttempts = await QuizResult.countDocuments({
      userId,
      quizId: id
    });

    console.log(`📊 Attempt check: ${existingAttempts} of ${quiz.maxAttempts} attempts used`);
    
    // 🔍 DEBUG: Show all submissions
    const allSubmissions = await QuizResult.find({
      userId,
      quizId: id
    }).select('submittedAt score abandoned').sort({ submittedAt: -1 });
    
    console.log('📋 DEBUG - All submissions for this quiz:', JSON.stringify(allSubmissions, null, 2));

    // ✅ STEP 3: Check if student has exceeded attempt limit
    if (existingAttempts >= quiz.maxAttempts) {
      return res.status(403).json({
        success: false,
        message: `You have already used all ${quiz.maxAttempts} attempt(s) for this quiz.`,
        attemptsUsed: existingAttempts,
        maxAttempts: quiz.maxAttempts
      });
    }

    // ✅ STEP 4: Handle abandoned quiz (student left without submitting)
    if (abandonedQuiz) {
      console.log('⚠️ Recording abandoned quiz as attempt');
      
      const quizResult = await QuizResult.create({
        userId,
        quizId: id,
        score: 0,
        correctAnswers: 0,
        totalQuestions: quiz.questions.length,
        timeTaken,
        answers: [],
        submittedAt: new Date(),
        abandoned: true
      });

      console.log('✅ Abandoned quiz recorded:', quizResult._id);

      // Create notification for student
      try {
        await Notification.create({
          recipientId: userId,
          recipientRole: 'student',
          type: 'quiz_abandoned',
          title: quiz.title,
          description: `Quiz was not completed. This counts as 1 attempt. Score: 0/100`,
          quizId: id,
          score: '0/100',
          status: 'abandoned',
          isRead: false,
          metadata: {
            submissionId: quizResult._id.toString(),
            attemptNumber: existingAttempts + 1,
            maxAttempts: quiz.maxAttempts
          }
        });
        console.log('✅ Abandonment notification created');
      } catch (notifError) {
        console.error('❌ Error creating abandonment notification:', notifError);
      }

      return res.json({
        success: true,
        message: 'Quiz attempt recorded',
        result: {
          userId,
          quizId: id,
          score: 0,
          correctAnswers: 0,
          totalQuestions: quiz.questions.length,
          timeTaken,
          answers: [],
          submittedAt: quizResult.submittedAt,
          attemptNumber: existingAttempts + 1,
          maxAttempts: quiz.maxAttempts,
          abandoned: true
        }
      });
    }

    // ✅ STEP 5: Check if quiz is currently active
    if (!quiz.isCurrentlyActive()) {
      const timeStatus = quiz.getTimeStatus();
      let message = 'This quiz is not currently available.';
      
      if (timeStatus === 'upcoming') {
        message = 'This quiz has not started yet. Please wait until the scheduled time.';
      } else if (timeStatus === 'expired') {
        message = 'This quiz has ended. The submission deadline has passed.';
      }
      
      return res.status(403).json({
        success: false,
        message,
        timeStatus
      });
    }

    // ✅ STEP 6: Calculate score (normal submission)
    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const correctAnswerIndex = question.options?.findIndex(opt => opt.isCorrect);
      const correctAnswer = correctAnswerIndex !== -1 ? correctAnswerIndex : null;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: index + 1,
        userAnswer: userAnswer !== undefined ? userAnswer : -1,
        correctAnswer: correctAnswer !== null ? correctAnswer : -1,
        isCorrect
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    console.log(`✅ Quiz graded: ${correctAnswers}/${quiz.questions.length} correct (${score}%)`);

    // ✅ STEP 7: Save submission to database
    const quizResult = await QuizResult.create({
      userId,
      quizId: id,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeTaken,
      answers: results,
      submittedAt: new Date()
    });

    console.log('✅ Quiz result saved to database:', quizResult._id);
    console.log(`📊 Student now has ${existingAttempts + 1}/${quiz.maxAttempts} attempts used`);

    // ✅ STEP 8: Create submission confirmation notification
try {
  const existingNotification = await Notification.findOne({
    recipientId: userId,
    quizId: id,
    type: 'quiz_graded',
    createdAt: { $gte: new Date(Date.now() - 5000) }
  });

  if (!existingNotification) {
    const attemptsRemaining = quiz.maxAttempts - (existingAttempts + 1);
    const attemptMessage = quiz.maxAttempts > 1 
      ? ` (Attempt ${existingAttempts + 1}/${quiz.maxAttempts}${attemptsRemaining > 0 ? `, ${attemptsRemaining} remaining` : ', no attempts remaining'})`
      : '';

    await Notification.create({
      recipientId: userId,
      recipientRole: 'student',
      type: 'quiz_graded',
      title: quiz.title,
      description: `Your submission has been received. You scored ${score}% (${correctAnswers}/${quiz.questions.length} correct)${attemptMessage}.`,
      quizId: id,
      score: `${score}/100`,
      status: 'graded',
      isRead: false,
      metadata: {
        submissionId: quizResult._id.toString(),
        attemptNumber: existingAttempts + 1,
        maxAttempts: quiz.maxAttempts
      }
    });
    console.log('✅ Submission notification created for student:', userId);
  } else {
    console.log('⚠️ Duplicate in-app notification detected, skipping creation');
  }
} catch (notifError) {
  console.error('❌ Error creating submission notification:', notifError);
}

console.log('═══════════════════════════════════════════════════');
console.log('🔍 DEBUGGING EMAIL NOTIFICATION SEND');
console.log('═══════════════════════════════════════════════════');
console.log('📧 User ID:', userId);
console.log('📧 Quiz ID:', id);
console.log('📧 Quiz Title:', quiz.title);
console.log('📧 Score:', score + '%');
console.log('📧 Correct:', correctAnswers + '/' + quiz.questions.length);
console.log('📧 Attempt:', (existingAttempts + 1) + '/' + quiz.maxAttempts);
console.log('═══════════════════════════════════════════════════');

try {
  const student = await Student.findById(userId);
  console.log('📧 Student lookup result:', student ? '✅ FOUND' : '❌ NOT FOUND');
  
  if (student) {
    console.log('📧 Student Email:', student.email || '❌ NO EMAIL');
    console.log('📧 Student Name:', student.name || 'Unknown');
  }
  
  if (student && student.email) {
    console.log('📧 Attempting to send submission email to:', student.email);
    
    const attemptsRemaining = quiz.maxAttempts - (existingAttempts + 1);
    const attemptMessage = quiz.maxAttempts > 1 
      ? `Attempt ${existingAttempts + 1}/${quiz.maxAttempts}${attemptsRemaining > 0 ? `, ${attemptsRemaining} remaining` : ', no attempts remaining'}`
      : '';
    
    const emailHtml = await sendQuizSubmissionEmail(
      student.email,
      student.name || 'Student',
      quiz.title,
      `${score}%`,
      `${correctAnswers}/${quiz.questions.length}`,
      attemptMessage
    );

    await sendEmailNotification(
      userId,
      student.email,
      `✅ Quiz Submitted: ${quiz.title}`,
      emailHtml
    );
    console.log('✅ Quiz submission email sent successfully to:', student.email);
  } else {
    console.log('⚠️ Student not found or email missing for userId:', userId);
  }
} catch (emailError) {
  console.error('❌ Error sending submission email:', emailError);
  console.error('❌ Full error details:', emailError.message);
}

// ✅ STEP 8b: Send email notification (ALWAYS send, separate from duplicate check)
try {
  const student = await Student.findById(userId);
  if (student && student.email) {
    console.log('📧 Attempting to send submission email to:', student.email);
    
    const attemptsRemaining = quiz.maxAttempts - (existingAttempts + 1);
    const attemptMessage = quiz.maxAttempts > 1 
      ? `Attempt ${existingAttempts + 1}/${quiz.maxAttempts}${attemptsRemaining > 0 ? `, ${attemptsRemaining} remaining` : ', no attempts remaining'}`
      : '';
    
    const emailHtml = await sendQuizSubmissionEmail(
      student.email,
      student.name || 'Student',
      quiz.title,
      `${score}%`,
      `${correctAnswers}/${quiz.questions.length}`,
      attemptMessage
    );

    await sendEmailNotification(
      userId,
      student.email,
      `✅ Quiz Submitted: ${quiz.title}`,
      emailHtml
    );
    console.log('✅ Quiz submission email sent successfully to:', student.email);
  } else {
    console.log('⚠️ Student not found or email missing for userId:', userId);
  }
} catch (emailError) {
  console.error('❌ Error sending submission email:', emailError);
  console.error('❌ Full error details:', emailError.message);
}

    // ✅ STEP 9: Check majority completion
    try {
      const totalStudents = await Student.countDocuments({});
      const completedCount = await QuizResult.countDocuments({ quizId: id });
      const completionPercentage = Math.round((completedCount / totalStudents) * 100);
      const majorityThreshold = 50;

      console.log(`📊 Quiz completion: ${completedCount}/${totalStudents} students (${completionPercentage}%)`);

      if (completionPercentage >= majorityThreshold && completionPercentage - Math.round(((completedCount - 1) / totalStudents) * 100) > 0) {
        const teacher = await Teacher.findById(quiz.teacherId);
        
        if (teacher && teacher.email) {
          try {
            const emailHtml = await sendMajorityCompletionEmail(
              teacher.email,
              teacher.name || 'Teacher',
              quiz.title,
              completedCount,
              totalStudents,
              completionPercentage
            );

            await sendEmailNotification(
              quiz.teacherId,
              teacher.email,
              `📊 Quiz Status: ${quiz.title} - ${completionPercentage}% Complete`,
              emailHtml
            );

            await Notification.create({
              recipientId: quiz.teacherId,
              recipientRole: 'teacher',
              type: 'quiz_majority_complete',
              title: `Majority Completion: ${quiz.title}`,
              description: `${completedCount} out of ${totalStudents} students (${completionPercentage}%) have completed the quiz.`,
              quizId: id,
              status: 'completed',
              isRead: false
            });
          } catch (emailError) {
            console.error('❌ Error sending majority completion email:', emailError.message);
          }
        }
      }
    } catch (majorityError) {
      console.error('❌ Error checking majority completion:', majorityError);
    }

    // ✅ STEP 10: Return success response
    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        userId,
        quizId: id,
        score,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        timeTaken,
        answers: results,
        submittedAt: quizResult.submittedAt,
        attemptNumber: existingAttempts + 1,
        maxAttempts: quiz.maxAttempts,
        attemptsRemaining: Math.max(0, quiz.maxAttempts - (existingAttempts + 1))
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
};

// Get quiz submission results for a student
export const getQuizSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('📊 Fetching quiz submission:', id, 'for user:', userId);

    // Find the quiz submission
    const submission = await QuizResult.findOne({
      quizId: id,
      userId: userId
    }).sort({ submittedAt: -1 }); // Get the most recent submission

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'No submission found for this quiz'
      });
    }

    // Also get the quiz details
    const quiz = await TeacherQuiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    console.log('✅ Found submission:', submission._id);

    res.json({
      success: true,
      submission: {
        userId: submission.userId,
        quizId: submission.quizId,
        score: submission.score,
        correctAnswers: submission.correctAnswers,
        totalQuestions: submission.totalQuestions,
        timeTaken: submission.timeTaken,
        answers: submission.answers,
        submittedAt: submission.submittedAt
      },
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        questions: quiz.questions
      }
    });
  } catch (error) {
    console.error('Error fetching quiz submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz submission',
      error: error.message
    });
  }
};

export default {
  createQuiz,
  getTeacherQuizzes,
  getDrafts,
  getScheduledQuizzes,
  getQuizById,
  updateQuiz,
  scheduleQuiz,
  deleteQuiz,
  permanentDeleteQuiz,
  getQuizStats,
  getSharedQuizzes,
  submitQuizAnswers,
  getQuizSubmission
};