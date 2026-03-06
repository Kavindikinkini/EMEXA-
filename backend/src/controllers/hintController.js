import HintUsage from '../models/hintUsage.js';
import { getHfClient } from '../services/hfClient.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// ── Feature 1: Gemini Socratic hint generator ──────────────────────
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('🔑 GEMINI_API_KEY present:', !!apiKey, apiKey ? `(starts with: ${apiKey.substring(0,8)}...)` : '(MISSING)');
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

const getFallbackSocraticHints = () => [
  'What do you already know about the core concept being tested here?',
  'If you had to explain this topic to a friend in one sentence, what would you say?',
  'Which options can you confidently eliminate based on what you know, and why?',
  'What specific knowledge gap is making this question difficult for you?'
];

const generateSocraticHints = async (questionText, options, previousAttempts) => {
  const gemini = getGeminiClient();
  if (!gemini) return getFallbackSocraticHints();

  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const hints = [];
    for (const line of text.split('\n')) {
      const match = line.match(/^Q\d:\s*(.+)/i);
      if (match) hints.push(match[1].trim());
    }
    if (hints.length >= 4) return hints.slice(0, 4);
    return getFallbackSocraticHints();
  } catch (err) {
    if (err.message.includes('429') || err.message.includes('quota')) {
      console.warn('⚠️ Gemini quota exceeded — using fallback Socratic hints');
    } else {
      console.error('Gemini Socratic error:', err.message);
    }
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

    // Get userId from authenticated user or request body
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

    // Check if hint already requested for this question in this session
    const existingHint = await HintUsage.findOne({ 
      userId, 
      sessionId, 
      questionId 
    });

    if (existingHint) {
      // Parse stored hints (separated by |)
      const storedHints = existingHint.hintText.split(' | ').filter(h => h.trim());
      console.log('📦 Returning cached hints:', storedHints);
      console.log('📦 Cached hints count:', storedHints.length);
      
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

    // Check if HF_API_KEY is available
    console.log('🔑 Checking HF API client...');
    const hfClient = getHfClient();
    
    if (!hfClient) {
      console.error('❌ HF Client is null - using fallback hints');
      
      // Use fallback hints if API is not available
      const fallbackHints = [
        'Think about the fundamental concept being tested in this question.',
        'Consider the key differences between each option carefully.',
        'Focus on the specific terminology used in the question.',
        'Review the core principles related to this topic.'
      ];
      
      
      const deduction = calculateEffortDeduction(timeSpentSeconds, previousAttempts);
      const effortLevel = getEffortLevel(timeSpentSeconds, previousAttempts);

      // No HF key — use Gemini Socratic hints directly
      const socraticHints = await generateSocraticHints(questionText, options, previousAttempts);

      const hintUsage = new HintUsage({
        userId,
        sessionId,
        questionId,
        questionIndex,
        quizId: req.body.quizId || null,
        hintText: socraticHints.join(' | '),
        deduction,
        effortLevel,
        timeSpentBeforeHint: timeSpentSeconds,
        timestamp: new Date()
      });
      
      await hintUsage.save();
      
      return res.status(200).json({
        success: true,
        data: {
          hints: socraticHints,
          deduction,
          effortLevel,
          alreadyRequested: false,
          hintType: 'socratic'
        }
      });
    }

    console.log('✅ HF Client initialized successfully');

    // Prepare prompt for Hugging Face
    const optionsText = options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join('\n');
    
    // Simplified prompt for better results
    const userMessage = `You are a helpful quiz tutor. Generate exactly 4 progressive hints for this multiple choice question. Make each hint more specific than the last, but don't reveal the answer.

Question: ${questionText}

Options:
${optionsText}

Provide 4 numbered hints (format: "1. hint text"):`;

    console.log('🤖 Calling Hugging Face API...');
    console.log('📝 Using model: Qwen/Qwen2.5-0.5B-Instruct');
    
    try {
      // Use textGeneration instead of chatCompletion for better compatibility
      const response = await hfClient.textGeneration({
        model: 'Qwen/Qwen2.5-0.5B-Instruct',
        inputs: userMessage,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      });

      console.log('✅ HF API response received:', response);

      let generatedText = response?.generated_text || '';

      if (!generatedText || typeof generatedText !== 'string') {
        console.error('⚠️ Hugging Face response missing content:', response);
        throw new Error('AI service returned an empty response');
      }

      console.log('📄 Generated text:', generatedText);
      
      // Parse the hints - extract 4 numbered hints
      const lines = generatedText.split('\n').map(line => line.trim()).filter(line => line);
      const hints = [];
      
      // Extract numbered hints (1., 2., 3., 4.)
      for (const line of lines) {
        // Match patterns like "1.", "1:", "1 -", etc
        const match = line.match(/^(\d+)[\.\:\-\)]\s*(.+)/);
        if (match && match[2]) {
          hints.push(match[2].trim());
        } else if (line && !line.match(/^(Question|Answer|Options?|Hint)/i)) {
          // Also accept non-numbered lines as hints
          hints.push(line);
        }
      }
      
      console.log('📋 Extracted hints:', hints);
      
      // Fallback hints if parsing fails
      const defaultHints = [
        'Think about the fundamental concept being tested in this question.',
        'Consider the key differences between each option carefully.',
        'Focus on the specific terminology used in the question.',
        'Review the core principles related to this topic.'
      ];
      
      // Ensure we have exactly 4 hints
      let finalHints = [];
      if (hints.length >= 4) {
        finalHints = hints.slice(0, 4);
      } else if (hints.length > 0) {
        // Use what we got and fill the rest with defaults
        finalHints = [...hints];
        while (finalHints.length < 4) {
          finalHints.push(defaultHints[finalHints.length]);
        }
      } else {
        // Use all defaults if no hints were extracted
        finalHints = defaultHints;
      }
      
      console.log('✅ Final 4 hints:', finalHints);
      console.log('📊 Hints count:', finalHints.length);

      // Save hint usage to database
      console.log('💾 Saving hint usage to database...');
      const deduction = calculateEffortDeduction(timeSpentSeconds, previousAttempts);
      const effortLevel = getEffortLevel(timeSpentSeconds, previousAttempts);

      // Feature 1: Generate Socratic hints via Gemini (wraps HF hints)
      const socraticHints = await generateSocraticHints(questionText, options, previousAttempts);
      const finalSocraticHints = socraticHints.length >= 4 ? socraticHints : finalHints;

      const hintUsage = new HintUsage({
        userId,
        sessionId,
        questionId,
        questionIndex,
        quizId: req.body.quizId || null,    // ← ADD THIS
        hintText: finalSocraticHints.join(' | '),
        deduction,
        effortLevel,
        timeSpentBeforeHint: timeSpentSeconds,
        timestamp: new Date()
      });

      await hintUsage.save();
      console.log('✅ Hint saved successfully');

      return res.status(200).json({
        success: true,
        data: {
          hints: finalSocraticHints,
          deduction,
          effortLevel,
          alreadyRequested: false,
          hintType: 'socratic'
        }
      });

    } catch (apiError) {
      console.error('❌ Hugging Face API Error:', apiError);
      console.error('Error name:', apiError.name);
      console.error('Error message:', apiError.message);
      console.error('Error stack:', apiError.stack);
      
      // Return fallback hints on API error
      const fallbackHints = [
        'Think about the fundamental concept being tested in this question.',
        'Consider the key differences between each option carefully.',
        'Focus on the specific terminology used in the question.',
        'Review the core principles related to this topic.'
      ];
      
      console.log('⚠️ HF failed — using Gemini Socratic hints instead');
      
      const deduction = calculateEffortDeduction(timeSpentSeconds, previousAttempts);
      const effortLevel = getEffortLevel(timeSpentSeconds, previousAttempts);

      // Use Gemini Socratic hints as primary fallback
      const socraticHints = await generateSocraticHints(questionText, options, previousAttempts);

      const hintUsage = new HintUsage({
        userId,
        sessionId,
        questionId,
        questionIndex,
        quizId: req.body.quizId || null,
        hintText: socraticHints.join(' | '),
        deduction,
        effortLevel,
        timeSpentBeforeHint: timeSpentSeconds,
        timestamp: new Date()
      });
      
      await hintUsage.save();
      
      return res.status(200).json({
        success: true,
        data: {
          hints: socraticHints,
          deduction,
          effortLevel,
          alreadyRequested: false,
          hintType: 'socratic'
        }
      });
    }

  } catch (error) {
    console.error('💥 Hint generation error:', error);
    console.error('📋 Error stack:', error.stack);
    console.error('📋 Error message:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error generating hint',
      error: error.message
    });
  }
};

