// backend/src/controllers/aiQuizController.js
import aiService from '../services/aiService.js';
import TeacherQuiz from '../models/teacherQuiz.js';
import Teacher from '../models/teacher.js';

class aiQuizController {
  /**
   * Generate quiz using AI
   */
  async generateQuiz(req, res) {
    try {
      const teacherId = req.user.id;
      const {
        assignmentTitle,
        subject,
        gradeLevel,
        numberOfQuestions = 5,
        difficultyLevel = 'medium',
        topics = [],
        aiProvider = 'gemini'
      } = req.body;

      console.log('📥 Generate quiz request:', {
        teacherId,
        assignmentTitle,
        subject,
        gradeLevel,
        numberOfQuestions
      });

      // Validate input
      if (!assignmentTitle || !subject || !gradeLevel) {
        return res.status(400).json({
          success: false,
          message: 'Assignment title, subject, and grade level are required'
        });
      }

      if (numberOfQuestions < 1 || numberOfQuestions > 20) {
        return res.status(400).json({
          success: false,
          message: 'Number of questions must be between 1 and 20'
        });
      }

      // Verify teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      console.log('🤖 Generating quiz with AI:', { subject, gradeLevel, numberOfQuestions, difficultyLevel });

      // Generate quiz using AI
      const generatedQuestions = await aiService.generateQuiz({
        subject,
        gradeLevel,
        numberOfQuestions,
        difficultyLevel,
        topics,
        aiProvider
      });

      console.log('✅ AI generated', generatedQuestions.length, 'questions');

      // Transform questions to match frontend format
      const formattedQuestions = generatedQuestions.map((q, index) => {
        // Extract correct answer letter (A, B, C, D)
        const correctOption = q.options.find(opt => opt.isCorrect);
        const correctAnswerLetter = correctOption 
          ? String.fromCharCode(65 + q.options.indexOf(correctOption)) // A=65, B=66, etc.
          : 'A';

        return {
          questionNumber: index + 1,
          id: index + 1,
          type: q.type || 'mcq',
          questionText: q.questionText,
          options: q.options.map((opt, optIdx) => ({
            option: String.fromCharCode(65 + optIdx), // A, B, C, D
            text: opt.text,
            isCorrect: opt.isCorrect
          })),
          correctAnswer: correctAnswerLetter,
          hint: q.hints?.[0] || '',
          explanation: q.explanation || '',
          points: 1
        };
      });

      // Create quiz object for response (don't save to DB yet)
      const quizResponse = {
        quizId: null, // Will be generated when saved
        title: assignmentTitle,
        subject,
        gradeLevel,
        questions: formattedQuestions,
        difficultyLevel,
        topics,
        aiGenerated: true,
        aiProvider,
        status: 'draft'
      };

      console.log('✅ Quiz formatted for frontend');

      res.status(200).json({
        success: true,
        message: 'Quiz generated successfully. Review and save when ready.',
        data: {
          quiz: quizResponse,
          questionsGenerated: formattedQuestions.length
        }
      });
    } catch (error) {
      console.error('❌ Error generating quiz:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate quiz',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Regenerate specific question
   */
  async regenerateQuestions(req, res) {
    try {
      const { quizId } = req.params;
      const { questionNumbers, subject, gradeLevel, difficultyLevel } = req.body;

      console.log('🔄 Regenerate request:', { quizId, questionNumbers });

      if (!questionNumbers || !Array.isArray(questionNumbers) || questionNumbers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Question numbers to regenerate are required'
        });
      }

      // If no quizId (quiz not saved yet), just generate new questions
      if (!quizId || quizId === 'undefined' || quizId === 'null') {
        console.log('📝 Generating new question (no saved quiz)');
        
        const newQuestions = await aiService.generateQuiz({
          subject,
          gradeLevel,
          numberOfQuestions: questionNumbers.length,
          difficultyLevel: difficultyLevel || 'medium'
        });

        // Transform to match frontend format
        const formattedQuestions = newQuestions.map((q, index) => {
          const correctOption = q.options.find(opt => opt.isCorrect);
          const correctAnswerLetter = correctOption 
            ? String.fromCharCode(65 + q.options.indexOf(correctOption))
            : 'A';

          return {
            questionNumber: questionNumbers[index],
            id: questionNumbers[index],
            type: q.type || 'mcq',
            questionText: q.questionText,
            options: q.options.map((opt, optIdx) => ({
              option: String.fromCharCode(65 + optIdx),
              text: opt.text,
              isCorrect: opt.isCorrect
            })),
            correctAnswer: correctAnswerLetter,
            hint: q.hints?.[0] || '',
            explanation: q.explanation || '',
            points: 1
          };
        });

        return res.json({
          success: true,
          message: 'Question regenerated successfully',
          data: { 
            questions: formattedQuestions
          }
        });
      }

      // If quiz exists, update it
      const quiz = await TeacherQuiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      // Verify ownership
      if (quiz.teacherId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to modify this quiz'
        });
      }

      console.log('🔄 Regenerating questions:', questionNumbers);

      // Generate new questions
      const newQuestions = await aiService.generateQuiz({
        subject: subject || quiz.subject,
        gradeLevel: gradeLevel || quiz.gradeLevel[0],
        numberOfQuestions: questionNumbers.length,
        difficultyLevel: difficultyLevel || 'medium'
      });

      // Transform and replace questions
      const formattedQuestions = newQuestions.map((q, index) => {
        const correctOption = q.options.find(opt => opt.isCorrect);
        const correctAnswerLetter = correctOption 
          ? String.fromCharCode(65 + q.options.indexOf(correctOption))
          : 'A';

        return {
          questionNumber: questionNumbers[index],
          id: questionNumbers[index],
          type: q.type || 'mcq',
          questionText: q.questionText,
          options: q.options.map((opt, optIdx) => ({
            option: String.fromCharCode(65 + optIdx),
            text: opt.text,
            isCorrect: opt.isCorrect
          })),
          correctAnswer: correctAnswerLetter,
          hint: q.hints?.[0] || '',
          explanation: q.explanation || '',
          points: 1
        };
      });

      // Replace specified questions
      questionNumbers.forEach((qNum, index) => {
        const questionIndex = quiz.questions.findIndex(q => q.id === qNum);
        if (questionIndex !== -1 && formattedQuestions[index]) {
          quiz.questions[questionIndex] = formattedQuestions[index];
        }
      });

      await quiz.save();

      res.json({
        success: true,
        message: 'Questions regenerated successfully',
        data: { 
          quiz,
          questions: formattedQuestions
        }
      });
    } catch (error) {
      console.error('❌ Error regenerating questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate questions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Save/Update quiz (handles both create and update)
   */
  async updateGeneratedQuiz(req, res) {
    try {
      const { quizId } = req.params;
      const updateData = req.body;

      console.log('💾 Save/Update quiz:', { quizId, hasData: !!updateData });

      // If no quizId, create new quiz
      if (!quizId || quizId === 'undefined' || quizId === 'null') {
        console.log('📝 Creating new quiz');

        const {
          title,
          subject,
          gradeLevel,
          questions,
          difficultyLevel,
          topics,
          aiGenerated,
          aiProvider
        } = updateData;

        // Validate required fields
        if (!title || !subject || !gradeLevel || !questions || questions.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: title, subject, gradeLevel, questions'
          });
        }

        // Create new quiz
        const quizData = {
          teacherId: req.user.id,
          title,
          subject,
          gradeLevel: Array.isArray(gradeLevel) ? gradeLevel : [gradeLevel],
          questions: questions.map(q => ({
            id: q.questionNumber || q.id,
            type: q.type || 'mcq',
            questionText: q.questionText,
            options: q.options.map(opt => ({
              option: opt.option,
              text: opt.text,
              isCorrect: opt.isCorrect || opt.option === q.correctAnswer
            })),
            correctAnswer: q.correctAnswer,
            hint: q.hint || '',
            explanation: q.explanation || '',
            points: q.points || 1,
            shortAnswer: ''
          })),
          status: 'draft',
          isScheduled: false,
          aiGenerated: aiGenerated || true,
          aiProvider: aiProvider || 'gemini',
          difficultyLevel,
          topics: topics || []
        };

        const quiz = new TeacherQuiz(quizData);
        await quiz.save();

        console.log('✅ New quiz created:', quiz._id);

        return res.status(201).json({
          success: true,
          message: 'Quiz saved as draft successfully',
          data: { quiz }
        });
      }

      // Update existing quiz
      const quiz = await TeacherQuiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      // Verify ownership
      if (quiz.teacherId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to modify this quiz'
        });
      }

