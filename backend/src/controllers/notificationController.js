import Notification from '../models/notification.js';
import Student from '../models/student.js';
import User from '../models/user.js';
import Teacher from '../models/teacher.js';
import { 
  sendEmailNotification, 
  sendQuizAssignmentEmail 
} from '../services/notificationEmail.service.js';

// Shared deduplication function to ensure consistency
// Returns both unique notifications and IDs of duplicates that should be marked as read
const deduplicateNotifications = (notifications) => {
  const uniqueNotifications = [];
  const duplicateIds = [];
  const seenQuizAssignments = new Map(); // Map to track first occurrence
  const seenQuizSubmissions = new Map();
  
  for (const notification of notifications) {
    // Deduplicate quiz_assigned notifications (same quiz assignment)
    if (notification.type === 'quiz_assigned' && notification.quizId && notification.status !== 'graded') {
      const quizIdStr = notification.quizId.toString();
      if (!seenQuizAssignments.has(quizIdStr)) {
        seenQuizAssignments.set(quizIdStr, notification._id);
        uniqueNotifications.push(notification);
      } else {
        // This is a duplicate, track it
        if (!notification.isRead) {
          duplicateIds.push(notification._id);
        }
      }
    }
    // Deduplicate quiz_graded notifications (same quiz submission with same score)
    else if ((notification.type === 'quiz_graded' || (notification.type === 'quiz_assigned' && notification.status === 'graded')) && notification.quizId) {
      const key = `${notification.quizId.toString()}_${notification.score || 'no-score'}`;
      if (!seenQuizSubmissions.has(key)) {
        seenQuizSubmissions.set(key, notification._id);
        uniqueNotifications.push(notification);
      } else {
        // This is a duplicate, track it
        if (!notification.isRead) {
          duplicateIds.push(notification._id);
        }
      }
    }
    // For other notifications, keep all
    else {
      uniqueNotifications.push(notification);
    }
  }
  
  return { uniqueNotifications, duplicateIds };
};

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query; // 'all', 'unread'

    // First check user's notification preferences
    let user = await User.findById(userId).select('notificationSettings');
    if (!user) user = await Student.findById(userId).select('notificationSettings');
    if (!user) user = await Teacher.findById(userId).select('notificationSettings');

    const inAppNotificationsEnabled = user?.notificationSettings?.inAppNotifications ?? true;

    // If in-app notifications are disabled, return empty array
    if (!inAppNotificationsEnabled) {
      console.log('🔕 In-app notifications disabled for user:', userId);
      return res.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        message: 'In-app notifications are disabled'
      });
    }

    let query = { recipientId: userId };
    
    if (filter === 'unread') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Apply deduplication and get duplicate IDs
    const { uniqueNotifications, duplicateIds } = deduplicateNotifications(notifications);

    // Mark duplicate notifications as read in the database to maintain consistency
    if (duplicateIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: duplicateIds } },
        { $set: { isRead: true } }
      );
      console.log(`✅ Marked ${duplicateIds.length} duplicate notifications as read`);
    }

    // Count unread from the deduplicated list
    const unreadCount = uniqueNotifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      notifications: uniqueNotifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
};

