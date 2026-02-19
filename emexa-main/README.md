# Emexa - Emotion-Aware Educational Platform

Emexa is a comprehensive educational platform that combines emotion recognition, interactive quizzes, real-time teacher dashboards, and email notifications to create an engaging learning experience for students while providing educators with powerful analytics tools.

## 🎯 Features

### For Students
- **Emotion-Aware Quizzes**: Real-time emotion detection using facial recognition during quiz sessions
- **Interactive Quiz Experience**: Engaging quiz format with immediate feedback and hints
- **Wellness Tracking**: Daily mood check-ins and emotional wellness insights
- **Help & Support**: In-app help system with searchable articles
- **Real-Time Notifications**: Instant in-app notifications for quiz updates and teacher messages

### For Teachers
- **Quiz Management**: Create, schedule, edit, and share quizzes with students
- **Teacher Dashboard**: Comprehensive analytics with student performance metrics
- **Real-Time Notifications**: Email notifications when students are assigned quizzes
- **Student Analytics**: Track student performance, emotions, and engagement
- **Draft Management**: Save and manage quiz drafts before publishing
- **Performance Reports**: Detailed student performance reports with emotion metrics

## 📋 Tech Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary (images), Multer (file uploads)
- **Email Service**: Brevo API
- **AI/ML**: Hugging Face Inference API for emotion detection
- **Real-Time**: Socket.io for live notifications

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **UI Icons**: Lucide React, Font Awesome
- **State Management**: React hooks + localStorage
- **HTTP Client**: Axios
- **PDF Export**: jsPDF

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB instance (local or cloud)

### Installation

#### 1. Clone and Install Backend
```bash
cd backend
npm install
```

#### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Configuration

Create a `.env` file in the backend directory with the following variables:

```
# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email

# Hugging Face AI
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Server
PORT=5000
NODE_ENV=development
ALLOW_DEV_AUTH_BYPASS=true

# Frontend
VITE_API_BASE=http://127.0.0.1:5000
```

Create a `.env` file in the frontend directory:

```
VITE_API_BASE=http://127.0.0.1:5000
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Backend runs on: `http://127.0.0.1:5000`
Frontend runs on: `http://localhost:5173`

#### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 🏗️ Application Architecture

### Project Structure

```
emexa/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app setup
│   │   ├── server.js              # Server entry point
│   │   ├── config/                # Configuration files
│   │   ├── controllers/           # Business logic controllers
│   │   ├── models/                # Mongoose schemas
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Custom middleware
│   │   ├── services/              # Business services
│   │   └── utils/                 # Utility functions
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx               # Entry point
│   │   ├── App.jsx                # Main App component
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API services
│   │   ├── config/                # Frontend config
│   │   └── routes/                # Route definitions
│   ├── package.json
│   └── README.md
│
└── README.md                       # This file
```

## 🔐 Authentication & Authorization

- **JWT-Based**: Uses JSON Web Tokens for stateless authentication
- **Role-Based Access Control**: Supports Teacher, Student, and Admin roles
- **Protected Routes**: Middleware verifies JWT tokens on protected endpoints
- **Local Storage**: Tokens stored in browser localStorage

## 📧 Email Notifications

The system sends automated emails via Brevo API when:
- **Quiz Assignment**: Teacher assigns quiz to students
- **Quiz Scheduled**: Quiz schedule is confirmed
- **Quiz Reminder**: Notifications for upcoming quizzes
- **Performance Reports**: Student performance summaries

Email templates are HTML-formatted with responsive design.

## 🎨 UI Components

Key components include:
- **TeacherDashboard**: Main dashboard with navigation and content rendering
- **TeacherQuizzes**: Quiz list and management interface
- **TeacherCreateQuiz**: Quiz creation and editing form
- **StudentQuizInterface**: Quiz taking interface with emotion detection
- **HelpSupportModal**: In-app help system
- **EmotionChart**: Emotion analytics visualization
- **ProfileImageUpload**: Image upload to Cloudinary

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create new quiz
- `GET /api/quizzes/:id` - Get specific quiz
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz
- `POST /api/quizzes/:id/share` - Share quiz with students

### Students
- `GET /api/students` - Get student list
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student profile

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/mark-read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

### Emotions & Analytics
- `GET /api/emotions` - Get emotion logs
- `GET /api/analytics/student/:id` - Get student analytics
- `GET /api/analytics/quiz/:id` - Get quiz analytics

## 📊 Database Schema

### Key Collections

**Users**
- Stores teacher and student profiles
- Tracks email, password (hashed), role, profile image

**Quizzes**
- Quiz content, questions, answers
- Scheduling info, creation date, sharing status

**StudentResponses**
- Student quiz answers and responses
- Timestamps and emotion data captured during quiz

**Emotions**
- Emotion logs from camera/facial recognition
- Timestamps, emotion type, confidence score

**Notifications**
- In-app notifications for users
- Email notification tracking

## 🔄 Real-Time Features

Using Socket.io for:
- Real-time quiz updates
- Live notification delivery
- Student activity tracking
- Teacher dashboard updates

## 🧪 Testing

Run test files to verify functionality:

```bash
# Backend tests
node test-email-notifications.js
node test-feedback-system.js
node test-quiz-stats.js

# Frontend tests (if available)
cd frontend
npm run lint
```

## 🚢 Deployment

### Backend Deployment (Vercel)
- Configuration file: `backend/vercel.json`
- Deploy command: Push to production branch

### Frontend Deployment
- Build: `npm run build`
- Output: `dist/` folder
- Deploy to Netlify, Vercel, or other static hosts

## 🐛 Troubleshooting

### API Connection Issues
- Verify `VITE_API_BASE` matches backend URL
- Check CORS configuration in backend
- Ensure backend is running on correct port

### Email Not Sending
- Verify Brevo API key is valid
- Check sender email configuration
- Review email templates in backend

### Image Upload Issues
- Verify Cloudinary credentials
- Check file size limits
- Ensure Multer is properly configured

### Emotion Detection Not Working
- Verify Hugging Face API key
- Check camera permissions in browser
- Ensure model is available on Hugging Face

## 📝 Development Guidelines

### Code Structure
- Keep components small and reusable
- Use meaningful variable and function names
- Add comments for complex logic
- Follow React hooks patterns

### Error Handling
- Always wrap API calls in try-catch
- Provide user-friendly error messages
- Log errors for debugging

### State Management
- Use React hooks for local state
- Use localStorage for persistent data
- Consider Context API for shared state

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)

## 👥 Contributors

Developed as a comprehensive educational platform combining emotion recognition with interactive learning.

## 📄 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: February 2026
