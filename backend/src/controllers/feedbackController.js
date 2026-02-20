import { HfInference } from '@huggingface/inference';
import mongoose from 'mongoose';
import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import HintUsage from '../models/hintUsage.js';

// Initialize Hugging Face client
const hf = process.env.HF_API_KEY && process.env.HF_API_KEY !== 'hf_dummy_key_for_testing' 
  ? new HfInference(process.env.HF_API_KEY) 
  : null;

// Create an API endpoint that generates personalized quiz feedback
// using Hugging Face text generation.
// Input: raw score, hint count, emotion summary.
// Output: 3–5 sentence personalized feedback paragraph.

export const generateFeedback = async (req, res) => {
  try {
    const {
      userId,
      quizId,
      sessionId,
      rawScore,
      totalQuestions,
      answers
    } = req.body;

    console.log('📥 Received feedback request:', {
      userId,
      quizId,
      sessionId,
      rawScore,
      totalQuestions,
      answersCount: answers?.length
    });

    // Validate and convert IDs to ObjectId
    if (!userId || !quizId || !sessionId || rawScore === undefined || !totalQuestions) {
      console.error('❌ Missing required fields:', { userId, quizId, sessionId, rawScore, totalQuestions });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, quizId, sessionId, rawScore, totalQuestions'
      });
    }

    // Convert string IDs to ObjectId
    let userObjectId, quizObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
      quizObjectId = new mongoose.Types.ObjectId(quizId);
      console.log('✅ IDs converted to ObjectId format');
    } catch (idError) {
      console.error('❌ Invalid ID format:', idError.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid userId or quizId format'
      });
    }

    // Get emotion logs
    console.log('🔍 Fetching emotion logs...');
    const emotionLogs = await EmotionLog.find({ userId: userObjectId, sessionId });
    console.log(`✅ Found ${emotionLogs.length} emotion logs`);
    
    // Get hints used
    console.log('🔍 Fetching hint usage...');
    const hintsUsed = await HintUsage.find({ userId: userObjectId, sessionId });
    console.log(`✅ Found ${hintsUsed.length} hint usages`);
    
    // Calculate final score
    const totalHints = hintsUsed.length;
    const finalScore = Math.max(0, rawScore - totalHints);
    console.log(`📊 Score calculation: Raw ${rawScore} - Hints ${totalHints} = Final ${finalScore}`);
    
    // Calculate emotion summary
    const emotionCounts = {};
    emotionLogs.forEach(log => {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
    });

    const mostCommonEmotion = emotionLogs.length > 0
      ? Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0][0]
      : 'neutral';

    const confusedCount = emotionCounts['confused'] || 0;
    const happyCount = emotionCounts['happy'] || 0;
    const neutralCount = emotionCounts['neutral'] || 0;

    // Prepare prompt for personalized feedback
    const scorePercentage = Math.round((rawScore / totalQuestions) * 100);
    const emotionSummary = emotionLogs.length > 0
      ? `Student showed ${mostCommonEmotion} emotion most often. Confusion detected ${confusedCount} times.`
      : 'No emotion data available.';

    const prompt = `You are an encouraging teacher providing personalized feedback to a student who just completed a quiz. Write a supportive, constructive 3-5 sentence feedback paragraph.

Student Performance:
- Score: ${rawScore}/${totalQuestions} (${scorePercentage}%)
- Hints Used: ${totalHints}
- Final Score (after hint deduction): ${finalScore}/${totalQuestions}
- Emotional State: ${emotionSummary}

Provide personalized feedback that:
1. Acknowledges their effort and strengths
2. Addresses emotional patterns if confusion was detected
3. Provides specific, actionable advice
4. Encourages continued learning

Feedback:`;

    let aiFeedback = null;

    // Try to generate feedback using Hugging Face API
    if (hf) {
      try {
        console.log('🤖 Attempting to generate feedback with Hugging Face...');
        const response = await hf.textGeneration({
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          inputs: prompt,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false
          }
        });

        aiFeedback = response.generated_text.trim();
        
        // Clean up feedback - remove any prompt repetition
        const feedbackLines = aiFeedback.split('\n').filter(line => 
          line.trim() && 
          !line.includes('Student Performance:') &&
          !line.includes('Feedback:')
        );
        aiFeedback = feedbackLines.join(' ').trim();

        // If feedback is too short, use template
        if (aiFeedback.length < 50) {
          aiFeedback = null;
        } else {
          console.log('✅ AI feedback generated successfully');
        }
      } catch (hfError) {
        console.error('⚠️ Hugging Face API error:', hfError.message);
        aiFeedback = null;
      }
    } else {
      console.log('⚠️ Hugging Face API key not configured, using template feedback');
    }

    // Fallback to template-based feedback if AI fails or is unavailable
    if (!aiFeedback) {
      console.log('📝 Using template-based feedback');
      
      // Generate template-based feedback
      let performanceLevel = 'good';
      if (scorePercentage < 40) performanceLevel = 'needs improvement';
      else if (scorePercentage < 60) performanceLevel = 'average';
      else if (scorePercentage < 80) performanceLevel = 'good';
      else performanceLevel = 'excellent';

      let hintsMessage = '';
      if (totalHints > 0) {
        hintsMessage = `You used ${totalHints} hint${totalHints > 1 ? 's' : ''}, showing that you actively sought help when facing challenges. `;
      } else {
        hintsMessage = 'You worked through the questions independently without using hints. ';
      }

      let emotionMessage = '';
      if (confusedCount > 0) {
        emotionMessage = `I noticed moments of confusion, particularly around certain topics, but your persistence in working through the quiz is commendable. `;
      } else {
        emotionMessage = 'You maintained a focused approach throughout the quiz. ';
      }

      aiFeedback = `You achieved ${performanceLevel} performance on this quiz with a score of ${rawScore} out of ${totalQuestions} (${scorePercentage}%). ${hintsMessage}${emotionMessage}To improve further, focus on reviewing the concepts where you found difficulty. Keep practicing regularly, and don't hesitate to ask for clarification on challenging topics. Your effort and engagement will lead to better results!`;
    }

    // Save quiz attempt
    console.log('💾 Saving quiz attempt...');
    const quizAttemptData = {
      userId: userObjectId,
      quizId: quizObjectId,
      sessionId,
      rawScore,
      hintsUsed: totalHints,
      finalScore,
      emotionalSummary: {
        mostCommonEmotion,
        confusedCount,
        happyCount,
        neutralCount,
        totalEmotionCaptures: emotionLogs.length
      },
      aiFeedback,
      answers: answers || [],
      completedAt: new Date()
    };

    // Use upsert to handle duplicate sessionId - update if exists, insert if not
    await QuizAttempt.updateOne(
      { sessionId },
      quizAttemptData,
      { upsert: true }
    );

    console.log('✅ Quiz attempt saved successfully');
    console.log(`📊 Results: Raw: ${rawScore}, Hints: ${totalHints}, Final: ${finalScore}`);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        rawScore,
        hintsUsed: totalHints,
        finalScore,
        feedback: aiFeedback,
        emotionalSummary: {
          mostCommonEmotion,
          confusedCount,
          happyCount,
          neutralCount,
          totalCaptures: emotionLogs.length,
          emotionCounts
        }
      }
    });

  } catch (error) {
    console.error('❌ Feedback generation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      message: 'Error generating feedback',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get quiz attempt details
export const getQuizAttempt = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const attempt = await QuizAttempt.findOne({ sessionId })
      .populate('userId', 'name email')
      .populate('quizId', 'title description');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });

  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz attempt',
      error: error.message
    });
  }
};

// Get all attempts for a user
export const getUserAttempts = async (req, res) => {
  try {
    const { userId } = req.params;

    const attempts = await QuizAttempt.find({ userId })
      .populate('quizId', 'title description')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      data: attempts
    });

  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user attempts',
      error: error.message
    });
  }
};
