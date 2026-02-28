// backend/src/controllers/analyticsController.js
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import TeacherQuiz from '../models/teacherQuiz.js';

export const getAdminOverview = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalQuizzes, totalAttempts, studentsByGender, studentsByYear, emotionDist] = await Promise.all([
      Student.countDocuments({ status: 'Active' }),
      Teacher.countDocuments({ status: 'Active' }),
      TeacherQuiz.countDocuments(),
      QuizAttempt.countDocuments(),
      Student.aggregate([
        { $match: { status: 'Active', gender: { $ne: null } } },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]),
      Student.aggregate([
        { $match: { status: 'Active', year: { $ne: null } } },
        { $group: { _id: '$year', count: { $sum: 1 } } }
      ]),
      EmotionLog.aggregate([{ $group: { _id: '$emotion', count: { $sum: 1 } } }])
    ]);

    const genderStats = { Male: 0, Female: 0, Other: 0, 'Prefer not to say': 0 };
    studentsByGender.forEach(item => { if (item._id) genderStats[item._id] = item.count; });

    const yearStats = { '1st year': 0, '2nd year': 0, '3rd year': 0, '4th year': 0 };
    studentsByYear.forEach(item => { if (item._id) yearStats[item._id] = item.count; });

    const emotionStats = {};
    emotionDist.forEach(item => { if (item._id) emotionStats[item._id] = item.count; });

    res.json({
      overview: { totalStudents, totalTeachers, totalQuizzes, totalAttempts },
      demographics: { byGender: genderStats, byYear: yearStats },
      emotions: emotionStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};