// Create notification when quiz is shared (called from quiz controller)
export const createQuizNotification = async (quizId, quizData, teacherName) => {
  try {
    console.log('🔔 Creating quiz notifications...');
    console.log('Quiz ID:', quizId);
    console.log('Quiz Data:', quizData);
    console.log('Teacher Name:', teacherName);

    // Check if notifications already exist for this quiz
    const existingNotifications = await Notification.countDocuments({ 
      quizId: quizId,
      type: 'quiz_assigned'
    });
    
    if (existingNotifications > 0) {
      console.log(`⚠️ Notifications already exist for quiz ${quizId}. Skipping duplicate notifications.`);
      return { success: true, count: existingNotifications, skipped: true };
    }

    // Build filter for students based on semester and academic year
    const studentFilter = {};
    if (quizData.semester) {
      studentFilter.semester = quizData.semester;
    }
    if (quizData.academicYear) {
      // Convert numeric year to string format (1 -> '1st year', 2 -> '2nd year', etc.)
      const yearStrings = {
        1: '1st year',
        2: '2nd year',
        3: '3rd year',
        4: '4th year'
      };
      const yearString = yearStrings[parseInt(quizData.academicYear)];
      if (yearString) {
        studentFilter.year = yearString;
      }
    }
    
    // Get all students matching the filter (or all students if no filter)
    const students = await Student.find(studentFilter, { _id: 1, email: 1, name: 1, notificationSettings: 1 });
    console.log(`📧 Found ${students.length} students to notify (filter: semester=${quizData.semester}, year=${quizData.academicYear})`);

    if (students.length === 0) {
      console.log(`⚠️ No students found for semester: ${quizData.semester}, year: ${quizData.academicYear}`);
      return { success: false, error: 'No students found matching the criteria' };
    }

    // Create notifications for filtered students
    // ✅ FIXED: Format dates and times nicely for notification
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hourNum = parseInt(hours);
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
  const period = hourNum >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minutes} ${period}`;
};

// Build clear description message
const scheduleDate = formatDate(quizData.scheduleDate);
const dueDate = formatDate(quizData.dueDate);
const startTime = formatTime12Hour(quizData.startTime);
const endTime = formatTime12Hour(quizData.endTime);

let descriptionMessage = `New quiz assigned by ${teacherName} covering ${quizData.subject || 'multiple topics'}.`;

if (scheduleDate && startTime) {
  descriptionMessage += `\n\n📅 Available from: ${scheduleDate} at ${startTime}`;
}

if (dueDate && endTime) {
  descriptionMessage += `\n⏰ Due: ${dueDate} at ${endTime}`;
} else if (scheduleDate && endTime) {
  descriptionMessage += `\n⏰ Ends: ${scheduleDate} at ${endTime}`;  
}

const notifications = students.map(student => ({
  recipientId: student._id,
  recipientRole: 'student',
  type: 'quiz_assigned',
  title: quizData.title,
  description: descriptionMessage,
  quizId: quizId,
  instructor: teacherName,
  dueDate: quizData.dueDate || quizData.scheduleDate || 'No deadline set',
  status: 'pending'
}));

    console.log('📝 Sample notification:', notifications[0]);

    const result = await Notification.insertMany(notifications);
    console.log(`✅ Successfully created ${result.length} notifications`);

    // Send email notifications to students who have email notifications enabled
    console.log('📧 Sending email notifications...');
    for (const student of students) {
      const emailNotificationsEnabled = student.notificationSettings?.emailNotifications ?? true;
      
      if (emailNotificationsEnabled && student.email) {
        try {
          const emailHtml = await sendQuizAssignmentEmail(
            student.email,
            student.name || 'Student',
            quizData.title,
            quizData.subject || 'General',
            teacherName
          );
          
          await sendEmailNotification(
            student._id,
            student.email,
            `📋 New Quiz Assigned: ${quizData.title}`,
            emailHtml
          );
        } catch (emailError) {
          console.error(`❌ Failed to send email to student ${student._id}:`, emailError.message);
          // Continue with other students even if one email fails
        }
      }
    }

    return { success: true, count: result.length };
  } catch (error) {
    console.error('❌ Error creating quiz notifications:', error);
    return { success: false, error: error.message };
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First check if in-app notifications are enabled
    let user = await User.findById(userId).select('notificationSettings');
    if (!user) user = await Student.findById(userId).select('notificationSettings');
    if (!user) user = await Teacher.findById(userId).select('notificationSettings');

    const inAppNotificationsEnabled = user?.notificationSettings?.inAppNotifications ?? true;

    // If in-app notifications are disabled, return 0
    if (!inAppNotificationsEnabled) {
      console.log('🔕 In-app notifications disabled for user:', userId);
      return res.json({
        success: true,
        count: 0,
        message: 'In-app notifications are disabled'
      });
    }
    
    // Fetch all unread notifications
    const notifications = await Notification.find({ 
      recipientId: userId, 
      isRead: false 
    }).lean();

    // Apply the same deduplication logic
    const { uniqueNotifications, duplicateIds } = deduplicateNotifications(notifications);

    // Mark duplicate notifications as read in the database to maintain consistency
    if (duplicateIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: duplicateIds } },
        { $set: { isRead: true } }
      );
      console.log(`✅ Marked ${duplicateIds.length} duplicate notifications as read in getUnreadCount`);
    }

    res.json({
      success: true,
      count: uniqueNotifications.length
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count' 
    });
  }
};

// Create data export notification for teacher
export const createDataExportNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { fileName } = req.body;

    // Only teachers can export data
    if (userRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can export data'
      });
    }

    const notification = await Notification.create({
      recipientId: userId,
      recipientRole: 'teacher',
      type: 'data_export',
      title: 'Data Export Complete',
      description: `Your personal data has been successfully exported as ${fileName}`,
      status: 'completed',
      isRead: false,
      metadata: {
        fileName,
        exportDate: new Date().toISOString()
      }
    });

    console.log('✅ Data export notification created:', notification._id);

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('❌ Error creating data export notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// Clean up duplicate quiz notifications
export const cleanupDuplicateNotifications = async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of duplicate quiz notifications...');
    
    // Find all quiz notifications grouped by recipientId and quizId
    const duplicates = await Notification.aggregate([
      {
        $match: {
          type: 'quiz_assigned',
          quizId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            recipientId: '$recipientId',
            quizId: '$quizId'
          },
          notifications: { $push: { _id: '$_id', createdAt: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    let deletedCount = 0;

    // For each group of duplicates, keep only the oldest notification
    for (const duplicate of duplicates) {
      const notifications = duplicate.notifications.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Remove all except the first (oldest) notification
      const idsToDelete = notifications.slice(1).map(n => n._id);
      
      if (idsToDelete.length > 0) {
        const result = await Notification.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount;
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} duplicate notifications.`);

    res.json({
      success: true,
      message: `Deleted ${deletedCount} duplicate notifications`,
      deletedCount
    });
  } catch (error) {
    console.error('❌ Error cleaning up duplicate notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup duplicate notifications',
      error: error.message
    });
  }
};

