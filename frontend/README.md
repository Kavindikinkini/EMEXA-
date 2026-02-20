# Emexa Frontend

React + Vite frontend for the Emexa emotion-aware educational platform. Provides student quiz interface, teacher dashboard, profile management, and real-time notifications.

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn
- Backend running on `http://127.0.0.1:5000`

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create a `.env` file in the frontend directory:

```
VITE_API_BASE=http://127.0.0.1:5000
```

### Running

**Development:**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

**Production Build:**
```bash
npm run build
npm run preview
```

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Main App component
│   ├── App.css                   # Global styles
│   ├── index.css                 # Base styles
│   ├── components/               # Reusable components
│   │   ├── headerorigin.jsx
│   │   ├── sidebarorigin.jsx
│   │   ├── HelpSupportModal.jsx
│   │   ├── AdminViewWrapper.jsx
│   │   └── ...
│   ├── pages/                    # Page components
│   │   ├── TeacherDashboard.jsx
│   │   ├── TeacherProfile.jsx
│   │   ├── TeacherQuizzes.jsx
│   │   ├── TeacherCreateQuiz.jsx
│   │   ├── StudentQuiz.jsx
│   │   └── ...
│   ├── services/                 # API services
│   │   ├── api.js
│   │   └── ...
│   ├── routes/                   # Route definitions
│   │   └── ProtectedRoute.jsx
│   ├── config/                   # Configuration
│   │   └── constants.js
│   ├── lib/                      # Utility functions
│   │   └── helpers.js
│   ├── assets/                   # Images, fonts
│   │   └── ...
│   └── public/                   # Static files
├── index.html                    # HTML template
├── vite.config.js                # Vite configuration
├── tailwind.config.cjs           # Tailwind CSS config
├── postcss.config.cjs            # PostCSS config
├── eslint.config.js              # ESLint config
├── package.json
└── README.md
```

## 🎨 Key Pages & Components

### Pages

**TeacherDashboard** (`src/pages/TeacherDashboard.jsx`)
- Main teacher interface with menu navigation
- Displays dashboard stats, quiz management, student analytics
- Routes to different sections based on activeMenuItem state

**TeacherProfile** (`src/pages/TeacherProfile.jsx`)
- Teacher profile view and edit
- Profile image upload to Cloudinary
- Settings and preferences

**TeacherQuizzes** (`src/pages/TeacherQuizzes.jsx`)
- List of all quizzes created by teacher
- Quiz filtering and search
- Actions: View, Edit, Share, Delete, Schedule

**TeacherCreateQuiz** (`src/pages/TeacherCreateQuiz.jsx`)
- Create new quiz or edit existing
- Add questions with multiple choice answers
- Set correct answers and hints
- Schedule quiz with date/time

**StudentQuiz** (`src/pages/StudentQuiz.jsx`)
- Quiz taking interface for students
- Emotion detection via camera
- Question display with timer
- Submit responses

### Components

**Header** (`src/components/headerorigin.jsx`)
- Top navigation bar
- User profile display
- Help & Support button
- Notifications

**Sidebar** (`src/components/sidebarorigin.jsx`)
- Navigation menu
- Quiz management options
- Links to different sections

**HelpSupportModal** (`src/components/HelpSupportModal.jsx`)
- In-app help system
- Searchable help articles
- Contact support form

**AdminViewWrapper** (`src/components/AdminViewWrapper.jsx`)
- Allows admin to view as teacher/student
- Testing and debugging tool

## 🌐 API Integration

### Base Configuration

All API calls use the `VITE_API_BASE` environment variable:

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';
```

### Common API Calls

**Authentication:**
```javascript
// Login
POST /api/auth/login
Body: { email, password }

// Logout
POST /api/auth/logout

// Get Profile
GET /api/users/profile
```

**Quizzes:**
```javascript
// Get all quizzes
GET /api/quizzes

// Create quiz
POST /api/quizzes
Body: { title, description, questions[] }

// Update quiz
PUT /api/quizzes/:id
Body: { title, description, questions[] }

// Share quiz
POST /api/quizzes/:id/share
Body: { studentIds[] }

// Schedule quiz
POST /api/quizzes/:id/schedule
Body: { scheduledDate, scheduledTime }
```

**Notifications:**
```javascript
// Get notifications
GET /api/notifications

// Mark as read
POST /api/notifications/:id/read
```

### Axios Instance

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## 🎯 State Management

### localStorage Usage

