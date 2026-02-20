import HintUsage from '../models/hintUsage.js';  // ✅ ADD THIS LINE
import { getHfClient } from '../services/hfClient.js';

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
      previousAttempts = 0 
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
          alreadyRequested: true
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
      
      const hintUsage = new HintUsage({
        userId,
        sessionId,
        questionId,
        questionIndex,
        hintText: fallbackHints.join(' | '),
        deduction: 1,
        timestamp: new Date()
      });
      
      await hintUsage.save();
      
      return res.status(200).json({
        success: true,
        data: {
          hints: fallbackHints,
          deduction: 1,
          alreadyRequested: false,
          usedFallback: true
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
      const hintUsage = new HintUsage({
        userId,
        sessionId,
        questionId,
        questionIndex,
        hintText: finalHints.join(' | '),
        deduction: 1,
        timestamp: new Date()
      });

      await hintUsage.save();
      console.log('✅ Hint saved successfully');

      return res.status(200).json({
        success: true,
        data: {
          hints: finalHints,
          deduction: 1,
          alreadyRequested: false
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
      
      console.log('⚠️ Using fallback hints due to API error');
      
      // Still save to database even with fallback
      const hintUsage = new HintUsage({
        userId,
        sessionId,
        questionId,
        questionIndex,
        hintText: fallbackHints.join(' | '),
        deduction: 1,
        timestamp: new Date()
      });
      
      await hintUsage.save();
      
      return res.status(200).json({
        success: true,
        data: {
          hints: fallbackHints,
          deduction: 1,
          alreadyRequested: false,
          usedFallback: true
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