// Get notification settings for the current user
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let user = await User.findById(userId).select('notificationSettings');
    if (!user) user = await Student.findById(userId).select('notificationSettings');
    if (!user) user = await Teacher.findById(userId).select('notificationSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const settings = user.notificationSettings || {
      emailNotifications: true,
      smsNotifications: false,
      inAppNotifications: true
    };

    res.json({
      success: true,
      notificationSettings: settings
    });
  } catch (error) {
    console.error('❌ Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings'
    });
  }
};

// Test notification endpoint to verify settings are working
export const testNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body; // 'email', 'inapp', or 'both'

    let user = await User.findById(userId).select('name email notificationSettings');
    if (!user) user = await Student.findById(userId).select('name email notificationSettings');
    if (!user) user = await Teacher.findById(userId).select('name email notificationSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const results = {
      success: true,
      tests: {
        emailNotificationsEnabled: user.notificationSettings?.emailNotifications ?? true,
        inAppNotificationsEnabled: user.notificationSettings?.inAppNotifications ?? true,
        testType: type || 'all'
      }
    };

    // Create a test in-app notification
    if (type === 'inapp' || type === 'both') {
      if (results.tests.inAppNotificationsEnabled) {
        const testNotification = await Notification.create({
          recipientId: userId,
          recipientRole: user.role || 'student',
          type: 'announcement',
          title: '🧪 Test In-App Notification',
          description: 'This is a test in-app notification to verify your settings are working correctly.',
          status: 'completed',
          isRead: false,
          metadata: {
            isTest: true,
            testTime: new Date().toISOString()
          }
        });
        results.tests.inAppNotificationCreated = true;
        results.tests.inAppNotificationId = testNotification._id;
      } else {
        results.tests.inAppNotificationCreated = false;
        results.tests.inAppNotificationMessage = 'In-app notifications are disabled for this user';
      }
    }

    // Send a test email if email notifications are enabled
    if (type === 'email' || type === 'both') {
      if (results.tests.emailNotificationsEnabled && user.email) {
        try {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                .content { background-color: #f9f9f9; padding: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>🧪 Test Email Notification</h2>
                </div>
                <div class="content">
                  <p>Hi <strong>${user.name || 'User'}</strong>,</p>
                  <p>This is a test email to verify that your email notification settings are working correctly in EMEXA.</p>
                  <p>If you received this email, your notification settings are properly configured!</p>
                  <p>You can change your notification preferences in your profile settings.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmailNotification(
            userId,
            user.email,
            '🧪 Test Email from EMEXA',
            emailHtml
          );
          results.tests.emailSent = true;
        } catch (emailError) {
          results.tests.emailSent = false;
          results.tests.emailError = emailError.message;
        }
      } else {
        results.tests.emailSent = false;
        results.tests.emailMessage = 'Email notifications are disabled for this user';
      }
    }

    res.json(results);
  } catch (error) {
    console.error('❌ Error in test notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test notifications',
      error: error.message
    });
  }
};
