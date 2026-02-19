#!/usr/bin/env node
/**
 * Test Feedback API Endpoint
 * Tests the /api/feedback endpoint to verify feedback generation works
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

// Mock student data
const mockFeedbackRequest = {
  userId: '507f1f77bcf86cd799439011', // Mock ObjectId
  quizId: '507f1f77bcf86cd799439012', // Mock ObjectId
  sessionId: 'quiz_test_' + Date.now(),
  rawScore: 6,
  totalQuestions: 8,
  answers: [
    { questionId: 1, selectedAnswer: 0, isCorrect: true },
    { questionId: 2, selectedAnswer: 1, isCorrect: true },
    { questionId: 3, selectedAnswer: 2, isCorrect: false },
    { questionId: 4, selectedAnswer: 2, isCorrect: true },
    { questionId: 5, selectedAnswer: 0, isCorrect: true },
    { questionId: 6, selectedAnswer: 1, isCorrect: true },
    { questionId: 7, selectedAnswer: 3, isCorrect: false },
    { questionId: 8, selectedAnswer: 2, isCorrect: false },
  ]
};

const testFeedbackAPI = async () => {
  console.log('\n📋 Testing Feedback API Endpoint\n');
  console.log('Request URL: POST /api/feedback');
  console.log('Payload:', JSON.stringify(mockFeedbackRequest, null, 2));
  console.log('\n-----------------------------------\n');

  try {
    const response = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, this would need a valid JWT token
      },
      body: JSON.stringify(mockFeedbackRequest),
    });

    console.log('Status Code:', response.status);

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('\n✅ Feedback API Response - SUCCESS\n');
      console.log('Raw Score:', data.data.rawScore);
      console.log('Hints Used:', data.data.hintsUsed);
      console.log('Final Score:', data.data.finalScore);
      console.log('\nFeedback Generated:');
      console.log(`"${data.data.feedback}"\n`);

      if (data.data.emotionalSummary) {
        console.log('Emotional Analysis:');
        console.log('- Most Common Emotion:', data.data.emotionalSummary.mostCommonEmotion);
        console.log('- Total Emotion Captures:', data.data.emotionalSummary.totalCaptures);
        console.log('- Confusion Count:', data.data.emotionalSummary.confusedCount);
      }

      console.log('\n✅ Feedback system is working correctly!\n');
    } else {
      console.log('\n❌ API Error Response\n');
      console.log('Message:', data.message);
      console.log('Error:', data.error);
      console.log('\nNote: Authentication may be required. Add JWT token to headers.\n');
    }
  } catch (error) {
    console.log('\n❌ Connection Error\n');
    console.log('Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend server is running on port 5000');
    console.log('2. MongoDB is connected');
    console.log('3. Hugging Face API key is configured\n');
  }
};

// Run test
testFeedbackAPI();
