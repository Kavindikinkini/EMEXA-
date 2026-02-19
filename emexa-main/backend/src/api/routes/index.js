const express = require('express');
const router = express.Router();
const userRoutes = require('./user.routes');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const teacherRoutes = require('../../routes/teacherRoutes');

// API welcome message
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to EMEXA API v1',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        profile: 'GET /api/v1/auth/profile'
      },
      users: {
        list: 'GET /api/v1/users',
        get: 'GET /api/v1/users/:id',
        update: 'PUT /api/v1/users/:id',
        delete: 'DELETE /api/v1/users/:id'
      },
      teacher: {
        dashboardStats: 'GET /api/v1/teacher/dashboard/stats',
        classProgress: 'GET /api/v1/teacher/dashboard/class-progress',
        engagementTrend: 'GET /api/v1/teacher/dashboard/engagement-trend',
        emotionalState: 'GET /api/v1/teacher/dashboard/emotional-state',
        students: 'GET /api/v1/teacher/dashboard/students',
        quizzes: 'GET /api/v1/teacher/dashboard/quizzes'
      },
      health: 'GET /api/v1/health'
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/teacher', teacherRoutes);

module.exports = router;