      console.log('📝 Updating existing quiz');

      // Update allowed fields
      const allowedUpdates = [
        'title', 'subject', 'gradeLevel', 'questions', 
        'status', 'isScheduled', 'difficultyLevel', 'topics'
      ];

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'gradeLevel') {
            quiz[field] = Array.isArray(updateData[field]) ? updateData[field] : [updateData[field]];
          } else if (field === 'questions') {
            quiz[field] = updateData[field].map(q => ({
              id: q.questionNumber || q.id,
              type: q.type || 'mcq',
              questionText: q.questionText,
              options: q.options.map(opt => ({
                option: opt.option,
                text: opt.text,
                isCorrect: opt.isCorrect || opt.option === q.correctAnswer
              })),
              correctAnswer: q.correctAnswer,
              hint: q.hint || '',
              explanation: q.explanation || '',
              points: q.points || 1,
              shortAnswer: ''
            }));
          } else {
            quiz[field] = updateData[field];
          }
        }
      });

      await quiz.save();

      console.log('✅ Quiz updated successfully');

      res.json({
        success: true,
        message: 'Quiz updated successfully',
        data: { quiz }
      });
    } catch (error) {
      console.error('❌ Error saving/updating quiz:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save quiz',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Enhance a specific question
   */
  async enhanceQuestion(req, res) {
    try {
      const { quizId, questionNumber } = req.params;

      const quiz = await TeacherQuiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      // Verify ownership
      if (quiz.teacherId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to modify this quiz'
        });
      }

      const question = quiz.questions.find(q => q.id === parseInt(questionNumber));
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      // Enhance the question
      const enhancements = await aiService.enhanceQuestion(question);

      res.json({
        success: true,
        message: 'Question enhancements generated',
        data: {
          original: question,
          enhancements
        }
      });
    } catch (error) {
      console.error('❌ Error enhancing question:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enhance question',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get AI generation suggestions
   */
  async getGenerationSuggestions(req, res) {
    try {
      const { subject, gradeLevel } = req.query;

      const suggestions = {
        recommendedQuestions: this.getRecommendedQuestionCount(gradeLevel),
        difficultyLevels: ['easy', 'medium', 'hard'],
        topicSuggestions: this.getTopicSuggestions(subject, gradeLevel),
        timeLimitSuggestions: this.getTimeLimitSuggestions(gradeLevel)
      };

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('❌ Error getting suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suggestions'
      });
    }
  }

  // Helper methods
  getRecommendedQuestionCount(gradeLevel) {
    return 10;
  }

  getTopicSuggestions(subject, gradeLevel) {
    const topicMap = {
      'Mathematics': ['Algebra', 'Calculus', 'Statistics', 'Linear Algebra', 'Discrete Math'],
      'Computer Science': ['Programming', 'Data Structures', 'Algorithms', 'Databases', 'Networks'],
      'Physics': ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Quantum'],
      'Chemistry': ['Organic', 'Inorganic', 'Physical Chemistry', 'Analytical', 'Biochemistry'],
      'Biology': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Physiology'],
      'Engineering': ['Circuits', 'Mechanics', 'Materials', 'Thermodynamics', 'Design'],
      'Business': ['Marketing', 'Finance', 'Management', 'Economics', 'Accounting'],
      'English': ['Grammar', 'Literature', 'Writing', 'Composition', 'Critical Analysis']
    };

    return topicMap[subject] || [];
  }

  getTimeLimitSuggestions(gradeLevel) {
    return [30, 45, 60, 90];
  }
}

export default new aiQuizController();