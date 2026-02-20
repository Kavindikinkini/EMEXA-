# Student and Teacher Separation Guide

## Overview
Students and Teachers are now stored in **separate MongoDB collections** while maintaining the same UI and API endpoints.

## Database Collections

### 1. **students** Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "student" (auto-set),
  isActive: Boolean,
  studentId: String (auto-generated: STU00001),
  grade: String,
  enrolledCourses: [CourseId],
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **teachers** Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "teacher" (auto-set),
  isActive: Boolean,
  teacherId: String (auto-generated: TCH00001),
  department: String,
  specialization: String,
  courses: [CourseId],
  createdAt: Date,
  updatedAt: Date
}
```

## How Registration Works

### Frontend (No Changes Required)
```javascript
// Register.jsx - Same as before
POST /api/auth/register
Body: {
  fullName: "John Doe",
  email: "john@example.com", 
  password: "password123",
  accountType: "student" // or "teacher"
}
```

### Backend Flow

1. **Controller** (`authController.js`) receives request
2. Checks `accountType` field
3. Routes to appropriate service:
   - `accountType === "teacher"` → `registerTeacher()`
   - `accountType === "student"` → `registerStudent()`
4. Service checks email uniqueness across **both** collections
5. Creates record in appropriate collection
6. Auto-generates ID (STU00001 or TCH00001)
7. Returns token with role embedded

## Login Process

Login automatically searches **both collections**:

```javascript
POST /api/auth/login
Body: { email: "john@example.com", password: "password123" }

// Backend:
1. Check students collection
2. If not found, check teachers collection
3. Return user with appropriate role
```

## Benefits

✅ **Separate Data Storage** - Students and teachers in different collections  
✅ **Auto-Generated IDs** - STU00001, TCH00001 format  
✅ **Role-Specific Fields** - Each collection has unique fields  
✅ **Same UI** - No frontend changes needed  
✅ **Unified Login** - Single endpoint for both types  
✅ **Email Uniqueness** - Checked across both collections  

## Files Modified/Created

### New Models
- `backend/src/models/student.js`
- `backend/src/models/teacher.js`

### New Repositories
- `backend/src/repositories/student.repository.js`
- `backend/src/repositories/teacher.repository.js`

### Updated Files
- `backend/src/controllers/authController.js`
- `backend/src/services/user.service.js`
- `backend/src/middleware/auth.middleware.js`

## Example Usage

### Register a Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Smith",
    "email": "alice@student.com",
    "password": "pass123",
    "accountType": "student"
  }'
```

### Register a Teacher
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Bob Johnson",
    "email": "bob@teacher.com",
    "password": "pass123",
    "accountType": "teacher"
  }'
```

### Login (Works for Both)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@student.com",
    "password": "pass123"
  }'
```

## MongoDB Queries

### View All Students
```javascript
db.students.find()
```

### View All Teachers
```javascript
db.teachers.find()
```

### Count by Type
```javascript
db.students.countDocuments()
db.teachers.countDocuments()
```
