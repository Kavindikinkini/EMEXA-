import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import QuizAttempt from './src/models/quizAttempt.js';
import EmotionLog from './src/models/emotionLog.js';
import HintUsage from './src/models/hintUsage.js';

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

// Test Personalized Feedback System
const testFeedbackSystem = async () => {
  try {
    console.log('\n📋 Testing Personalized Feedback System...\n');

    // 1. Check if QuizAttempt collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const attemptCollection = collections.find(c => c.name === 'quizattempts');
    console.log('1️⃣  QuizAttempt Collection:', attemptCollection ? '✅ Exists' : '❌ Not found');

    // 2. Count existing quiz attempts
    const attemptCount = await QuizAttempt.countDocuments();
    console.log(`2️⃣  Quiz Attempts in Database: ${attemptCount}`);

    // 3. Count emotion logs
    const emotionCount = await EmotionLog.countDocuments();
    console.log(`3️⃣  Emotion Logs in Database: ${emotionCount}`);

    // 4. Count hint usages
    const hintCount = await HintUsage.countDocuments();
    console.log(`4️⃣  Hint Usages in Database: ${hintCount}`);

    // 5. Get recent quiz attempts
    if (attemptCount > 0) {
      console.log('\n5️⃣  Recent Quiz Attempts:');
      const recentAttempts = await QuizAttempt.find()
        .sort({ completedAt: -1 })
        .limit(5);

      recentAttempts.forEach((attempt, index) => {
        console.log(`\n   ${index + 1}. Session: ${attempt.sessionId}`);
        console.log(`      Raw Score: ${attempt.rawScore}`);
        console.log(`      Hints Used: ${attempt.hintsUsed}`);
        console.log(`      Final Score: ${attempt.finalScore}`);
        console.log(`      Feedback: ${attempt.aiFeedback.substring(0, 80)}...`);
        if (attempt.emotionalSummary) {
          console.log(`      Emotion: ${attempt.emotionalSummary.mostCommonEmotion}`);
          console.log(`      Confusion Count: ${attempt.emotionalSummary.confusedCount}`);
        }
      });
    } else {
      console.log('\n5️⃣  No quiz attempts found yet');
    }

    // 6. Verify QuizAttempt Schema
    console.log('\n6️⃣  QuizAttempt Schema Fields:');
    const schema = QuizAttempt.schema;
    Object.keys(schema.obj).forEach(field => {
      const type = schema.obj[field].type ? schema.obj[field].type.name : 'Complex';
      console.log(`      ✓ ${field}: ${type}`);
    });

    // 7. Test API Endpoint info
    console.log('\n7️⃣  API Endpoints Status:');
    console.log('      POST   /api/feedback                  - Generate feedback');
    console.log('      GET    /api/feedback/attempt/:sessionId - Get attempt details');
    console.log('      GET    /api/feedback/user/:userId     - Get user attempts');

    console.log('\n✅ Feedback system test completed!\n');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
};

// Run test
connectDB().then(() => testFeedbackSystem());
