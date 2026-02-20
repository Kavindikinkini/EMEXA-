# Teacher Dashboard Backend API

## Overview
This backend provides REST API endpoints for the teacher dashboard functionality without modifying existing files.

## New Files Created

### 1. `src/controllers/teacherController.js`
Controller handling all teacher dashboard logic including:
- Dashboard statistics
- Class progress tracking
- Engagement trends
- Emotional state analysis
- Student overview
- Quiz management

### 2. `src/routes/teacherRoutes.js`
Route definitions for teacher dashboard endpoints

### 3. `database/teacher_dashboard_schema.sql`
Database schema for teacher dashboard tables

## API Endpoints

### Base URL: `/api/v1/teacher`

### 1. Get Dashboard Stats
```
GET /dashboard/stats
```
Returns:
- Total students count
- Present students today
- Average progress percentage
- Engagement level (High/Medium/Low)

### 2. Get Class Progress
```
GET /dashboard/class-progress
```
Returns weekly progress data for the last 4 weeks with completed and target percentages.

### 3. Get Engagement Trend
```
GET /dashboard/engagement-trend
```
Returns daily engagement scores for the last 5 days.

### 4. Get Emotional State Distribution
```
GET /dashboard/emotional-state
```
Returns percentage distribution of emotions:
- Happy
- Confused
- Frustrated
- Neutral

### 5. Get Student Overview
```
GET /dashboard/students?limit=4
```
Returns list of students with:
- Name
- Progress percentage
- Engagement level
- Profile image

### 6. Get Recent Quizzes
```
GET /dashboard/quizzes
```
Returns recent quizzes with completion statistics.

## Database Schema

### Tables Created:
1. `teacher_students` - Links teachers to their students
2. `attendance` - Tracks student attendance
3. `student_progress` - Stores student progress percentages
4. `student_engagement` - Daily engagement scores
5. `weekly_progress` - Weekly class progress data
6. `emotional_state` - Student emotional state tracking
7. `quizzes` - Quiz information
8. `quiz_submissions` - Student quiz submissions

## Installation

1. Run the database schema:
```bash
mysql -u your_username -p your_database < backend/database/teacher_dashboard_schema.sql
```

2. The routes are automatically registered in the existing app structure.

## Authentication

All endpoints require authentication using JWT token:
```
Authorization: Bearer <your_jwt_token>
```

## Sample Requests

### Get Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/v1/teacher/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Student Overview
```bash
curl -X GET http://localhost:5000/api/v1/teacher/dashboard/students?limit=4 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Format

Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [...]
}
```

## Notes

- All endpoints use the existing authentication middleware
- No existing files were modified
- Uses existing database connection and utilities
- Compatible with current API structure
- All queries use proper joins to ensure data integrity
- Includes proper error handling and validation
