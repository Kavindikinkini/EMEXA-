// backend/src/services/aiService.js
import axios from 'axios';

class AIService {
  constructor() {
    this.initialized = false;
    this.geminiApiKey = null;
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
  }

  // Initialize lazily to ensure env vars are loaded
  _ensureInitialized() {
    if (this.initialized) return;
    
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!this.geminiApiKey) {
      console.error('❌ CRITICAL: GEMINI_API_KEY not found in environment variables!');
      console.error('   Make sure your .env file has: GEMINI_API_KEY=your_key_here');
      throw new Error('Gemini API key not configured');
    }
    
    console.log('🤖 AI Service initialized');
    console.log('   Gemini API Key:', `✅ Present (${this.geminiApiKey.substring(0, 10)}...)`);
    console.log('   Gemini Endpoint:', this.geminiEndpoint);
    
    this.initialized = true;
  }

  /**
   * Generate quiz questions using Gemini API
   */
  async generateQuizWithGemini(subject, gradeLevel, numberOfQuestions, difficultyLevel = 'medium', topics = []) {
    this._ensureInitialized(); // Ensure initialization first
    
    console.log('🔮 Attempting Gemini API...');
    
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = this.buildQuizPrompt(subject, gradeLevel, numberOfQuestions, difficultyLevel, topics);
      
      console.log('📤 Sending request to Gemini API...');
      
      const response = await axios.post(
        `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ Gemini API response received');
      
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('❌ Invalid Gemini response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response structure from Gemini API');
      }

      const generatedText = response.data.candidates[0].content.parts[0].text;
      console.log('📝 Generated text length:', generatedText.length);
      
      const parsedQuestions = this.parseQuizResponse(generatedText);
      console.log('✅ Successfully parsed', parsedQuestions.length, 'questions');
      
      return parsedQuestions;
    } catch (error) {
      console.error('❌ Gemini API Error Details:');
      console.error('   Status:', error.response?.status);
      console.error('   Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('   Error Message:', error.message);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid request to Gemini API');
      } else if (error.response?.status === 403) {
        throw new Error('Gemini API key is invalid or access denied');
      } else if (error.response?.status === 404) {
        throw new Error('Gemini model not found - endpoint issue');
      } else if (error.response?.status === 429) {
        throw new Error('Gemini API rate limit exceeded');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out');
      }
      
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }

  /**
   * Main method
   */
  async generateQuiz(params) {
    this._ensureInitialized(); // Ensure initialization first
    
    const { subject, gradeLevel, numberOfQuestions, difficultyLevel, topics } = params;

    console.log('\n🚀 Starting AI Quiz Generation');
    console.log('   Subject:', subject);
    console.log('   Grade:', gradeLevel);
    console.log('   Questions:', numberOfQuestions);

    try {
      return await this.generateQuizWithGemini(subject, gradeLevel, numberOfQuestions, difficultyLevel, topics);
    } catch (error) {
      console.error('❌ Quiz generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for quiz generation
   */
  buildQuizPrompt(subject, gradeLevel, numberOfQuestions, difficultyLevel, topics) {
    const topicsText = topics && topics.length > 0 ? `focusing on: ${topics.join(', ')}` : '';
    
    return `You are an expert educational content creator. Generate ${numberOfQuestions} multiple-choice quiz questions for ${gradeLevel} students studying ${subject} ${topicsText}.

Requirements:
- Difficulty level: ${difficultyLevel}
- Each question must have exactly 4 options (A, B, C, D)
- Mark the correct answer clearly
- Include a brief explanation for each correct answer
- Questions should be age-appropriate and curriculum-aligned

Format your response EXACTLY as follows:

QUESTION 1: [Write the question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]
HINT: [Optional helpful hint]

QUESTION 2: [Write the question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]
HINT: [Optional helpful hint]

[Continue for all ${numberOfQuestions} questions]

Important: Follow this exact format without any additional text or markdown formatting.`;
  }

  /**
   * Parse AI response into structured quiz data
   */
  parseQuizResponse(responseText) {
    console.log('🔍 Parsing AI response...');
    
    const questions = [];
    
    // Clean up response text
    let cleanedText = responseText
      .replace(/```[\w]*\n/g, '')
      .replace(/```/g, '')
      .trim();
    
    const questionBlocks = cleanedText.split(/QUESTION \d+:/i).filter(block => block.trim());
    
    console.log('   Found', questionBlocks.length, 'question blocks');

    for (let i = 0; i < questionBlocks.length; i++) {
      try {
        const block = questionBlocks[i];
        const lines = block.trim().split('\n').filter(line => line.trim());
        
        if (lines.length === 0) continue;
        
        const questionText = lines[0].trim();
        
        const options = [];
        const optionRegex = /^([A-D])\)\s*(.+)$/i;
        
        for (const line of lines) {
          const match = line.match(optionRegex);
          if (match) {
            options.push({
              id: options.length + 1,
              text: match[2].trim(),
              isCorrect: false
            });
          }
        }

        const correctLine = lines.find(line => line.match(/^CORRECT:/i));
        const correctAnswer = correctLine ? correctLine.replace(/^CORRECT:/i, '').trim().toUpperCase().charAt(0) : null;

        if (correctAnswer && correctAnswer.match(/[A-D]/)) {
          const correctIndex = correctAnswer.charCodeAt(0) - 65;
          if (options[correctIndex]) {
            options[correctIndex].isCorrect = true;
          }
        }

        const explanationLine = lines.find(line => line.match(/^EXPLANATION:/i));
        const explanation = explanationLine ? explanationLine.replace(/^EXPLANATION:/i, '').trim() : '';

        const hintLine = lines.find(line => line.match(/^HINT:/i));
        const hint = hintLine ? hintLine.replace(/^HINT:/i, '').trim() : '';

        if (questionText && options.length === 4 && correctAnswer) {
          questions.push({
            type: 'mcq',
            questionText,
            options,
            hints: [hint || 'Think carefully about the key concepts.', '', '', ''],
            explanation
          });
          console.log(`   ✅ Parsed question ${i + 1}`);
        }
      } catch (error) {
        console.error(`   ❌ Error parsing question ${i + 1}:`, error.message);
      }
    }

    if (questions.length === 0) {
      throw new Error('Failed to parse any valid questions from AI response');
    }

    console.log(`✅ Successfully parsed ${questions.length} questions`);
    return questions;
  }

  /**
   * Enhance existing questions with AI suggestions
   */
  async enhanceQuestion(questionData) {
    this._ensureInitialized(); // Ensure initialization first
    
    try {
      const prompt = `Improve this quiz question:

Question: ${questionData.questionText}
Options: ${questionData.options.map(opt => `${String.fromCharCode(65 + opt.id - 1)}) ${opt.text}`).join('\n')}

Provide:
IMPROVED_QUESTION: [question]
HINT: [hint]
EXPLANATION: [explanation]`;

      const response = await axios.post(
        `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      const result = response.data.candidates[0].content.parts[0].text;
      
      const improvedQuestion = result.match(/IMPROVED_QUESTION:\s*(.+?)(?=HINT:)/s)?.[1]?.trim();
      const hint = result.match(/HINT:\s*(.+?)(?=EXPLANATION:)/s)?.[1]?.trim();
      const explanation = result.match(/EXPLANATION:\s*(.+?)$/s)?.[1]?.trim();

      return {
        improvedQuestion: improvedQuestion || questionData.questionText,
        hint: hint || questionData.hints?.[0] || '',
        explanation: explanation || ''
      };
    } catch (error) {
      console.error('Error enhancing question:', error);
      throw new Error('Failed to enhance question');
    }
  }

  /**
   * Get AI generation suggestions
   */
  async getGenerationSuggestions(subject, gradeLevel) {
    // Return simple suggestions without AI call
    return {
      recommendedQuestions: 5,
      topicSuggestions: [
        'Introduction to ' + subject,
        'Basic concepts',
        'Advanced topics',
        'Real-world applications'
      ]
    };
  }
}

export default new AIService();