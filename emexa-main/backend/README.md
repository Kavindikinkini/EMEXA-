# Emexa Backend

Express.js backend for the Emexa emotion-aware educational platform. Handles authentication, quiz management, student analytics, email notifications, and real-time features.

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn
- MongoDB instance

### Installation

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file in the backend directory with the following variables:

```
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/emexa

# JWT Secret for token signing
JWT_SECRET=your_secure_secret_key_here

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=notifications@emexa.com

# AI/ML Service (Hugging Face)
HUGGINGFACE_API_KEY=your_huggingface_key

# Server Configuration
PORT=5000
NODE_ENV=development
ALLOW_DEV_AUTH_BYPASS=true
```

### Running

**Development (with auto-restart):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://127.0.0.1:5000`

## 📁 Directory Structure

```
backend/
├── src/
│   ├── app.js                    # Express app setup
│   ├── server.js                 # Server entry point & Socket.io
│   ├── config/
│   │   ├── cloudinary.js         # Cloudinary configuration
│   │   ├── db.js                 # MongoDB connection
│   │   ├── email.config.js       # Email service setup
│   │   ├── env.js                # Environment variables
│   │   └── constants.js          # App constants
│   ├── controllers/              # Business logic
│   │   ├── authController.js
│   │   ├── quizcontroller.js
│   │   ├── teacherQuizController.js
│   │   ├── userController.js
│   │   ├── feedbackController.js
│   │   ├── notificationController.js
│   │   └── ...
│   ├── models/                   # Mongoose schemas
│   │   ├── quiz.js
│   │   ├── user.js
│   │   ├── notification.js
│   │   ├── emotionLog.js
│   │   └── ...
│   ├── routes/                   # API routes
│   │   ├── authRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── userRoutes.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── auth.middleware.js    # Alternative auth
│   │   └── error.middleware.js   # Error handling
│   ├── services/                 # Business services
│   │   ├── emailService.js       # Email sending
│   │   └── notificationService.js
│   ├── utils/                    # Utility functions
│   └── validators/               # Input validation
├── scripts/
│   ├── createAdmin.js            # Create admin user
│   └── fixRoles.js               # Fix user roles
├── jobs/
│   └── quizCleanup.js            # Background jobs
├── config/
│   └── database/
│       └── teacher_dashboard_schema.sql
├── uploads/
│   └── profiles/                 # User profile images
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login and get JWT
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh           - Refresh JWT token
```

### Users
```
GET    /api/users                  - List all users
GET    /api/users/:id              - Get user details
POST   /api/users                  - Create user
PUT    /api/users/:id              - Update user
DELETE /api/users/:id              - Delete user
POST   /api/users/:id/upload-avatar - Upload profile image
```

### Quizzes
```
GET    /api/quizzes                - List all quizzes
GET    /api/quizzes/:id            - Get quiz details
POST   /api/quizzes                - Create quiz
PUT    /api/quizzes/:id            - Update quiz
DELETE /api/quizzes/:id            - Delete quiz
POST   /api/quizzes/:id/share      - Share quiz with students
POST   /api/quizzes/:id/schedule   - Schedule quiz
```

### Teacher Dashboard
```
GET    /api/teacher/dashboard      - Dashboard stats
GET    /api/teacher/quizzes        - Teacher's quizzes
GET    /api/teacher/students       - Teacher's students
GET    /api/teacher/analytics      - Analytics data
```

### Student Responses
```
POST   /api/responses              - Submit quiz response
GET    /api/responses              - Get user responses
GET    /api/quizzes/:id/responses  - Get quiz responses
```

### Notifications
```
GET    /api/notifications          - Get user notifications
POST   /api/notifications/:id/read - Mark as read
DELETE /api/notifications/:id      - Delete notification
GET    /api/notifications/unread   - Get unread count
```

### Emotions & Analytics
```
GET    /api/emotions               - Get emotion logs
POST   /api/emotions               - Log emotion
GET    /api/analytics/student/:id  - Student analytics
GET    /api/analytics/quiz/:id     - Quiz analytics
GET    /api/analytics/teacher      - Teacher analytics
```

### Feedback & Help
```
GET    /api/help-articles          - Get help articles
POST   /api/feedback               - Submit feedback
POST   /api/hints                  - Get quiz hints
```

