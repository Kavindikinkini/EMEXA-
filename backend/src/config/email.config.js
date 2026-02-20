import nodemailer from 'nodemailer';
import * as brevo from '@getbrevo/brevo';

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

// Get transporter for sending emails
const getTransporter = () => {
  console.log('🔧 Creating email transporter...');
  
  const emailMode = process.env.EMAIL_MODE || 'mailtrap';
  
  if (emailMode === 'mailtrap') {
    // TESTING MODE - Use Mailtrap
    console.log('📧 TESTING MODE: Using Mailtrap');
    console.log('   Host:', process.env.MAILTRAP_HOST);
    console.log('   User:', process.env.MAILTRAP_USER ? '✅ Present' : '❌ Missing');
    
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
      port: process.env.MAILTRAP_PORT || 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
  }
  
  // For Brevo, we'll use their API directly, not nodemailer
  return null;
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
    console.log('✅ Email sent via Brevo:', result);
    return true;
  } catch (error) {
    console.error('❌ Brevo API Error:', error);
    throw error;
  }
};

// Send email via Nodemailer (Mailtrap)
const sendViaNodemailer = async (transporter, mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via Mailtrap to:', mailOptions.to);
    console.log('📬 Check your Mailtrap inbox at: https://mailtrap.io/inboxes');
    return true;
  } catch (error) {
    console.error('❌ Nodemailer Error:', error);
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
    const transporter = getTransporter();
    return await sendViaNodemailer(transporter, mailOptions);
  }
};

// Send reset code email
export const sendResetCodeEmail = async (userEmail, userName, resetCode) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?email=${encodeURIComponent(userEmail)}&code=${resetCode}`;
  
  const mailOptions = {
    to: userEmail,
    subject: 'Password Reset Code - EMEXA',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .reset-code { background-color: #fff; border: 2px dashed #2196F3; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #2196F3; }
          .reset-button { 
            display: inline-block; 
            background-color: #0f6848; 
            color: white !important; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            margin: 20px 0;
            text-align: center;
          }
          .reset-button:hover { background-color: #0d5a3c; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .divider { text-align: center; margin: 20px 0; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>You requested to reset your password. Click the button below to reset your password automatically:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="reset-button">
                🔓 Reset Password Now
              </a>
            </div>
            
            <div class="divider">
              <p>── OR ──</p>
            </div>
            
            <p>Manually enter this code on the password reset page:</p>
            
            <div class="reset-code">
              ${resetCode}
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>⏰ This code will expire in <strong>15 minutes</strong></li>
              <li>🔒 Do not share this code with anyone</li>
              <li>💡 You can either click the button above or enter the code manually</li>
            </ul>
            
            <div class="alert">
              <strong>⚠️ Security Notice:</strong> If you did not request this password reset, please ignore this email or contact support immediately
            </div>
            
            <p>Best regards,<br><strong>EMEXA Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>If the button doesn't work, copy and paste this link: <br><a href="${resetLink}">${resetLink}</a></p>
            <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendEmail(mailOptions);
};

export const sendPasswordChangeEmail = async (userEmail, userName) => {
  const mailOptions = {
    to: userEmail,
    subject: 'Password Changed Successfully - EMEXA',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Password Changed Successfully</h2>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your password has been successfully changed.</p>
            <p><strong>Change Details:</strong></p>
            <ul>
              <li>📅 Date & Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}</li>
              <li>📧 Email: ${userEmail}</li>
            </ul>
            <div class="alert">
              <strong>⚠️ Important:</strong> If you did not make this change, please contact our support team immediately
            </div>
            <p>For your security, we recommend:</p>
            <ul>
              <li>✅ Using a strong, unique password</li>
              <li>✅ Not sharing your password with anyone</li>
              <li>✅ Logging out from devices you don't recognize</li>
            </ul>
            <p>Best regards,<br><strong>EMEXA Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendEmail(mailOptions);
};

export const sendPasswordResetEmail = async (userEmail, userName) => {
  const mailOptions = {
    to: userEmail,
    subject: 'Password Reset Successfully - EMEXA',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔓 Password Reset Successfully</h2>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your password has been successfully reset.</p>
            <p><strong>Reset Details:</strong></p>
            <ul>
              <li>📅 Date & Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}</li>
              <li>📧 Email: ${userEmail}</li>
            </ul>
            <div class="alert">
              <strong>⚠️ Important:</strong> If you did not request this password reset, please contact our support team immediately
            </div>
            <p>You can now log in with your new password.</p>
            <p>Best regards,<br><strong>EMEXA Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} EMEXA. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendEmail(mailOptions);
};