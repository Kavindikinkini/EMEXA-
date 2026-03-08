// backend/src/controllers/selfReflectionController.js
import SelfReflection from '../models/selfReflection.js';
import QuizAttempt from '../models/quizAttempt.js';
import TeacherQuiz from '../models/teacherQuiz.js';

const NEGATIVE = ['sad','angry','anxious','frustrated','confused','fear'];

const computeEmotionGap = (self, ai) => {
  if (self === ai) return 'aligned';
  const selfNeg = NEGATIVE.includes(self);
  const aiNeg   = NEGATIVE.includes(ai);
  if (!selfNeg && aiNeg)  return 'underestimated';
  if (selfNeg  && !aiNeg) return 'overestimated';
  return 'mismatched';
};

const computeAwarenessScore = (gap, confidence) => {
  const base  = { aligned: 85, overestimated: 55, underestimated: 40, mismatched: 35 }[gap] ?? 50;
  const bonus = (confidence >= 2 && confidence <= 4) ? 10 : 0;
  return Math.min(100, base + bonus);
};

const generateGapInsight = (gap, self, ai, score) => ({
  aligned:        `Great self-awareness! You correctly identified feeling ${self}, matching the AI detection. Score: ${score}/100.`,
  underestimated: `You felt ${self}, but AI detected ${ai}. You may be suppressing or not recognizing negative emotions during quizzes.`,
  overestimated:  `You reported ${self}, but AI detected ${ai}. Your actual emotional state was more positive than you thought!`,
  mismatched:     `Notable gap: you felt ${self}, but AI detected ${ai}. A great learning moment for emotional self-awareness.`
}[gap] || '');

// ── POST /api/reflections ──────────────────────────────────────────
export const submitReflection = async (req, res) => {
  try {
    const userId = req.user._id;
    const { attemptId, quizId, selfReportedEmotion, confidenceRating, effortRating, reflectionText } = req.body;

    if (!attemptId || !quizId || !selfReportedEmotion || !confidenceRating || !effortRating)
      return res.status(400).json({ message: 'Missing required fields' });

    const attempt           = await QuizAttempt.findById(attemptId);
    const aiDetectedEmotion = attempt?.emotionalSummary?.mostCommonEmotion || 'neutral';
    const emotionGap        = computeEmotionGap(selfReportedEmotion, aiDetectedEmotion);
    const awarenessScore    = computeAwarenessScore(emotionGap, confidenceRating);

    const reflection = await SelfReflection.findOneAndUpdate(
      { userId, attemptId },
      { userId, attemptId, quizId, selfReportedEmotion, confidenceRating,
        effortRating, reflectionText: reflectionText || '',
        aiDetectedEmotion, emotionGap, awarenessScore },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      reflection,
      insight: generateGapInsight(emotionGap, selfReportedEmotion, aiDetectedEmotion, awarenessScore)
    });
  } catch (error) {
    console.error('❌ Reflection error:', error);
    res.status(500).json({ message: 'Failed to save reflection', error: error.message });
  }
};

// ── GET /api/reflections/my-journal ───────────────────────────────
// ⚠️  stats fields MUST match what JournalPage.jsx reads:
//     stats.awarenessScore, stats.totalEntries, stats.emotionMatchRate, stats.avgConfidence
export const getMyJournal = async (req, res) => {
  try {
    const userId      = req.user._id;
    const reflections = await SelfReflection.find({ userId }).sort({ createdAt: -1 }).limit(20);

    if (reflections.length === 0)
      return res.json({ hasData: false, reflections: [], stats: null });

    const quizIds = [...new Set(reflections.map(r => r.quizId?.toString()))];
    const quizzes = await TeacherQuiz.find({ _id: { $in: quizIds } }).select('title');
    const quizMap = {};
    quizzes.forEach(q => { quizMap[q._id.toString()] = q.title; });

    const alignedCount     = reflections.filter(r => r.emotionGap === 'aligned').length;
    const awarenessScore   = Math.round(reflections.reduce((s, r) => s + r.awarenessScore, 0) / reflections.length);
    const emotionMatchRate = Math.round((alignedCount / reflections.length) * 100);
    const avgConfidence    = Math.round((reflections.reduce((s, r) => s + r.confidenceRating, 0) / reflections.length) * 10) / 10;

    res.json({
      hasData: true,
      reflections: reflections.map(r => ({
        ...r.toObject(),
        quizTitle: quizMap[r.quizId?.toString()] || 'Unknown Quiz',
        insight:   generateGapInsight(r.emotionGap, r.selfReportedEmotion, r.aiDetectedEmotion, r.awarenessScore)
      })),
      stats: {
        awarenessScore,    // ← JournalPage reads stats.awarenessScore
        totalEntries: reflections.length,  // ← JournalPage reads stats.totalEntries
        emotionMatchRate,  // ← JournalPage reads stats.emotionMatchRate
        avgConfidence,     // ← JournalPage reads stats.avgConfidence
        trend: awarenessScore >= 70 ? 'High metacognitive awareness'
             : awarenessScore >= 50 ? 'Developing self-awareness'
             : 'Needs self-reflection practice'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch journal', error: error.message });
  }
};

// ── GET /api/reflections/check/:attemptId ─────────────────────────
export const checkReflection = async (req, res) => {
  try {
    const userId   = req.user._id;
    const existing = await SelfReflection.findOne({ userId, attemptId: req.params.attemptId });
    res.json({ hasReflected: !!existing, reflection: existing });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check reflection', error: error.message });
  }
};

// ── GET /api/reflections/student/:userId  (teacher view) ──────────
export const getStudentJournal = async (req, res) => {
  try {
    const { userId }  = req.params;
    const reflections = await SelfReflection.find({ userId }).sort({ createdAt: -1 }).limit(20);

    const quizIds = [...new Set(reflections.map(r => r.quizId?.toString()))];
    const quizzes = await TeacherQuiz.find({ _id: { $in: quizIds } }).select('title');
    const quizMap = {};
    quizzes.forEach(q => { quizMap[q._id.toString()] = q.title; });

    const awarenessScore = reflections.length > 0
      ? Math.round(reflections.reduce((s, r) => s + r.awarenessScore, 0) / reflections.length) : 0;
    const alignedCount    = reflections.filter(r => r.emotionGap === 'aligned').length;
    const emotionMatchRate = reflections.length > 0
      ? Math.round((alignedCount / reflections.length) * 100) : 0;

    res.json({
      hasData: reflections.length > 0,
      reflections: reflections.map(r => ({
        ...r.toObject(),
        quizTitle: quizMap[r.quizId?.toString()] || 'Unknown Quiz',
        insight:   generateGapInsight(r.emotionGap, r.selfReportedEmotion, r.aiDetectedEmotion, r.awarenessScore)
      })),
      stats: { awarenessScore, totalEntries: reflections.length, emotionMatchRate }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student journal', error: error.message });
  }
};