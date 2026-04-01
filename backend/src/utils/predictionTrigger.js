// backend/src/utils/predictionTrigger.js
import { generatePredictionForStudent } from '../controllers/finalMarkPredictionController.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import Student from '../models/student.js';

/**
 * Called automatically after a student submits a quiz.
 * Finds which teacher owns that quiz, regenerates that student's prediction.
 *
 * @param {string} studentMongoId - student._id
 * @param {string} quizId         - the quiz just submitted (pass this for speed)
 */
export async function triggerPredictionAfterQuiz(studentMongoId, quizId) {
  try {
    let teacherIds = [];

    if (quizId) {
      // Fast path: direct lookup of the submitted quiz
      const quiz = await TeacherQuiz.findById(quizId).select('teacherId').lean();
      if (quiz?.teacherId) {
        teacherIds = [quiz.teacherId.toString()];
      }
    }

    // Fallback: find teachers via student's year/semester matching quiz filters
    if (teacherIds.length === 0) {
      const student = await Student.findById(studentMongoId)
        .select('year semester').lean();

      if (student) {
        const yearMapping = {
          '1st year': 1, '2nd year': 2, '3rd year': 3, '4th year': 4
        };
        const academicYear = yearMapping[student.year];
        const filter = { isDeleted: false };
        if (academicYear)    filter.academicYear = academicYear;
        if (student.semester) filter.semester    = student.semester;

        const quizzes = await TeacherQuiz.find(filter).select('teacherId').lean();
        teacherIds = [...new Set(
          quizzes.map(q => q.teacherId?.toString()).filter(Boolean)
        )];
      }
    }

    if (teacherIds.length === 0) {
      console.warn('⚠️  No teachers found for prediction trigger');
      return;
    }

    for (const teacherId of teacherIds) {
      await generatePredictionForStudent(studentMongoId, teacherId);
    }

    console.log(`✅ Predictions refreshed for student ${studentMongoId} (${teacherIds.length} teacher(s))`);
  } catch (err) {
    console.warn('⚠️  Prediction auto-trigger failed (non-critical):', err.message);
  }
}

/**
 * Seeds predictions for ALL existing students linked to a teacher.
 * Called once when teacher clicks "Generate All Predictions".
 *
 * @param {string} teacherMongoId
 */
export async function seedPredictionsForTeacher(teacherMongoId) {
  try {
    const quizzes = await TeacherQuiz.find({
      teacherId: teacherMongoId,
      isDeleted: false
    }).select('semester academicYear').lean();

    if (quizzes.length === 0) {
      return { seeded: 0, message: 'No quizzes found for this teacher' };
    }

    // Build a union of all semester/year combos from this teacher's quizzes
    const yearMapping = { 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year' };
    const orFilters = [];

    for (const q of quizzes) {
      const f = {};
      if (q.academicYear) f.year     = yearMapping[q.academicYear];
      if (q.semester)     f.semester = q.semester;
      if (Object.keys(f).length > 0) orFilters.push(f);
    }

    const studentFilter = orFilters.length > 0
      ? { $or: orFilters, approvalStatus: 'approved' }
      : { approvalStatus: 'approved' };

    const students = await Student.find(studentFilter).select('_id').lean();

    if (students.length === 0) {
      return { seeded: 0, message: 'No matching approved students found. Check that students have year/semester set.' };
    }

    let seeded = 0;
    for (const student of students) {
      try {
        await generatePredictionForStudent(student._id.toString(), teacherMongoId);
        seeded++;
      } catch (e) {
        console.warn(`⚠️  Skipped student ${student._id}:`, e.message);
      }
    }

    console.log(`✅ Seeded ${seeded}/${students.length} predictions for teacher ${teacherMongoId}`);
    return { seeded, total: students.length };
  } catch (err) {
    console.error('❌ seedPredictionsForTeacher error:', err);
    throw err;
  }
}