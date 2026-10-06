import HintUsage from '../models/hintUsage.js';
import { getHfClient } from '../services/hfClient.js';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';           // ✅ FIX: was missing
import QuizAttempt from '../models/quizAttempt.js'; // ✅ FIX: was missing
import Student from '../models/student.js';         // ✅ FIX: use Student not users collection

// ── Feature 2: Effort-based deduction helpers ──────────────────────
const calculateEffortDeduction = (timeSpentSeconds, previousAttempts) => {
  let deduction = 2;
  if (timeSpentSeconds < 10)       deduction = 3;
  else if (timeSpentSeconds < 30)  deduction = 2.5;
  else if (timeSpentSeconds < 60)  deduction = 2;
  else if (timeSpentSeconds < 120) deduction = 1.5;
  else                             deduction = 1;
  if (previousAttempts >= 2) deduction = Math.max(0.5, deduction - 0.5);
  if (previousAttempts >= 3) deduction = Math.max(0.5, deduction - 0.5);
  return Math.round(deduction * 10) / 10;
};

const getEffortLevel = (timeSpentSeconds, previousAttempts) => {
  if (timeSpentSeconds < 10 && previousAttempts === 0) return 'none';
  if (timeSpentSeconds < 30)  return 'minimal';
  if (timeSpentSeconds < 60)  return 'some';
  if (timeSpentSeconds < 120) return 'good';
  return 'strong';
};

const getFallbackSocraticHints = () => [
  'What do you already know about the core concept being tested here?',
  'If you had to explain this topic to a friend in one sentence, what would you say?',
  'Which options can you confidently eliminate based on what you know, and why?',
  'What specific knowledge gap is making this question difficult for you?'
];

const generateSocraticHints = async (questionText, options, previousAttempts) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ No GROQ_API_KEY — using fallback hints');
    return getFallbackSocraticHints();
  }
  const groq = new Groq({ apiKey });

  const optionsText = options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(', ');

  const prompt = `You are a Socratic tutor. STRICTLY FORBIDDEN: revealing the answer, naming which option is correct, or giving factual explanations.
You MUST respond with EXACTLY 4 reflective questions that make the student think, NOT tell them the answer.
Student attempt #${previousAttempts + 1}.
Question: "${questionText}"
Options: ${optionsText}
Format EXACTLY like this (nothing else):
Q1: [broad question about the concept]
Q2: [question about prior knowledge]
Q3: [question challenging assumptions]
Q4: [question to narrow reasoning]`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 300,
    });

    const text = completion.choices[0]?.message?.content || '';
    console.log('🧠 Groq response:', text);

    const hints = [];
    for (const line of text.split('\n')) {
      const match = line.match(/^Q\d:\s*(.+)/i);
      if (match) hints.push(match[1].trim());
    }
    if (hints.length >= 4) return hints.slice(0, 4);
    return getFallbackSocraticHints();
  } catch (err) {
    console.error('❌ Groq Socratic error:', err.message);
    return getFallbackSocraticHints();
  }
};

