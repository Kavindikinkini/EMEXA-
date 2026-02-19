# Developer Quick Start Guide - Email Notifications

## 🚀 What Changed?

The backend now automatically sends email notifications whenever:
- 📋 A quiz is assigned to students
- ✅ A student submits a quiz (confirmation with score)
- ✏️ A user updates their profile
- ⚙️ A user changes their settings

**BUT** respects user's email notification preference (ON/OFF toggle in Settings)

---

## 🎯 Quick Understanding

### Before (Old Way)
```
Event happens → Create in-app notification → Done
(Email only for password reset)
```

### After (New Way)
```
Event happens
    ↓
Check: Does user have email notifications enabled?
    ├─ YES → Send email + Create in-app notification
    └─ NO → Create in-app notification only
```

---

## 📂 Key Files to Know

### New Service File (Do Not Modify Unless Needed)
```
src/services/notificationEmail.service.js
├── sendEmailNotification() ← Main function (checks preference)
├── sendQuizAssignmentEmail() ← Template
├── sendQuizSubmissionEmail() ← Template
├── sendProfileUpdateEmail() ← Template
└── sendSettingsChangeEmail() ← Template
```

### Modified Controller Files (Where emails are sent)
```
src/controllers/
├── notificationController.js (Quiz assignments)
├── quizcontroller.js (Quiz submissions)
├── teacherQuizController.js (Quiz submissions)
├── userController.js (Profile & settings for students)
└── teacherController.js (Profile & settings for teachers)
```

---

## 🔍 How to Find Email Sending Code

### Pattern 1: Quiz Assignment
**File:** `notificationController.js`
**Function:** `createQuizNotification()`
**Look for:** `sendQuizAssignmentEmail` and `sendEmailNotification`

### Pattern 2: Quiz Submission
**Files:** 
- `quizcontroller.js` → `submitQuizAnswers()`
- `teacherQuizController.js` → `submitQuizAnswers()`

**Look for:** `sendQuizSubmissionEmail` and `sendEmailNotification`

### Pattern 3: Profile Update
**Files:**
- `userController.js` → `updateProfile()`
- `teacherController.js` → `updateProfile()`

**Look for:** `sendProfileUpdateEmail` and `sendEmailNotification`

### Pattern 4: Settings Change
**Files:**
- `userController.js` → `updateNotificationSettings()`
- `teacherController.js` → `updateSettings()`

**Look for:** `sendSettingsChangeEmail` and `sendEmailNotification`

---

## 📝 Code Pattern Used

All email sending follows this pattern:

```javascript
// 1. Create in-app notification (always)
try {
  await Notification.create({...});
}

// 2. Try to send email
try {
  // Check and send email
  const emailHtml = await sendQuizAssignmentEmail(...);
  await sendEmailNotification(userId, email, subject, emailHtml);
} catch (emailError) {
  // Don't crash if email fails
  console.error('Email error:', emailError.message);
}
```

---

## 🧪 How to Test Locally

### Option 1: Gmail Testing (Easiest)
1. Set up Gmail app password in `.env`
2. Emails will actually send to real mailbox
3. Check inbox for test emails

### Option 2: Mock Email (Development)
1. Comment out `await transporter.sendMail()`
2. Just log email content to console
3. Verify in logs without needing Gmail

### Option 3: Third-party Service
1. Use Mailtrap, SendGrid, or similar
2. Update Nodemailer config in `notificationEmail.service.js`
3. Check service dashboard for sent emails

---

## 🔐 How Preference Checking Works

```javascript
// This is the KEY function in notificationEmail.service.js
export const sendEmailNotification = async (userId, userEmail, subject, htmlContent) => {
  // Fetch user from database
  let user = await User.findById(userId);
  if (!user) user = await Student.findById(userId);
  if (!user) user = await Teacher.findById(userId);

  // CHECK THE MAGIC HERE ↓
  const emailNotificationsEnabled = user.notificationSettings?.emailNotifications ?? 
                                   user.settings?.emailNotifications ?? 
                                   true; // Default to true if not set

  // If enabled, send email
  if (!emailNotificationsEnabled) {
    console.log('🔕 Email notifications disabled for user:', userId);
    return false; // Skip email
  }

  // Otherwise send
  const transporter = getTransporter();
  await transporter.sendMail(mailOptions);
  return true;
}
```

---

## 🎨 Email Template Structure

All email templates follow this structure:

```javascript
export const sendQuizAssignmentEmail = async (userEmail, userName, ...) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Professional CSS */
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📋 Header Text</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Email body content...</p>
        </div>
        <div class="footer">
          <p>Automated message footer</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return htmlContent;
}
```

---

## 🛠️ How to Add a New Event Email

If you want to add email for a new event (e.g., "Student enrolled in class"):

### Step 1: Create Email Template
**File:** `src/services/notificationEmail.service.js`

```javascript
export const sendEnrollmentEmail = async (userEmail, userName, className) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        // ... copy CSS from other template
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✅ You're Enrolled</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>You have been enrolled in <strong>${className}</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 EMEXA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return htmlContent;
};
```

### Step 2: Use in Your Controller
**File:** wherever the enrollment happens

```javascript
import { sendEmailNotification, sendEnrollmentEmail } from '../services/notificationEmail.service.js';

// In your enrollment function:
try {
  // 1. Save enrollment to database
  await Enrollment.create({...});
  
  // 2. Send email
  const emailHtml = await sendEnrollmentEmail(
    student.email,
    student.name,
    className
  );
  
  await sendEmailNotification(
    student._id,
    student.email,
    `✅ Enrolled in ${className}`,
    emailHtml
  );
} catch (error) {
  console.error('Error:', error);
}
```

### That's it! ✅
- Automatically checks user preference
- Sends email only if enabled
- Logs all activity
- Handles errors gracefully

---

## 🚨 Common Issues & Solutions

### Issue: Emails Not Sending
**Check:**
1. Is `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`?
2. Did you enable 2FA on Gmail and create app password?
3. Is the user's email field populated in database?
4. Are email notifications turned ON in user settings?

**Debug:**
- Check backend console for error logs
- Look for "🔕 Email notifications disabled" message
- Check user record: `db.users.findOne({_id: userId}).notificationSettings`

### Issue: Wrong Email Template
**Check:**
1. Verify template function is exported correctly
2. Verify import statement in controller
3. Verify function call includes all required parameters
4. Check template HTML syntax

### Issue: Email Not Respecting Preference
**Check:**
1. User preference is stored correctly in DB
2. `sendEmailNotification()` is being called (not sending directly)
3. Preference path matches model structure:
   - User/Student: `notificationSettings.emailNotifications`
   - Teacher: `settings.emailNotifications`

---

## 📊 Database Fields to Know

### User Model
```javascript
notificationSettings: {
  emailNotifications: Boolean (default: true),
  smsNotifications: Boolean (default: false),
  inAppNotifications: Boolean (default: true)
}
```

### Teacher Model
```javascript
settings: {
  emailNotifications: Boolean (default: true),
  smsNotifications: Boolean (default: false),
  inAppNotifications: Boolean (default: true),
  emotionConsent: Boolean (default: true)
}
```

---

## 🎓 Learning Resources

**To understand the code:**
1. Read `IMPLEMENTATION_SUMMARY.md` - High-level overview
2. Read `DETAILED_CODE_CHANGES.md` - Line-by-line changes
3. Read `EMAIL_NOTIFICATION_IMPLEMENTATION.md` - Technical details
4. Review `notificationEmail.service.js` - Implementation code

**To modify the code:**
1. Find the event where you want to add email
2. Import the service: `import { sendEmailNotification } from '...service.js'`
3. Add email sending try-catch block
4. Test with email notifications ON and OFF

---

## ✅ Verification Checklist

Before deploying:
- [ ] Emails send when notification is ON
- [ ] Emails don't send when notification is OFF
- [ ] In-app notifications always created
- [ ] Email templates look good (check CSS)
- [ ] No errors in backend console
- [ ] No errors in frontend console
- [ ] Database preference is being read correctly
- [ ] All 4 types of emails working (quiz, submission, profile, settings)

---

## 📞 Quick Reference

**Main Service Function:**
```javascript
import { sendEmailNotification } from '../services/notificationEmail.service.js';

// Use in your controller:
await sendEmailNotification(userId, email, subject, htmlContent);
```

**Available Email Templates:**
```javascript
import {
  sendQuizAssignmentEmail,
  sendQuizSubmissionEmail,
  sendProfileUpdateEmail,
  sendSettingsChangeEmail
} from '../services/notificationEmail.service.js';
```

**Key Files Modified:**
- notificationController.js
- quizcontroller.js
- teacherQuizController.js
- userController.js
- teacherController.js

---

**Created:** January 19, 2026
**Status:** Production Ready ✅
**Tested:** Yes ✅
