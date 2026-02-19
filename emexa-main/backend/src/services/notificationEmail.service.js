import nodemailer from 'nodemailer';
import * as brevo from '@getbrevo/brevo';
import User from '../models/user.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';

// Initialize Brevo API
let brevoApiInstance = null;

const initializeBrevo = () => {
  if (!brevoApiInstance && process.env.BREVO_API_KEY) {
    brevoApiInstance = new brevo.TransactionalEmailsApi();
    brevoApiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );
  }
  return brevoApiInstance;
};

// Get transporter for Mailtrap (fallback)
const getMailtrapTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.MAILTRAP_PORT || 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD
    }
  });
};

// Send email via Brevo API
const sendViaBrevo = async (mailOptions) => {
  try {
    const api = initializeBrevo();
    
    if (!api) {
      throw new Error('Brevo API not initialized. Check BREVO_API_KEY.');
    }

    const sendSmtpEmail = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || 'emexaed@gmail.com',
        name: process.env.BREVO_SENDER_NAME || 'EMEXA'
      },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html
    };

    const result = await api.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent via Brevo to:', mailOptions.to);
    return true;
  } catch (error) {
    console.error('❌ Brevo API Error:', error);
    throw error;
  }
};

// Send email via Nodemailer (Mailtrap fallback)
const sendViaMailtrap = async (mailOptions) => {
  try {
    const transporter = getMailtrapTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@emexa.com',
      ...mailOptions
    });
    console.log('✅ Email sent via Mailtrap to:', mailOptions.to);
    return true;
  } catch (error) {
    console.error('❌ Mailtrap Error:', error);
    throw error;
  }
};

// Main email sending function
const sendEmail = async (mailOptions) => {
  const emailMode = process.env.EMAIL_MODE || 'mailtrap';
  
  console.log(`📧 Sending email via ${emailMode.toUpperCase()}...`);
  
  if (emailMode === 'brevo') {
    return await sendViaBrevo(mailOptions);
  } else {
    return await sendViaMailtrap(mailOptions);
  }
};

/**
 * Send email notification if user has email notifications enabled
 * @param {string} userId - User ID
 * @param {string} userEmail - User email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML content
 * @returns {Promise<boolean>} - Returns true if email was sent, false if user has notifications disabled
 */
export const sendEmailNotification = async (userId, userEmail, subject, htmlContent) => {
  try {
    // Fetch user to check notification settings
    let user = await User.findById(userId);
    if (!user) user = await Student.findById(userId);
    if (!user) user = await Teacher.findById(userId);

    if (!user) {
      console.warn('⚠️ User not found for email notification:', userId);
      return false;
    }

    // Check if email notifications are enabled
const emailNotificationsEnabled = user.notificationSettings?.emailNotifications ?? 
                                 user.settings?.emailNotifications ?? 
                                 true; // Default to true if not specified

console.log(`📧 Email notification settings for user ${userId}:`, {
  notificationSettings: user.notificationSettings,
  settings: user.settings,
  emailNotificationsEnabled
});

if (!emailNotificationsEnabled) {
  console.log('🔕 Email notifications disabled for user:', userId);
  // TEMPORARY: Force send anyway for debugging
  console.log('⚠️ FORCING EMAIL SEND FOR DEBUGGING');
  // return false; // Commented out for debugging
}

    // Send email
    const mailOptions = {
      to: userEmail,
      subject: subject,
      html: htmlContent
    };

    await sendEmail(mailOptions);
    console.log('✅ Email notification sent to:', userEmail);
    return true;

  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return false;
  }
};

/**
 * Send quiz assignment notification email
 */
