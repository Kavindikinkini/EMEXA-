import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Get teacher token (replace with actual token from localStorage or login)
const testQuizStats = async () => {
  try {
    // You'll need to replace this with an actual teacher token
    const token = process.env.TEACHER_TOKEN || 'YOUR_TEACHER_TOKEN_HERE';
    
    console.log('🧪 Testing quiz stats endpoint...');
    console.log('Token:', token.substring(0, 20) + '...');
    
    const response = await axios.get(`${API_BASE}/api/teacher-quizzes/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n✅ Stats Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
};

// Also test getting all quizzes
const testGetQuizzes = async () => {
  try {
    const token = process.env.TEACHER_TOKEN || 'YOUR_TEACHER_TOKEN_HERE';
    
    console.log('\n🧪 Testing get quizzes endpoint...');
    
    const response = await axios.get(`${API_BASE}/api/teacher-quizzes/my-quizzes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n✅ Quizzes Response:');
    console.log('Total quizzes:', response.data.quizzes?.length || 0);
    
    if (response.data.quizzes && response.data.quizzes.length > 0) {
      response.data.quizzes.forEach((quiz, idx) => {
        console.log(`\nQuiz ${idx + 1}:`);
        console.log('  Title:', quiz.title);
        console.log('  Status:', quiz.status);
        console.log('  IsScheduled:', quiz.isScheduled);
        console.log('  ScheduleDate:', quiz.scheduleDate);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
};

// Run tests
console.log('🎯 Starting quiz stats tests...\n');
testQuizStats().then(() => testGetQuizzes());
