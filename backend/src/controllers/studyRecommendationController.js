// backend/src/controllers/studyRecommendationController.js
// Emotion-Based Study Recommendations using Groq AI

import Groq from 'groq-sdk';
import QuizAttempt from '../models/quizAttempt.js';
import EmotionLog from '../models/emotionLog.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import mongoose from 'mongoose';

let groqClient = null;
const getGroq = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

// GET /api/study-recommendations/my-recommendations
export const getStudyRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get last 10 quiz attempts
    const attempts = await QuizAttempt.find({ userId })
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();

    if (!attempts || attempts.length === 0) {
      return res.json({
        recommendations: [],
        message: 'Complete some quizzes to get personalized study recommendations!',
        hasData: false
      });
    }

    // Get emotion logs for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const emotionLogs = await EmotionLog.find({
      userId,
      timestamp: { $gte: sevenDaysAgo }
    }).lean();

    // Get quiz titles — filter out null/invalid quizIds first
    const quizIds = attempts
      .map(a => a.quizId)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));

    const quizMap = {};
    if (quizIds.length > 0) {
      try {
        const quizzes = await TeacherQuiz.find({ _id: { $in: quizIds } })
          .select('title subject')
          .lean();
        quizzes.forEach(q => {
          quizMap[q._id.toString()] = { title: q.title, subject: q.subject };
        });
      } catch (quizErr) {
        console.warn('⚠️ Could not fetch quiz titles:', quizErr.message);
        // Non-fatal — continue without quiz titles
      }
    }

    // Build emotion summary
    const emotionCounts = {};
    (emotionLogs || []).forEach(log => {
      if (log.emotion) {
        emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
      }
    });

    const totalEmotions = emotionLogs.length;
    const dominantEmotion = totalEmotions > 0
      ? Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'neutral';

    // Build performance summary with null guards
    const validScores = attempts.map(a => a.finalScore ?? 0);
    const avgScore = validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
    const totalHints = attempts.reduce((sum, a) => sum + (a.hintsUsed ?? 0), 0);
    const lowScoreAttempts = attempts.filter(a => (a.finalScore ?? 0) < 50);
    const confusedCount = attempts.reduce(
      (sum, a) => sum + (a.emotionalSummary?.confusedCount ?? 0), 0
    );

    // Build recent quiz context (last 5)
    const recentQuizContext = attempts.slice(0, 5).map(a => ({
      quiz: quizMap[a.quizId?.toString()]?.title || 'Unknown Quiz',
      subject: quizMap[a.quizId?.toString()]?.subject || 'General',
      score: Math.round(a.finalScore ?? 0),
      hints: a.hintsUsed ?? 0,
      dominantEmotion: a.emotionalSummary?.mostCommonEmotion || 'neutral',
      confused: a.emotionalSummary?.confusedCount ?? 0
    }));

    // Fallback recommendations (used if Groq fails)
    const fallbackParsed = {
      recommendations: [
        {
          id: 1,
          title: "Review Confusing Topics",
          description: "You showed confusion in several quiz questions. Go back and review the topics where you used hints.",
          priority: "high",
          category: "academic",
          actionItems: ["Review hint topics", "Practice similar questions"],
          emotionInsight: "Confusion signals gaps in understanding that targeted review can fix."
        },
        {
          id: 2,
          title: "Manage Quiz Anxiety",
          description: "Your emotion data suggests stress during quizzes. Try breathing exercises before starting.",
          priority: "medium",
          category: "emotional",
          actionItems: ["Deep breathing before quiz", "Take breaks between questions"],
          emotionInsight: "Calmer emotions correlate with better performance."
        },
        {
          id: 3,
          title: "Strengthen Weak Areas",
          description: "Focus extra study time on topics where your scores were below 50%.",
          priority: "high",
          category: "strategy",
          actionItems: ["Identify weak topics", "Allocate more study time"],
          emotionInsight: "Low scores with high confusion indicate foundational gaps."
        },
        {
          id: 4,
          title: "Build Study Consistency",
          description: "Regular short study sessions are more effective than cramming before quizzes.",
          priority: "low",
          category: "wellbeing",
          actionItems: ["Study 30 mins daily", "Review notes after each class"],
          emotionInsight: "Consistent study reduces quiz anxiety and improves confidence."
        }
      ],
      overallInsight: "Your performance shows potential with room for emotional and academic improvement.",
      emotionalHealthScore: Math.max(20, Math.min(90, Math.round(avgScore)))
    };

    // Try Groq AI — fall back gracefully if it fails
    let parsed = fallbackParsed;

    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not set');
      }

      const emotionBreakdown = totalEmotions > 0
        ? Object.entries(emotionCounts)
            .map(([e, c]) => `- ${e}: ${Math.round((c / totalEmotions) * 100)}%`)
            .join('\n')
        : '- No emotion data captured';

      const prompt = `You are an educational AI advisor. Analyze this student's performance and emotional data, then provide exactly 4 personalized study recommendations.

STUDENT DATA:
- Average Score: ${Math.round(avgScore)}%
- Total Hints Used: ${totalHints} across ${attempts.length} quizzes
- Dominant Emotion During Quizzes: ${dominantEmotion}
- Confused Moments: ${confusedCount} times
- Low Score Quizzes (<50%): ${lowScoreAttempts.length}

RECENT QUIZ PERFORMANCE:
${recentQuizContext.map(q => `- "${q.quiz}" (${q.subject}): ${q.score}% score, ${q.hints} hints, felt ${q.dominantEmotion}, confused ${q.confused} times`).join('\n')}

EMOTION BREAKDOWN (last 7 days):
${emotionBreakdown}

Provide exactly 4 study recommendations in this JSON format (no markdown, just raw JSON):
{
  "recommendations": [
    {
      "id": 1,
      "title": "Short action title",
      "description": "2-3 sentence personalized advice based on their specific data",
      "priority": "high|medium|low",
      "category": "emotional|academic|strategy|wellbeing",
      "actionItems": ["specific action 1", "specific action 2"],
      "emotionInsight": "One sentence connecting their emotion pattern to this recommendation"
    }
  ],
  "overallInsight": "2 sentence summary of the student's emotional-academic profile",
  "emotionalHealthScore": 75
}`;

      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      });

      let aiResponse = completion.choices[0].message.content.trim();
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const attemptParsed = JSON.parse(aiResponse);
      // Only use AI response if it has valid recommendations
      if (attemptParsed?.recommendations?.length > 0) {
        parsed = attemptParsed;
      }
    } catch (aiErr) {
      console.warn('⚠️ Groq AI failed, using fallback recommendations:', aiErr.message);
      // parsed stays as fallbackParsed
    }

    return res.json({
      ...parsed,
      hasData: true,
      dataPoints: {
        quizzesAnalyzed: attempts.length,
        emotionLogsAnalyzed: totalEmotions,
        avgScore: Math.round(avgScore),
        dominantEmotion,
        totalHints
      }
    });

  } catch (error) {
    console.error('❌ Study recommendation error:', error);
    return res.status(500).json({ 
      message: 'Failed to generate recommendations', 
      error: error.message 
    });
  }
};