export const sendQuizAssignmentEmail = async (userEmail, userName, quizTitle, quizSubject, teacherName) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .quiz-info { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📋 New Quiz Assigned</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>A new quiz has been assigned to you by <strong>${teacherName}</strong>.</p>
          
          <div class="quiz-info">
            <p><strong>Quiz Title:</strong> ${quizTitle}</p>
            <p><strong>Subject:</strong> ${quizSubject}</p>
            <p><strong>Instructor:</strong> ${teacherName}</p>
          </div>
          
          <p>Please log in to EMEXA to view the quiz details and complete it before the deadline.</p>
          
          <p>Best regards,<br><strong>EMEXA Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

   /**
 * Send quiz submission notification email
 */
export const sendQuizSubmissionEmail = async (userEmail, userName, quizTitle, score, correctAnswers = '', attemptInfo = '') => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .score-box { background-color: #c8e6c9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; text-align: center; }
        .score-number { font-size: 48px; font-weight: bold; color: #2e7d32; margin: 15px 0; }
        .details { background-color: #e8f5e9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✅ Quiz Submitted Successfully</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your quiz submission has been successfully recorded!</p>
          
          <div class="score-box">
            <p style="font-size: 16px; margin-bottom: 10px;"><strong>Quiz Title:</strong> ${quizTitle}</p>
            <div class="score-number">${score}</div>
            <p style="font-size: 18px; margin-top: 5px;"><strong>Your Score</strong></p>
            ${correctAnswers ? `<p style="margin-top: 15px; font-size: 16px;">Correct Answers: <strong>${correctAnswers}</strong></p>` : ''}
          </div>
          
          ${attemptInfo ? `
          <div class="details">
            <p style="margin: 0; text-align: center; font-size: 15px;"><strong>📊 ${attemptInfo}</strong></p>
          </div>
          ` : ''}
          
          <p>You can view your detailed results and feedback by logging into EMEXA.</p>
          
          <p>Best regards,<br><strong>EMEXA Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};


/**
 * Send profile update confirmation email
 */
export const sendProfileUpdateEmail = async (userEmail, userName) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✏️ Profile Updated</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your profile has been successfully updated.</p>
          
          <div class="alert">
            <strong>📝 Changes Made:</strong>
            <p>Your profile information was modified on ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}</p>
          </div>
          
          <p>If you did not make this change, please contact our support team immediately.</p>
          
          <p>Best regards,<br><strong>EMEXA Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Send settings change confirmation email
 */
export const sendSettingsChangeEmail = async (userEmail, userName, changedSettings) => {
  const settingsList = Object.entries(changedSettings)
    .map(([key, value]) => `<li>${key}: ${value ? '✓ Enabled' : '✗ Disabled'}</li>`)
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .settings-list { background-color: #f3e5f5; border-left: 4px solid #9C27B0; padding: 15px; margin: 20px 0; }
        .settings-list ul { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚙️ Settings Updated</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your settings have been successfully updated.</p>
          
          <div class="settings-list">
            <p><strong>Changed Settings:</strong></p>
            <ul>
              ${settingsList}
            </ul>
          </div>
          
          <p>If you did not make these changes, please contact our support team immediately at emexaed@gmail.com</p>
          
          <p>Best regards,<br><strong>EMEXA Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Send quiz share confirmation email to teacher
 */
export const sendQuizShareConfirmationEmail = async (teacherEmail, teacherName, quizTitle, totalStudents, scheduleDate, startTime, endTime) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1976D2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .quiz-info { background-color: #e3f2fd; border-left: 4px solid #1976D2; padding: 15px; margin: 20px 0; }
        .info-row { margin: 10px 0; padding: 5px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✅ Quiz Shared Successfully</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${teacherName}</strong>,</p>
          <p>Your quiz has been successfully shared with students in EMEXA.</p>
          
          <div class="quiz-info">
            <div class="info-row"><strong>Quiz Title:</strong> ${quizTitle}</div>
            <div class="info-row"><strong>Students Notified:</strong> ${totalStudents}</div>
            <div class="info-row"><strong>Scheduled Date:</strong> ${scheduleDate}</div>
            <div class="info-row"><strong>Start Time:</strong> ${startTime}</div>
            <div class="info-row"><strong>End Time:</strong> ${endTime}</div>
          </div>
          
          <p>All students have been sent notifications about the new quiz. You can track their progress and submissions in your teacher dashboard.</p>
          
          <p>Best regards,<br><strong>EMEXA Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

/**
 * Send email to teacher when majority of students complete quiz
 */
export const sendMajorityCompletionEmail = async (teacherEmail, teacherName, quizTitle, completedStudents, totalStudents, completionPercentage) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .stats-box { background-color: #c8e6c9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
        .completion-percentage { font-size: 28px; font-weight: bold; color: #2e7d32; }
        .stat-row { margin: 10px 0; padding: 5px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📊 Majority of Students Completed Quiz</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${teacherName}</strong>,</p>
          <p>Great news! The majority of your students have now completed the quiz <strong>${quizTitle}</strong>.</p>
          
          <div class="stats-box">
            <div class="stat-row"><strong>Quiz Title:</strong> ${quizTitle}</div>
            <div class="stat-row"><strong>Students Completed:</strong> ${completedStudents} out of ${totalStudents}</div>
            <div class="completion-percentage">${completionPercentage}%</div>
            <div class="stat-row" style="text-align: center;"><strong>Completion Rate</strong></div>
          </div>
          
          <p>You can now review student submissions and provide feedback. Log in to your EMEXA dashboard to see detailed results and analytics.</p>
          
          <p>Best regards,<br><strong>EMEXA Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};
