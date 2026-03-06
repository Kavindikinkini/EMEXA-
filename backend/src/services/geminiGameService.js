// backend/src/services/geminiGameService.js
import axios from 'axios';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

const questionCache = new Map();
const getCacheKey = (subject, difficulty, count) => `${subject}_${difficulty}_${count}`;

const getApiKey = () => {
  const key = process.env.GEMINI_GAME_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  return key;
};

export const generateTriviaQuestions = async (subject, difficulty, count = 5) => {
  const cacheKey = getCacheKey(subject, difficulty, count);
  if (questionCache.has(cacheKey)) {
    console.log('📦 Returning cached trivia questions for:', cacheKey);
    return questionCache.get(cacheKey);
  }
  try {
    const prompt = `Generate ${count} multiple choice trivia questions about ${subject} at ${difficulty} difficulty level.
Format the response as a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation why this is correct",
    "funFact": "An interesting related fact"
  }
]
Requirements:
- Questions should be educational and accurate
- ${difficulty === 'easy' ? 'Use simple concepts and clear language' : difficulty === 'medium' ? 'Use moderate complexity' : 'Use advanced concepts'}
- Each question should have 4 options
- Include diverse topics within ${subject}
- Make it engaging and fun for students
Return ONLY the JSON array, no other text.`;

    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${getApiKey()}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const text = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response format from Gemini');

    const questions = JSON.parse(jsonMatch[0]);
    questionCache.set(cacheKey, questions);
    return questions;
  } catch (error) {
    console.error('Error generating trivia questions:', error);
    throw error;
  }
};

export const generateMemoryPairs = async (subject, difficulty, count = 8) => {
  const cacheKey = `memory_${getCacheKey(subject, difficulty, count)}`;
  if (questionCache.has(cacheKey)) {
    console.log('📦 Returning cached memory pairs for:', cacheKey);
    return questionCache.get(cacheKey);
  }
  try {
    const prompt = `Generate ${count} term-definition pairs for a memory matching game about ${subject} at ${difficulty} difficulty level.
Format the response as a JSON array:
[
  {
    "term": "Scientific term or concept",
    "definition": "Clear, concise definition",
    "category": "Subcategory within ${subject}"
  }
]
Requirements:
- Terms should be relevant to ${subject}
- Definitions should be brief (1-2 sentences max)
- ${difficulty === 'easy' ? 'Use basic terminology' : difficulty === 'medium' ? 'Use moderate terminology' : 'Use advanced terminology'}
- Make definitions clear and unambiguous
Return ONLY the JSON array, no other text.`;

    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${getApiKey()}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const text = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response format from Gemini');

    const pairs = JSON.parse(jsonMatch[0]);
    questionCache.set(cacheKey, pairs);
    return pairs;
  } catch (error) {
    console.error('Error generating memory pairs:', error);
    throw error;
  }
};

export const generateWordScrambles = async (subject, difficulty, count = 10) => {
  const cacheKey = `words_${getCacheKey(subject, difficulty, count)}`;
  if (questionCache.has(cacheKey)) {
    console.log('📦 Returning cached word scrambles for:', cacheKey);
    return questionCache.get(cacheKey);
  }
  try {
    const prompt = `Generate ${count} scientific/academic terms related to ${subject} for a word scramble game at ${difficulty} difficulty level.
Format the response as a JSON array:
[
  {
    "word": "SCIENTIFIC_TERM",
    "hint": "Brief hint about the term",
    "definition": "Full definition",
    "category": "Subcategory"
  }
]
Requirements:
- Words should be ${difficulty === 'easy' ? '5-8 letters' : difficulty === 'medium' ? '8-12 letters' : '12+ letters'}
- Terms must be relevant to ${subject}
- Hints should help without giving it away
- Use proper scientific terminology
Return ONLY the JSON array, no other text.`;

    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${getApiKey()}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const text = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response format from Gemini');

    const words = JSON.parse(jsonMatch[0]);
    questionCache.set(cacheKey, words);
    return words;
  } catch (error) {
    console.error('Error generating word scrambles:', error);
    throw error;
  }
};

export const generateGameFeedback = async (gameType, score, totalQuestions, timeSpent) => {
  try {
    const percentage = (score / totalQuestions) * 100;
    const performance = percentage >= 90 ? 'excellent' : percentage >= 70 ? 'good' : percentage >= 50 ? 'fair' : 'needs improvement';

    const prompt = `Generate encouraging and educational feedback for a student who just played a ${gameType} game.
Performance:
- Score: ${score}/${totalQuestions} (${percentage.toFixed(1)}%)
- Performance Level: ${performance}
- Time Spent: ${timeSpent} seconds
Generate a JSON response with:
{
  "message": "Personalized encouraging message (2-3 sentences)",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "encouragement": "Motivational statement"
}
Requirements:
- Be positive and encouraging
- Provide constructive tips for improvement
- Acknowledge their effort
- Keep it brief and student-friendly
Return ONLY the JSON object, no other text.`;

    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${getApiKey()}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return {
        message: "Great effort! Keep practicing to improve your score.",
        tips: ["Review the topics you found challenging", "Try playing at different difficulty levels", "Take your time to read each question carefully"],
        encouragement: "Every game makes you smarter! Keep learning!"
      };
    }

    const text = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        message: "Great effort! Keep practicing to improve your score.",
        tips: ["Review the topics you found challenging", "Try playing at different difficulty levels", "Take your time to read each question carefully"],
        encouragement: "Every game makes you smarter! Keep learning!"
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating game feedback:', error);
    return {
      message: "Well done on completing the game!",
      tips: ["Practice makes perfect", "Review your incorrect answers", "Challenge yourself with harder levels"],
      encouragement: "Keep up the great work!"
    };
  }
};