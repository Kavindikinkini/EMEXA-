import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Test Teacher Quiz Model
const testTeacherQuiz = async () => {
  try {
    // Import model after connection
    const TeacherQuiz = (await import('./src/models/teacherQuiz.js')).default;
    
    console.log('\n📊 Testing Teacher Quiz Database Integration...\n');
    
    // 1. Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const quizCollection = collections.find(c => c.name === 'teacherquizzes');
    console.log('1️⃣  Collection exists:', quizCollection ? '✅ Yes' : '❌ No (will be created on first save)');
    
    // 2. Count existing quizzes
    const count = await TeacherQuiz.countDocuments();
    console.log('2️⃣  Existing quizzes in database:', count);
    
    // 3. List all quizzes
    if (count > 0) {
      const quizzes = await TeacherQuiz.find()
        .select('title subject gradeLevel status isScheduled createdAt')
        .sort({ createdAt: -1 })
        .limit(10);
      
      console.log('\n3️⃣  Recent Quizzes:');
      quizzes.forEach((quiz, index) => {
        console.log(`   ${index + 1}. ${quiz.title} (${quiz.subject}) - ${quiz.status}`);
        console.log(`      Grade: ${quiz.gradeLevel} | Scheduled: ${quiz.isScheduled}`);
        console.log(`      Created: ${quiz.createdAt.toLocaleDateString()}`);
      });
    } else {
      console.log('3️⃣  No quizzes found in database yet.');
    }
    
    // 4. Check schema validation
    console.log('\n4️⃣  Schema Validation Test:');
    const testQuiz = new TeacherQuiz({
      teacherId: new mongoose.Types.ObjectId(),
      title: 'Test Quiz',
      subject: 'Mathematics',
      gradeLevel: '1st Year',
      dueDate: new Date(),
      questions: [{
        id: 1,
        type: 'mcq',
        questionText: 'What is 2+2?',
        options: [
          { id: 1, text: '3', isCorrect: false },
          { id: 2, text: '4', isCorrect: true }
        ],
        hints: ['Think simple', 'Basic math', 'Elementary addition', 'The answer is 4']
      }],
      status: 'draft'
    });
    
    const validationError = testQuiz.validateSync();
    if (validationError) {
      console.log('   ❌ Schema validation failed:', validationError.message);
    } else {
      console.log('   ✅ Schema validation passed');
    }
    
    console.log('\n5️⃣  API Routes Status:');
    console.log('   POST   /api/teacher-quizzes/create       - Create new quiz');
    console.log('   GET    /api/teacher-quizzes/drafts       - Get draft quizzes');
    console.log('   GET    /api/teacher-quizzes/shared       - Get shared quizzes (students)');
    console.log('   POST   /api/teacher-quizzes/:id/schedule - Schedule quiz');
    console.log('   DELETE /api/teacher-quizzes/:id          - Delete quiz');
    
    console.log('\n✅ Database integration test completed!\n');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run tests
(async () => {
  await connectDB();
  await testTeacherQuiz();
})();