// Get total hints used in a session
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
    res.status(500).json({
      success: false,
      message: 'Error fetching hints',
      error: error.message
    });
  }
};

// ── Feature 2: Per-student effort analytics (Teacher view) ──────────
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
      data: {
        totalHintsRequested: hints.length,
        totalDeduction,
        avgTimeBeforeHint: avgTime,
        effortScore,
        effortBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching effort analytics', error: error.message });
  }
};

// ── Feature 3 support: Class-wide hint analytics (Teacher view) ──────
export const getClassEffortAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;
    const hints = await HintUsage.find({ quizId })
      .populate('userId', 'name email')
      .sort({ questionIndex: 1 });

    const byQuestion = {};
    hints.forEach(h => {
      const qIdx = h.questionIndex;
      if (!byQuestion[qIdx]) byQuestion[qIdx] = { hintsRequested: 0, efforts: [] };
      byQuestion[qIdx].hintsRequested++;
      byQuestion[qIdx].efforts.push(h.effortLevel);
    });

    const questionEffortMap = Object.entries(byQuestion).map(([qIdx, data]) => ({
      questionIndex: parseInt(qIdx),
      hintsRequested: data.hintsRequested,
      effortDistribution: data.efforts.reduce((acc, e) => {
        acc[e] = (acc[e] || 0) + 1; return acc;
      }, {})
    }));

    res.status(200).json({
      success: true,
      data: {
        totalHintEvents: hints.length,
        questionEffortMap,
        rawHints: hints.map(h => ({
          studentId: h.userId?._id,
          studentName: h.userId?.name,
          questionIndex: h.questionIndex,
          effortLevel: h.effortLevel,
          deduction: h.deduction,
          timeSpentBeforeHint: h.timeSpentBeforeHint
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching class analytics', error: error.message });
  }
};