## 📊 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (teacher/student/admin),
  profileImage: String (Cloudinary URL),
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz
```javascript
{
  title: String,
  description: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    hints: String
  }],
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  scheduledDate: Date,
  scheduledTime: String,
  status: String (draft/published/scheduled),
  sharedWith: [ObjectId] (ref: User)
}
```

### Notification
```javascript
{
  user: ObjectId (ref: User),
  type: String (quiz_shared/quiz_scheduled/reminder),
  title: String,
  message: String,
  read: Boolean,
  email_sent: Boolean,
  createdAt: Date
}
```

### EmotionLog
```javascript
{
  user: ObjectId (ref: User),
  quiz: ObjectId (ref: Quiz),
  emotion: String (happy/sad/neutral/etc),
  confidence: Number (0-1),
  timestamp: Date
}
```

## 📧 Email Service

**Email Service**: Brevo API
**Fallback**: Mailtrap (for testing)

### Email Templates

1. **Quiz Assignment** - When teacher shares quiz
2. **Quiz Scheduled** - When quiz is scheduled
3. **Quiz Reminder** - Before quiz deadline
4. **Performance Report** - Student quiz results

Emails are triggered via:
```javascript
// In controllers
const notification = await Notification.create({
  user: studentId,
  type: 'quiz_shared',
  title: 'New Quiz Available',
  message: `Quiz "${quiz.title}" has been shared with you`
});

// Email automatically sent in notificationService
```

## 🔐 Authentication

- **JWT Tokens**: Stateless authentication using JWT
- **Token Storage**: Stored in Authorization header
- **Protection Middleware**: `auth.js` verifies token validity
- **Development Bypass**: Dev mode skips auth when enabled

**Protected Routes Example:**
```javascript
// Requires valid JWT
router.get('/api/user/profile', protectRoute, getUserProfile);

// Public routes
router.post('/api/auth/login', loginUser);
```

## 🔄 Real-Time Features (Socket.io)

Connected via `server.js`:

```javascript
// Quiz updates in real-time
socket.on('quiz-update', (data) => {
  io.emit('quiz-updated', data);
});

// Notifications in real-time
socket.on('new-notification', (notification) => {
  io.to(userId).emit('notification-received', notification);
});
```

## 📤 File Uploads

**Service**: Cloudinary
**File Types**: Images (.jpg, .png, .gif)
**Max Size**: 5MB

Usage:
```javascript
const imageUrl = await uploadToCloudinary(file);
user.profileImage = imageUrl;
await user.save();
```

## 🧪 Testing

Run test files to verify functionality:

```bash
# Test email notifications
node test_backend_requests.js
node test-notification-system.js

# Test specific features
node test-email-uniqueness.js
node test-feedback-api.js
node test-quiz-stats.js
node test-hf-api.js
```

## 🚢 Deployment

### Vercel Deployment

Configuration in `vercel.json`:
```json
{
  "version": 2,
  "builds": [{
    "src": "server.js",
    "use": "@vercel/node"
  }],
  "routes": [{
    "src": "/(.*)",
    "dest": "server.js"
  }]
}
```

Deploy:
```bash
vercel --prod
```

### Environment Variables for Production
- Set all variables in deployment platform
- Ensure MongoDB URI points to production cluster
- Use production API keys (Brevo, Cloudinary, Hugging Face)

## 🐛 Debugging

### Enable Debug Logs
```bash
DEBUG=* npm run dev
```

### Common Issues

**MongoDB Connection Error**
- Verify connection string is correct
- Check network access settings

**Email Not Sending**
- Verify API key is valid
- Check sender email configuration
- Review email templates

**Image Upload Failing**
- Verify credentials are correct
- Check file size limits
- Ensure folder exists

**Socket.io Connection Issues**
- Check CORS configuration
- Verify client socket connection URL
- Review firewall settings

## 📝 Code Standards

- Use async/await instead of callbacks
- Validate input with joi/validator
- Handle errors with try-catch
- Return consistent JSON responses
- Use meaningful variable names
- Add JSDoc comments for functions

## 🔗 Related Files

- Frontend: See `../frontend/README.md`
- Main Project: See `../README.md`

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit pull request

## 📄 License

Proprietary - All rights reserved

---

**Last Updated**: February 2026