```javascript
// Authentication
localStorage.setItem('token', jwtToken);
localStorage.setItem('userRole', role);
localStorage.setItem('userName', name);
localStorage.setItem('userId', id);

// UI State
localStorage.setItem('teacherActiveMenuItem', 'dashboard');
localStorage.setItem('profileImage', imageUrl);
```

### Component State

**TeacherDashboard:**
```javascript
const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
const [editingDraftId, setEditingDraftId] = useState(null);
const [userName, setUserName] = useState('');
```

**TeacherCreateQuiz:**
```javascript
const [questions, setQuestions] = useState([]);
const [scheduleDate, setScheduleDate] = useState('');
const [startTime, setStartTime] = useState('');
```

### Custom Events

Profile image changes broadcast via custom events:
```javascript
// Dispatch when image changes
window.dispatchEvent(new Event('profileImageUpdated'));

// Listen for updates
window.addEventListener('profileImageUpdated', loadProfileImage);
```

## 🎨 Styling

**Tailwind CSS** for utility-based styling:
- Configuration: `tailwind.config.cjs`
- PostCSS integration: `postcss.config.cjs`

**Global Styles**: `src/index.css`

**Component Styles**: Inline Tailwind classes, CSS modules when needed

## 📱 Responsive Design

- Mobile-first approach
- Tailwind breakpoints: sm, md, lg, xl, 2xl
- Flexbox and Grid layouts
- Mobile-optimized modals and forms

## 🔐 Authentication

**JWT Storage:**
```javascript
// Store after login
localStorage.setItem('token', response.data.token);

// Include in requests
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

**Protected Routes:**
```javascript
<ProtectedRoute>
  <TeacherDashboard />
</ProtectedRoute>
```

**Role-Based Access:**
```javascript
const userRole = localStorage.getItem('userRole');
if (userRole === 'teacher') {
  // Show teacher features
}
```

## 📸 Image Handling

**Profile Images from Cloudinary:**
```javascript
function getImageUrl(imageUrl) {
  if (!imageUrl) return '/default-profile.png';
  if (imageUrl.includes('cloudinary') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE}${imageUrl}`;
}
```

**Upload to Cloudinary:**
```javascript
const formData = new FormData();
formData.append('file', file);
const response = await API.post('/upload/profile', formData);
```

## 🔔 Real-Time Notifications

**Socket.io Integration:**
```javascript
import io from 'socket.io-client';

const socket = io(API_BASE);

socket.on('notification-received', (notification) => {
  // Handle notification
  displayNotification(notification);
});
```

## 📊 Performance Optimization

- **Code Splitting**: React Router lazy loading
- **Image Optimization**: Cloudinary responsive images
- **Caching**: localStorage for persistent data
- **Memoization**: React.memo for expensive components
- **Lazy Loading**: Images and components loaded on demand

## 🧪 Testing & Linting

**ESLint:**
```bash
npm run lint
```

**Manual Testing:**
- Test with different user roles (teacher, student, admin)
- Verify responsive design on mobile devices
- Test offline functionality with localStorage

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Deploy to Vercel
```bash
npm run build
# Deploy through Vercel dashboard or CLI
```

### Environment Variables
Set `VITE_API_BASE` in deployment platform to production backend URL

## 🐛 Debugging

### Enable Debug Logs
```javascript
// In components
console.log('state:', activeMenuItem);
console.log('api response:', response.data);
```

### React DevTools
- Install React DevTools browser extension
- Inspect component props and state
- Trace re-renders

### Network Tab
- Check API calls in browser DevTools
- Verify request/response data
- Monitor network performance

### Common Issues

**Blank Page After Login**
- Check localStorage token is saved
- Verify API_BASE is correct
- Check console for errors

**Images Not Loading**
- Verify Cloudinary URLs are correct
- Check `getImageUrl()` helper logic
- Review CORS settings on backend

**API 404 Errors**
- Verify backend is running
- Check API_BASE matches backend URL
- Confirm route path is correct

**Socket.io Not Connecting**
- Verify backend socket.io is enabled
- Check CORS configuration
- Review firewall settings

## 📝 Component Development Guidelines

### Create Reusable Components
```javascript
// src/components/MyComponent.jsx
export default function MyComponent({ prop1, prop2, onAction }) {
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}
```

### Use Props Over Props Drilling
```javascript
// Pass props through minimal levels
<Parent>
  <Child prop={value} />
</Parent>
```

### Handle Loading & Error States
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

## 🔗 Related Files

- Backend: See `../backend/README.md`
- Main Project: See `../README.md`

## 📄 License

Proprietary - All rights reserved

---

**Last Updated**: February 2026
