import mongoose from 'mongoose';
import TeacherQuiz from '../models/teacherQuiz.js';
import QuizAttempt from '../models/quizAttempt.js';
import Groq from 'groq-sdk';

export const getDistractorAnalysis = async (req, res) => {
  try {
    const quizId = req.params.id || req.params.quizId;

    console.log('🎯 Distractor analysis for:', quizId);
    console.log('🎯 DB name:', mongoose.connection.db?.databaseName);

    // Raw lookup to bypass model layer
    const raw = await mongoose.connection.db
      .collection('teacherquizzes')
      .findOne({ _id: new mongoose.Types.ObjectId(quizId) });
    console.log('🎯 Raw lookup:', raw ? raw.title : 'NOT FOUND');

    const quiz = await TeacherQuiz.findById(quizId);
    console.log('🎯 Model lookup:', quiz ? quiz.title : 'NOT FOUND');

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const attempts = await QuizAttempt.find({ quizId })
  .populate({ path: 'userId', select: 'name email', model: 'User' });

  const Student = (await import('../models/student.js')).default;
const studentIds = attempts
  .filter(a => !a.userId?.name)
  .map(a => a.userId?._id || a.userId)
  .filter(Boolean);

const students = await Student.find({ _id: { $in: studentIds } })
  .select('name email')
  .lean();

const studentMap = {};
students.forEach(s => { studentMap[String(s._id)] = s.name; });

    if (attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          quizTitle: quiz.title,
          totalAttempts: 0,
          questions: [],
          message: 'No attempts yet — distractor analysis will appear once students complete this quiz.'
        }
      });
    }

    const questionResults = [];

    for (let qIdx = 0; qIdx < quiz.questions.length; qIdx++) {
      const question = quiz.questions[qIdx];
      const questionId = String(qIdx + 1);

      if (question.type !== 'mcq') continue;

      const optionCounts = {};
      question.options.forEach((_, i) => {
        optionCounts[i] = { count: 0, students: [] };
      });

      let totalAnswered = 0;

      for (const attempt of attempts) {
        const answerEntry = attempt.answers?.find(
          a => String(a.questionId) === questionId
        );
        if (!answerEntry) continue;

        const selectedIdx = Number(answerEntry.selectedAnswer);
        if (isNaN(selectedIdx)) continue;
        if (optionCounts[selectedIdx] === undefined) continue;

        if (!answerEntry.isCorrect) {
          const studentName = attempt.userId?.name 
            || studentMap[String(attempt.userId?._id || attempt.userId)] 
            || 'Unknown Student';
          optionCounts[selectedIdx].count++;
          optionCounts[selectedIdx].students.push(studentName);
        }
        totalAnswered++;
      }

      const correctIdx = question.options.findIndex(o => o.isCorrect);
      const distractors = [];

      for (let i = 0; i < question.options.length; i++) {
        if (i === correctIdx) continue;
        if (optionCounts[i].count === 0) continue;

        distractors.push({
          optionIndex: i,
          optionText: question.options[i].text,
          chosenByCount: optionCounts[i].count,
          chosenByStudents: optionCounts[i].students,
          misconception: null
        });
      }

      distractors.sort((a, b) => b.chosenByCount - a.chosenByCount);

      if (distractors.length > 0) {
        try {
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
          const distractorList = distractors
            .map((d, i) => `${i + 1}. "${d.optionText}" — chosen by ${d.chosenByCount} student(s)`)
            .join('\n');

          const prompt = `You are an educational psychologist analysing student quiz errors.

Question: "${question.questionText}"
Correct answer: "${question.options[correctIdx].text}"

Wrong answers students chose:
${distractorList}

For each wrong answer, write exactly one sentence explaining the likely misconception or reasoning error that caused students to choose it. Be specific and pedagogically useful for a teacher.

Respond in JSON only, no markdown, no explanation outside the JSON. Format:
{"misconceptions": ["sentence for option 1", "sentence for option 2", ...]}`;

          const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            max_tokens: 400,
          });

          const raw = completion.choices[0]?.message?.content?.trim() || '{}';
          const cleaned = raw.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          const misconceptions = parsed.misconceptions || [];

          distractors.forEach((d, i) => {
            d.misconception = misconceptions[i] || 'No explanation available.';
          });
        } catch (aiError) {
          console.error(`⚠️ Groq error for question ${qIdx + 1}:`, aiError.message);
          distractors.forEach(d => {
            d.misconception = 'AI analysis unavailable — check Groq API key.';
          });
        }
      }

      questionResults.push({
        questionIndex: qIdx,
        questionText: question.questionText,
        correctAnswer: question.options[correctIdx]?.text || '',
        totalAnswered,
        distractors
      });
    }

    res.json({
      success: true,
      data: {
        quizTitle: quiz.title,
        totalAttempts: attempts.length,
        questions: questionResults
      }
    });

  } catch (error) {
    console.error('Distractor analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};