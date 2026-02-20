// Sample quiz data (replace with database queries later)
import Notification from '../models/notification.js';
import { 
  sendEmailNotification, 
  sendQuizSubmissionEmail 
} from '../services/notificationEmail.service.js';
import User from '../models/user.js';
import Student from '../models/student.js';
import QuizAttempt from '../models/quizAttempt.js'; 

const sampleQuizzes = {
  'matrix-quiz': {
    id: 'matrix-quiz',
    title: 'Matrix Operations',
    description: 'Test your knowledge of matrix operations',
    questions: [
      {
        id: 1,
        text: "What is the result of multiplying a 2x3 matrix by a 3x2 matrix?",
        options: ["2x2 matrix", "3x3 matrix", "2x3 matrix", "Cannot be multiplied"],
        correctAnswer: 0,
        hints: [
          "Think about matrix dimension rules.",
          "When multiplying matrices, the inner dimensions must match.",
          "The result takes the outer dimensions.",
          "A 2x3 × 3x2 results in a 2x2 matrix."
        ]
      },
      // Add more questions...
    ]
  },
  'vectors-quiz': {
    id: 'vectors-quiz',
    title: 'Vector Mathematics',
    description: 'Comprehensive test on vectors',
    questions: [
      // Add vector questions...
    ]
  },
  'limits-quiz': {
    id: 'limits-quiz',
    title: 'Calculus Limits',
    description: 'Understanding limits and continuity',
    questions: [
      // Add limit questions...
    ]
  }
};

// Get all quizzes
export const getAllQuizzes = async (req, res) => {
  try {
    // TODO: Replace with database query
    const quizzes = Object.values(sampleQuizzes).map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz.questions.length
    }));

    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quizzes',
      error: error.message
    });
  }
};

// Get quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // TODO: Replace with database query
    const quiz = sampleQuizzes[quizId];

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz',
      error: error.message
    });
  }
};

// Submit quiz answers
export const submitQuizAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTaken } = req.body;
    const userId = req.user.id;

    // TODO: Replace with database query
    const quiz = sampleQuizzes[quizId];

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    // TODO: Save results to database
    const quizResult = {
      userId,
      quizId,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeTaken,
      answers: results,
      submittedAt: new Date()
    };

// CREATE QUIZ ATTEMPT ACTIVITY RECORD
try {
  const attemptData = {
    userId,
    quizId,
    sessionId: sessionId || `session-${Date.now()}`,
    rawScore: correctAnswers,
    finalScore: score,
    hintsUsed: hintsUsed || 0,
    answers: results.map(r => ({
      questionId: r.questionId.toString(),
      selectedAnswer: r.userAnswer?.toString(),
      isCorrect: r.isCorrect
    })),
    emotionalSummary: emotionData ? {
      mostCommonEmotion: emotionData.mostCommonEmotion || 'neutral',
      confusedCount: emotionData.confusedCount || 0,
      happyCount: emotionData.happyCount || 0,
      neutralCount: emotionData.neutralCount || 0,
      totalEmotionCaptures: emotionData.totalEmotionCaptures || 0
    } : undefined,
    completedAt: new Date()
  };

  const quizAttempt = await QuizAttempt.create(attemptData);
  console.log('✅ Quiz attempt activity recorded:', quizAttempt._id);
} catch (activityError) {
  console.error('❌ Error recording quiz attempt activity:', activityError);
  // Don't fail the submission if activity recording fails
}

    // Create submission confirmation notification for student
    // Check if notification already exists for this specific submission
    try {
      const existingNotification = await Notification.findOne({
        recipientId: userId,
        quizId: quizId,
        type: 'quiz_assigned',
        createdAt: { $gte: new Date(Date.now() - 5000) } // Within last 5 seconds
      });

      if (!existingNotification) {
        await Notification.create({
          recipientId: userId,
          recipientRole: 'student',
          type: 'quiz_assigned',
          title: quiz.title || 'Quiz Submitted',
          description: `Your submission has been received. You scored ${score}% (${correctAnswers}/${quiz.questions.length} correct).`,
          quizId: quizId,
          score: `${score}/100`,
          status: 'graded',
          isRead: false
        });
        console.log('✅ Submission notification created for student:', userId);
      } else {
        console.log('⚠️ Notification already exists for this submission, skipping duplicate');
      }

      // Send email notification if enabled
      try {
        const student = await Student.findById(userId);
        if (student && student.email) {
          const emailHtml = await sendQuizSubmissionEmail(
            student.email,
            student.name || 'Student',
            quiz.title || 'Quiz',
            `${score}%`
          );

          await sendEmailNotification(
            userId,
            student.email,
            `✅ Quiz Submitted: ${quiz.title || 'Quiz'}`,
            emailHtml
          );
        }
      } catch (emailError) {
        console.error('❌ Error sending submission email:', emailError.message);
      }
    } catch (notifError) {
      console.error('❌ Error creating submission notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: quizResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz',
      error: error.message
    });
  }
};

// Get quiz results
export const getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    // TODO: Fetch from database
    // This is placeholder data
    res.json({
      success: true,
      result: {
        quizId,
        score: 85,
        completedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz results',
      error: error.message
    });
  }
};