export const generateHint = async (req, res) => {
  try {
    console.log('📝 Hint request received');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    
    const { 
      sessionId, 
      questionId, 
      questionIndex,
      questionText, 
      options, 
      previousAttempts = 0,
      timeSpentSeconds = 0
    } = req.body;

    const userId = req.user?._id || req.user?.id || req.body.userId;
    console.log('✅ Using userId:', userId);

    if (!userId || !sessionId || !questionId || !questionText || !options) {
      console.error('❌ Missing fields:', {
        userId: !!userId,
        sessionId: !!sessionId,
        questionId: !!questionId,
        questionText: !!questionText,
        options: !!options
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, sessionId, questionId, questionText, options'
      });
    }

    const existingHint = await HintUsage.findOne({ userId, sessionId, questionId });

    if (existingHint) {
      const storedHints = existingHint.hintText.split(' | ').filter(h => h.trim());
      console.log('📦 Returning cached hints:', storedHints);
      return res.status(200).json({
        success: true,
        data: {
          hints: storedHints.length > 0 ? storedHints : [existingHint.hintText],
          deduction: existingHint.deduction,
          effortLevel: existingHint.effortLevel || 'unknown',
          alreadyRequested: true,
          hintType: 'socratic'
        }
      });
    }

    console.log('🔑 Checking HF API client...');
    const hfClient = getHfClient();
    
    if (!hfClient) {
      console.error('❌ HF Client is null - using fallback hints');
      const deduction = calculateEffortDeduction(timeSpentSeconds, previousAttempts);
      const effortLevel = getEffortLevel(timeSpentSeconds, previousAttempts);
      const socraticHints = await generateSocraticHints(questionText, options, previousAttempts);

      const hintUsage = new HintUsage({
        userId, sessionId, questionId, questionIndex,
        quizId: req.body.quizId || null,
        hintText: socraticHints.join(' | '),
        deduction, effortLevel,
        timeSpentBeforeHint: timeSpentSeconds,
        timestamp: new Date()
      });
      await hintUsage.save();
      
      return res.status(200).json({
        success: true,
        data: { hints: socraticHints, deduction, effortLevel, alreadyRequested: false, hintType: 'socratic' }
      });
    }

    console.log('✅ HF Client initialized successfully');

    const optionsText = options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n');
    const userMessage = `You are a helpful quiz tutor. Generate exactly 4 progressive hints for this multiple choice question. Make each hint more specific than the last, but don't reveal the answer.

Question: ${questionText}

Options:
${optionsText}

Provide 4 numbered hints (format: "1. hint text"):`;

    console.log('🤖 Calling Hugging Face API...');
    
    try {
      const response = await hfClient.textGeneration({
        model: 'Qwen/Qwen2.5-0.5B-Instruct',
        inputs: userMessage,
        parameters: { max_new_tokens: 300, temperature: 0.7, top_p: 0.9, return_full_text: false }
      });

      let generatedText = response?.generated_text || '';
      if (!generatedText || typeof generatedText !== 'string') {
        throw new Error('AI service returned an empty response');
      }

      const lines = generatedText.split('\n').map(line => line.trim()).filter(line => line);
      const hints = [];
      for (const line of lines) {
        const match = line.match(/^(\d+)[\.\:\-\)]\s*(.+)/);
        if (match && match[2]) hints.push(match[2].trim());
        else if (line && !line.match(/^(Question|Answer|Options?|Hint)/i)) hints.push(line);
      }

      const defaultHints = [
        'Think about the fundamental concept being tested in this question.',
        'Consider the key differences between each option carefully.',
        'Focus on the specific terminology used in the question.',
        'Review the core principles related to this topic.'
      ];

      let finalHints = hints.length >= 4 ? hints.slice(0, 4) : hints.length > 0
        ? [...hints, ...defaultHints.slice(hints.length)]
        : defaultHints;

      const deduction = calculateEffortDeduction(timeSpentSeconds, previousAttempts);
      const effortLevel = getEffortLevel(timeSpentSeconds, previousAttempts);
      const socraticHints = await generateSocraticHints(questionText, options, previousAttempts);
      const finalSocraticHints = socraticHints.length >= 4 ? socraticHints : finalHints;

      const hintUsage = new HintUsage({
        userId, sessionId, questionId, questionIndex,
        quizId: req.body.quizId || null,
        hintText: finalSocraticHints.join(' | '),
        deduction, effortLevel,
        timeSpentBeforeHint: timeSpentSeconds,
        timestamp: new Date()
      });
      await hintUsage.save();

      return res.status(200).json({
        success: true,
        data: { hints: finalSocraticHints, deduction, effortLevel, alreadyRequested: false, hintType: 'socratic' }
      });

    } catch (apiError) {
      console.error('❌ Hugging Face API Error:', apiError.message);
      const deduction = calculateEffortDeduction(timeSpentSeconds, previousAttempts);
      const effortLevel = getEffortLevel(timeSpentSeconds, previousAttempts);
      const socraticHints = await generateSocraticHints(questionText, options, previousAttempts);

      const hintUsage = new HintUsage({
        userId, sessionId, questionId, questionIndex,
        quizId: req.body.quizId || null,
        hintText: socraticHints.join(' | '),
        deduction, effortLevel,
        timeSpentBeforeHint: timeSpentSeconds,
        timestamp: new Date()
      });
      await hintUsage.save();

      return res.status(200).json({
        success: true,
        data: { hints: socraticHints, deduction, effortLevel, alreadyRequested: false, hintType: 'socratic' }
      });
    }

  } catch (error) {
    console.error('💥 Hint generation error:', error.message);
    return res.status(500).json({ success: false, message: 'Error generating hint', error: error.message });
  }
};

