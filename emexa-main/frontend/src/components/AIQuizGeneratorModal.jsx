// frontend/src/components/AIQuizGeneratorModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Save, AlertCircle, BookOpen, Brain, Clock, Target } from 'lucide-react';
import apiClient from '../services/apiClient';

const AIQuizGeneratorModal = ({ isOpen, onClose, onQuizGenerated }) => {
  const [formData, setFormData] = useState({
    assignmentTitle: '',
    subject: '',
    gradeLevel: '',
    numberOfQuestions: 5,
    difficultyLevel: 'medium',
    topics: []
  });

  const [currentTopic, setCurrentTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [savedQuizId, setSavedQuizId] = useState(null); // NEW: Track saved quiz ID

  // Fetch suggestions when subject/grade changes
  useEffect(() => {
    if (formData.subject && formData.gradeLevel) {
      fetchSuggestions();
    }
  }, [formData.subject, formData.gradeLevel]);

  const fetchSuggestions = async () => {
    try {
      const response = await apiClient.get(
        `/ai-quiz/suggestions?subject=${encodeURIComponent(formData.subject)}&gradeLevel=${encodeURIComponent(formData.gradeLevel)}`
      );
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      // Silently fail - suggestions are optional
      setSuggestions(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTopic = () => {
    if (currentTopic.trim() && !formData.topics.includes(currentTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, currentTopic.trim()]
      }));
      setCurrentTopic('');
    }
  };

  const handleRemoveTopic = (topic) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/ai-quiz/generate', formData);
      
      if (response.success) {
        setGeneratedQuiz(response.data.quiz);
        console.log('✅ Quiz generated:', response.data.quiz);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Please try again.');
      console.error('❌ Generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Regenerate question method
  const handleRegenerateQuestion = async (questionNumber) => {
    try {
      console.log('🔄 Regenerating question:', questionNumber);
      
      const response = await apiClient.post(
        `/ai-quiz/${savedQuizId || 'undefined'}/regenerate`,
        {
          questionNumbers: [questionNumber],
          subject: formData.subject,
          gradeLevel: formData.gradeLevel,
          difficultyLevel: formData.difficultyLevel
        }
      );

      if (response.success && response.data.questions) {
        // Update the question in the generated quiz
        const updatedQuestions = generatedQuiz.questions.map(q =>
          q.questionNumber === questionNumber ? response.data.questions[0] : q
        );

        setGeneratedQuiz(prev => ({
          ...prev,
          questions: updatedQuestions
        }));

        console.log('✅ Question regenerated successfully');
      }
    } catch (err) {
      console.error('❌ Failed to regenerate question:', err);
      setError('Failed to regenerate question: ' + err.message);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEditQuestion = (questionNumber, field, value) => {
    setGeneratedQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.questionNumber === questionNumber
          ? { ...q, [field]: value }
          : q
      )
    }));
  };

  // FIXED: Save quiz method
  const handleSaveQuiz = async () => {
    try {
      console.log('💾 Saving quiz...', {
        savedQuizId,
        title: generatedQuiz?.title || formData.assignmentTitle,
        questionsCount: generatedQuiz?.questions?.length
      });

      if (!generatedQuiz || !generatedQuiz.questions || generatedQuiz.questions.length === 0) {
        setError('No questions to save');
        return;
      }

      const quizData = {
        title: generatedQuiz.title || formData.assignmentTitle,
        subject: formData.subject,
        gradeLevel: formData.gradeLevel,
        questions: generatedQuiz.questions,
        difficultyLevel: formData.difficultyLevel,
        topics: formData.topics,
        aiGenerated: true,
        isPublished: false
      };

      // Use savedQuizId if exists, otherwise 'undefined' to create new
      const endpoint = `/ai-quiz/${savedQuizId || 'undefined'}`;
      console.log('📤 Saving to endpoint:', endpoint);

      const response = await apiClient.put(endpoint, quizData);

      if (response.success) {
        console.log('✅ Quiz saved successfully:', response.data.quiz);
        
        // Store the quiz ID for future updates
        if (response.data.quiz._id) {
          setSavedQuizId(response.data.quiz._id);
        }

        // Call the callback if provided
        if (onQuizGenerated) {
          onQuizGenerated(response.data.quiz);
        }

        // Show success message and close
        alert('✅ Quiz saved successfully!');
        onClose();
      }
    } catch (err) {
      console.error('❌ Failed to save quiz:', err);
      setError('Failed to save quiz: ' + err.message);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-out;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-start justify-center animate-fadeIn pl-[240px] py-8 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-slideUp my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  AI Quiz Generator
                </h2>
                <p className="text-teal-100 text-sm">Powered by artificial intelligence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-shake">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {!generatedQuiz ? (
              // Generation Form
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Assignment Title */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="text-teal-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">Quiz Details</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="assignmentTitle"
                      value={formData.assignmentTitle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="e.g., Chapter 5 Review Quiz"
                      required
                    />
                  </div>
                </div>

                {/* Subject & Grade */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="text-teal-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">Subject & Level</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        placeholder="e.g., Mathematics, Science, English"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade Level <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="gradeLevel"
                          value={formData.gradeLevel}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none bg-white cursor-pointer"
                          required
                        >
                          <option value="">Select grade level</option>
                          <option value="1st Year 1st Sem">1st Year 1st Sem</option>
                          <option value="1st Year 2nd Sem">1st Year 2nd Sem</option>
                          <option value="2nd Year 1st Sem">2nd Year 1st Sem</option>
                          <option value="2nd Year 2nd Sem">2nd Year 2nd Sem</option>
                          <option value="3rd Year 1st Sem">3rd Year 1st Sem</option>
                          <option value="3rd Year 2nd Sem">3rd Year 2nd Sem</option>
                          <option value="4th Year 1st Sem">4th Year 1st Sem</option>
                          <option value="4th Year 2nd Sem">4th Year 2nd Sem</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quiz Settings */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="text-teal-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-800">Quiz Configuration</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Questions
                      </label>
                      <input
                        type="number"
                        name="numberOfQuestions"
                        value={formData.numberOfQuestions}
                        onChange={handleInputChange}
                        min="1"
                        max="20"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                      {suggestions && (
                        <p className="text-xs text-teal-600 mt-2 flex items-center gap-1">
                          <Sparkles size={12} />
                          Recommended: {suggestions.recommendedQuestions} questions
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <div className="relative">
                        <select
                          name="difficultyLevel"
                          value={formData.difficultyLevel}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all appearance-none bg-white cursor-pointer"
                        >
                          <option value="easy">🟢 Easy</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="hard">🔴 Hard</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Specific Topics <span className="text-gray-400">(Optional)</span>
                  </label>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={currentTopic}
                      onChange={(e) => setCurrentTopic(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="Add a specific topic (press Enter)"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium shadow-sm hover:shadow"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.topics.map(topic => (
                        <span
                          key={topic}
                          className="px-4 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 rounded-full text-sm flex items-center gap-2 border border-teal-200 font-medium"
                        >
                          {topic}
                          <button
                            onClick={() => handleRemoveTopic(topic)}
                            className="hover:text-teal-900 hover:bg-teal-200 rounded-full p-0.5 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {suggestions?.topicSuggestions && suggestions.topicSuggestions.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
                        <Sparkles size={14} />
                        AI Suggested Topics
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.topicSuggestions.map(topic => (
                          <button
                            key={topic}
                            onClick={() => {
                              if (!formData.topics.includes(topic)) {
                                setFormData(prev => ({
                                  ...prev,
                                  topics: [...prev.topics, topic]
                                }));
                              }
                            }}
                            disabled={formData.topics.includes(topic)}
                            className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-all border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            + {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={loading || !formData.assignmentTitle || !formData.subject || !formData.gradeLevel}
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={24} />
                        Generating Magic...
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} />
                        Generate Quiz with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Generated Quiz Preview & Edit
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-teal-100 p-2 rounded-lg">
                      <Sparkles className="text-teal-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-teal-900 text-lg mb-1">
                        Quiz Generated Successfully! 🎉
                      </h3>
                      <p className="text-teal-700">
                        Review and edit the questions below. You can regenerate individual questions or save the quiz as a draft.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quiz Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={16} className="text-gray-400" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Subject</p>
                    </div>
                    <p className="font-bold text-gray-800 text-lg">{formData.subject}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={16} className="text-gray-400" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Level</p>
                    </div>
                    <p className="font-bold text-gray-800 text-lg">{formData.gradeLevel}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={16} className="text-gray-400" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Questions</p>
                    </div>
                    <p className="font-bold text-gray-800 text-lg">{generatedQuiz.questions.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-gray-400" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Difficulty</p>
                    </div>
                    <p className="font-bold text-gray-800 text-lg capitalize">{formData.difficultyLevel}</p>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {generatedQuiz.questions.map((question, index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 hover:border-teal-300 rounded-xl p-6 transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 rounded-lg text-sm font-bold">
                          Question {question.questionNumber}
                        </span>
                        <button
                          onClick={() => handleRegenerateQuestion(question.questionNumber)}
                          className="text-teal-600 hover:text-white hover:bg-teal-600 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-teal-300"
                        >
                          <RefreshCw size={16} />
                          Regenerate
                        </button>
                      </div>

                      <textarea
                        value={question.questionText}
                        onChange={(e) => handleEditQuestion(question.questionNumber, 'questionText', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium text-gray-800"
                        rows="2"
                      />

                      <div className="space-y-3 mb-4">
                        {question.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold min-w-[40px] text-center ${
                              opt.option === question.correctAnswer
                                ? 'bg-green-100 text-green-800 ring-2 ring-green-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {opt.option}
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const newOptions = [...question.options];
                                newOptions[optIdx].text = e.target.value;
                                handleEditQuestion(question.questionNumber, 'options', newOptions);
                              }}
                              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                            />
                          </div>
                        ))}
                      </div>

                      {question.hint && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 mb-3">
                          <p className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide">💡 Hint</p>
                          <textarea
                            value={question.hint}
                            onChange={(e) => handleEditQuestion(question.questionNumber, 'hint', e.target.value)}
                            className="w-full text-sm text-blue-800 bg-transparent border-none focus:ring-0 resize-none"
                            rows="1"
                          />
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
                          <p className="text-xs font-bold text-amber-900 mb-2 uppercase tracking-wide">📝 Explanation</p>
                          <textarea
                            value={question.explanation}
                            onChange={(e) => handleEditQuestion(question.questionNumber, 'explanation', e.target.value)}
                            className="w-full text-sm text-amber-800 bg-transparent border-none focus:ring-0 resize-none"
                            rows="2"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={() => setGeneratedQuiz(null)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                  >
                    ← Start Over
                  </button>
                  <button
                    onClick={handleSaveQuiz}
                    className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <Save size={20} />
                    Save as Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AIQuizGeneratorModal;