export const getHintsUsed = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const hints = await HintUsage.find({ sessionId });
    const totalDeduction = hints.reduce((sum, hint) => sum + hint.deduction, 0);

    res.status(200).json({
      success: true,
      data: {
        hintsUsed: hints.length,
        totalDeduction,
        hints: hints.map(h => ({
          questionIndex: h.questionIndex,
          hint: h.hintText,
          timestamp: h.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching hints:', error);
    res.status(500).json({ success: false, message: 'Error fetching hints', error: error.message });
  }
};

export const getEffortAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const hints = await HintUsage.find({ userId: studentId }).sort({ timestamp: -1 });

    const effortBreakdown = { none: 0, minimal: 0, some: 0, good: 0, strong: 0, unknown: 0 };
    let totalDeduction = 0;
    let totalTime = 0;

    hints.forEach(h => {
      effortBreakdown[h.effortLevel || 'unknown']++;
      totalDeduction += h.deduction;
      totalTime += h.timeSpentBeforeHint || 0;
    });

    const avgTime = hints.length > 0 ? Math.round(totalTime / hints.length) : 0;
    const effortScore = Math.min(100, Math.round(
      (avgTime / 120) * 50 +
      ((effortBreakdown.good + effortBreakdown.strong) / Math.max(hints.length, 1)) * 50
    ));

    res.status(200).json({
      success: true,
      data: { totalHintsRequested: hints.length, totalDeduction, avgTimeBeforeHint: avgTime, effortScore, effortBreakdown }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching effort analytics', error: error.message });
  }
};

export const getClassEffortAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;

    // ✅ FIX: Validate quizId before converting
    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: 'Invalid quizId' });
    }

    const quizObjectId = new mongoose.Types.ObjectId(quizId);

    const attempts = await QuizAttempt.find({ quizId: quizObjectId })
      .select('sessionId userId')
      .lean();

    const sessionIds = attempts.map(a => a.sessionId).filter(Boolean);
    const sessionToUser = {};
    attempts.forEach(a => {
      if (a.sessionId) sessionToUser[a.sessionId] = a.userId?.toString();
    });

    console.log(`🔍 Quiz ${quizId}: ${attempts.length} attempts, ${sessionIds.length} sessions`);

    if (sessionIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { totalHintEvents: 0, questionEffortMap: [], rawHints: [] }
      });
    }

    const hints = await HintUsage.find({
      $or: [
        { sessionId: { $in: sessionIds } },
        { quizId: quizObjectId }
      ]
    }).lean().sort({ questionIndex: 1 });

    console.log(`🔍 Found ${hints.length} hints for quiz ${quizId}`);

    const enrichedHints = hints.map(h => ({
      ...h,
      resolvedUserId: h.userId?.toString() || sessionToUser[h.sessionId] || null
    }));

    // ✅ FIX: Use Student model instead of raw users collection
    const userIdStrings = [...new Set(enrichedHints.map(h => h.resolvedUserId).filter(Boolean))];
    const userObjectIds = userIdStrings
      .map(id => { try { return new mongoose.Types.ObjectId(id); } catch { return null; } })
      .filter(Boolean);

    const studentDocs = await Student.find({ _id: { $in: userObjectIds } })
      .select('_id name').lean();

    const userMap = {};
    studentDocs.forEach(s => { userMap[s._id.toString()] = s.name; });

    const byQuestion = {};
    enrichedHints.forEach(h => {
      const qIdx = h.questionIndex ?? 0;
      if (!byQuestion[qIdx]) byQuestion[qIdx] = { hintsRequested: 0, efforts: [] };
      byQuestion[qIdx].hintsRequested++;
      byQuestion[qIdx].efforts.push(h.effortLevel || 'unknown');
    });

    const questionEffortMap = Object.entries(byQuestion).map(([qIdx, data]) => ({
      questionIndex: parseInt(qIdx),
      hintsRequested: data.hintsRequested,
      effortDistribution: data.efforts.reduce((acc, e) => {
        acc[e] = (acc[e] || 0) + 1;
        return acc;
      }, {})
    })).sort((a, b) => a.questionIndex - b.questionIndex);

    res.status(200).json({
      success: true,
      data: {
        totalHintEvents: enrichedHints.length,
        questionEffortMap,
        rawHints: enrichedHints.map(h => ({
          studentName: userMap[h.resolvedUserId] || 'Unknown',
          questionIndex: h.questionIndex,
          effortLevel: h.effortLevel || 'unknown',
          deduction: h.deduction,
          timeSpentBeforeHint: h.timeSpentBeforeHint
        }))
      }
    });

  } catch (error) {
    console.error('❌ getClassEffortAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching class analytics', error: error.message });
  }
};