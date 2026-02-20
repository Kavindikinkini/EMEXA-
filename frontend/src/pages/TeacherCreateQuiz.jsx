import React, { useState, useEffect, useRef } from "react";
import teacherQuizService from "../services/teacherQuizService";
import AIQuizGeneratorModal from "../components/AIQuizGeneratorModal";

const TeacherCreateQuiz = ({
  setActiveMenuItem,
  editingDraftId,
  setEditingDraftId,
}) => {
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [isGradeLevelOpen, setIsGradeLevelOpen] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  // ✨ NEW: AI Modal state
  const [showAIModal, setShowAIModal] = useState(false);

  // Use refs to track next available IDs
  const nextQuestionId = useRef(1);
  const nextOptionIds = useRef({});

  // Load draft data if editing
  useEffect(() => {
    const loadDraftForEditing = async () => {
      if (editingDraftId) {
        try {
          console.log("📝 Loading draft for editing:", editingDraftId);
          const response = await teacherQuizService.getQuizById(editingDraftId);
          console.log("✅ Loaded quiz data:", response);

          const quiz = response.quiz || response.data || response;

          if (quiz) {
            setAssignmentTitle(quiz.title || "");
            setSubject(quiz.subject || "");

            // Convert gradeLevel array to selectedGrades format
            if (Array.isArray(quiz.gradeLevel)) {
              const gradeMap = {
                "1st Year 1st Sem": "1-1",
                "1st Year 2nd Sem": "1-2",
                "2nd Year 1st Sem": "2-1",
                "2nd Year 2nd Sem": "2-2",
                "3rd Year 1st Sem": "3-1",
                "3rd Year 2nd Sem": "3-2",
                "4th Year 1st Sem": "4-1",
                "4th Year 2nd Sem": "4-2",
              };
              const gradeIds = quiz.gradeLevel.map(
                (label) => gradeMap[label] || "1-1"
              );
              setSelectedGrades(gradeIds);
            } else {
              setSelectedGrades([]);
            }

            setQuestions(quiz.questions || []);
            console.log("📋 Loaded questions:", quiz.questions?.length || 0);

            // Reset ID counters based on loaded questions
            if (quiz.questions && quiz.questions.length > 0) {
              const maxQuestionId = Math.max(
                ...quiz.questions.map((q) => q.id)
              );
              nextQuestionId.current = maxQuestionId + 1;

              // Reset option ID counters for each question
              quiz.questions.forEach((q) => {
                if (q.options && q.options.length > 0) {
                  const maxOptionId = Math.max(
                    ...q.options.map((opt) => opt.id)
                  );
                  nextOptionIds.current[q.id] = maxOptionId + 1;
                }
              });
            }
          }
        } catch (error) {
          console.error("❌ Error loading draft for editing:", error);
          alert("Failed to load quiz data: " + error.message);
        }
      } else {
        // Reset form when not editing
        setAssignmentTitle("");
        setSubject("");
        setSelectedGrades([]);
        setQuestions([]);
        setIsGradeLevelOpen(false);

        // Reset ID counters
        nextQuestionId.current = 1;
        nextOptionIds.current = {};
      }
    };

    loadDraftForEditing();
  }, [editingDraftId]);

  const gradeOptions = [
    { id: "1-1", label: "1st Year 1st Sem" },
    { id: "1-2", label: "1st Year 2nd Sem" },
    { id: "2-1", label: "2nd Year 1st Sem" },
    { id: "2-2", label: "2nd Year 2nd Sem" },
    { id: "3-1", label: "3rd Year 1st Sem" },
    { id: "3-2", label: "3rd Year 2nd Sem" },
    { id: "4-1", label: "4th Year 1st Sem" },
    { id: "4-2", label: "4th Year 2nd Sem" },
  ];

  const selectGrade = (gradeId) => {
    setSelectedGrades([gradeId]);
    setIsGradeLevelOpen(false);
  };

  const handleBackToDashboard = () => {
    if (setEditingDraftId) {
      setEditingDraftId(null);
    }
    setActiveMenuItem(editingDraftId ? "quiz-drafts" : "quizzes");
  };

  // ✨ NEW: Handle AI quiz generation
  const handleAIQuizGenerated = (generatedQuiz) => {
    console.log("🤖 AI Quiz Generated:", generatedQuiz);
    
    // Load the AI-generated quiz into the form for editing
    setAssignmentTitle(generatedQuiz.title || "");
    setSubject(generatedQuiz.subject || "");
    
    // Set grade level
    if (generatedQuiz.gradeLevel && generatedQuiz.gradeLevel.length > 0) {
      const gradeMap = {
        "1st Year 1st Sem": "1-1",
        "1st Year 2nd Sem": "1-2",
        "2nd Year 1st Sem": "2-1",
        "2nd Year 2nd Sem": "2-2",
        "3rd Year 1st Sem": "3-1",
        "3rd Year 2nd Sem": "3-2",
        "4th Year 1st Sem": "4-1",
        "4th Year 2nd Sem": "4-2",
      };
      const gradeId = gradeMap[generatedQuiz.gradeLevel[0]] || "1-1";
      setSelectedGrades([gradeId]);
    }
    
    // Set questions
    if (generatedQuiz.questions && generatedQuiz.questions.length > 0) {
      setQuestions(generatedQuiz.questions);
      
      // Update ID counters
      const maxQuestionId = Math.max(...generatedQuiz.questions.map((q) => q.id));
      nextQuestionId.current = maxQuestionId + 1;
      
      generatedQuiz.questions.forEach((q) => {
        if (q.options && q.options.length > 0) {
          const maxOptionId = Math.max(...q.options.map((opt) => opt.id));
          nextOptionIds.current[q.id] = maxOptionId + 1;
        }
      });
    }
    
    // Set editing draft ID so we can update this quiz
    if (setEditingDraftId && generatedQuiz._id) {
      setEditingDraftId(generatedQuiz._id);
    }
    
    // Close modal
    setShowAIModal(false);
    
    // Show success message
    alert("✅ Quiz generated! Review and edit the questions below, then save.");
  };

  const addQuestion = () => {
    const questionId = nextQuestionId.current++;
    nextOptionIds.current[questionId] = 3;

    const newQuestion = {
      id: questionId,
      type: "mcq",
      questionText: "",
      options: [
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
      ],
      shortAnswer: "",
      hints: ["", "", "", ""],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestionType = (questionId, type) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, type: type } : q))
    );
  };

  const updateQuestionText = (questionId, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, questionText: value } : q
      )
    );
  };

  const updateQuestionHint = (questionId, hintIndex, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const updatedHints = [...(q.hints || ["", "", "", ""])];
          updatedHints[hintIndex] = value;
          return { ...q, hints: updatedHints };
        }
        return q;
      })
    );
  };

  const addAnswerOption = (questionId) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          if (!nextOptionIds.current[questionId]) {
            nextOptionIds.current[questionId] = q.options.length + 1;
          }
          const newOptionId = nextOptionIds.current[questionId]++;

          return {
            ...q,
            options: [
              ...q.options,
              { id: newOptionId, text: "", isCorrect: false },
            ],
          };
        }
        return q;
      })
    );
  };

  const removeAnswerOption = (questionId, optionId) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter((opt) => opt.id !== optionId),
          };
        }
        return q;
      })
    );
  };

  const updateAnswerOption = (questionId, optionId, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optionId ? { ...opt, text: value } : opt
            ),
          };
        }
        return q;
      })
    );
  };

  const markAsCorrect = (questionId, optionId) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((opt) => ({
              ...opt,
              isCorrect: opt.id === optionId,
            })),
          };
        }
        return q;
      })
    );
  };

  const handleCreateAssignment = async () => {
    // Validate
    if (!assignmentTitle || !subject || selectedGrades.length === 0) {
      alert(
        "Please fill in all assignment details (Title, Subject, and Grade Level)"
      );
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    try {
      const gradeLabels = gradeOptions
        .filter((g) => selectedGrades.includes(g.id))
        .map((g) => g.label);
      const firstGrade = gradeLabels[0] || "";

      const quizData = {
        title: assignmentTitle,
        subject: subject.charAt(0).toUpperCase() + subject.slice(1),
        gradeLevel: [firstGrade],
        questions: questions.map((q) => ({
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          options: q.type === "mcq" ? q.options : [],
          shortAnswer: q.type === "short" ? q.shortAnswer : "",
          hints: q.hints || ["", "", "", ""],
        })),
        status: "draft",
        isScheduled: false,
      };

      console.log("Saving quiz to database:", quizData);

      if (editingDraftId) {
        await teacherQuizService.updateQuiz(editingDraftId, quizData);
        alert(
          "✅ Assignment Updated Successfully!\n\nYour quiz has been updated and saved as a draft."
        );
      } else {
        const response = await teacherQuizService.createQuiz(quizData);
        console.log("Quiz created:", response);
        alert(
          "✅ Assignment Created Successfully!\n\nYour quiz has been saved as a draft. You can schedule and share it with students from the My Quizzes page."
        );
      }

      if (setEditingDraftId) {
        setEditingDraftId(null);
      }

      setActiveMenuItem("quiz-drafts");
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert(
        "❌ Failed to save quiz: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="p-6">
      {/* Back Button and Header */}
      <div className="mb-6">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back to Quizzes</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Assignment
          </h1>
          {/* ✨ UPDATED: AI Assistant Button */}
          <button 
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Use AI Assistant
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        {/* Assignment Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Title
          </label>
          <input
            type="text"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:shadow-[0_0_0_3px_rgba(11,107,58,0.06)] focus:border-teal-600 focus:outline-none text-sm placeholder-gray-400"
            placeholder="Enter assignment title"
          />
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:shadow-[0_0_0_3px_rgba(11,107,58,0.06)] focus:border-teal-600 focus:outline-none text-sm placeholder-gray-400"
            placeholder="Enter subject name"
          />
        </div>

        {/* Grade Level */}
        <div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
            <button
              type="button"
              onClick={() => setIsGradeLevelOpen(!isGradeLevelOpen)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-left text-sm text-gray-500 hover:border-gray-400 focus:shadow-[0_0_0_3px_rgba(11,107,58,0.06)] focus:border-teal-600 focus:outline-none flex items-center justify-between"
            >
              <span
                className={
                  selectedGrades.length > 0 ? "text-gray-900" : "text-gray-500"
                }
              >
                {selectedGrades.length > 0
                  ? gradeOptions.find((g) => g.id === selectedGrades[0])
                      ?.label || "Select grade level"
                  : "Select grade level"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isGradeLevelOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isGradeLevelOpen && (
              <div className="w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10 absolute">
                <div className="p-2">
                  {gradeOptions.map((grade) => (
                    <label
                      key={grade.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => selectGrade(grade.id)}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedGrades.includes(grade.id)}
                          onChange={() => selectGrade(grade.id)}
                          className="w-5 h-5 border-2 border-gray-300 rounded cursor-pointer appearance-none checked:bg-teal-600 checked:border-teal-600 transition-colors"
                        />
                        {selectedGrades.includes(grade.id) && (
                          <svg
                            className="w-3.5 h-3.5 text-white absolute pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">
                        {grade.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Questions & Hints Card */}
      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm mt-4">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Questions & Hints
        </h2>

        {questions.map((question, index) => (
          <div
            key={question.id}
            className="mb-6 pb-6 border-b border-gray-200 last:border-b-0"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Question {index + 1}
              </h3>
              <button
                onClick={() => removeQuestion(question.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                value={question.questionText}
                onChange={(e) =>
                  updateQuestionText(question.id, e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:shadow-[0_0_0_3px_rgba(11,107,58,0.06)] focus:border-teal-600 focus:outline-none text-sm placeholder-gray-400 resize-none"
                rows="2"
                placeholder="Enter question text"
              />
            </div>

            {/* MCQ Answer Options */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Options (click to mark as correct)
              </label>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      type="button"
                      onClick={() => markAsCorrect(question.id, option.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        option.isCorrect
                          ? "border-green-600 bg-green-600"
                          : "border-gray-300 hover:border-teal-500"
                      }`}
                    >
                      {option.isCorrect && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        updateAnswerOption(
                          question.id,
                          option.id,
                          e.target.value
                        )
                      }
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:shadow-[0_0_0_3px_rgba(11,107,58,0.06)] focus:border-teal-600 focus:outline-none text-sm placeholder-gray-400 transition ${
                        option.isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter answer option"
                    />
                    <button
                      type="button"
                      onClick={() => removeAnswerOption(question.id, option.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      disabled={question.options.length <= 2}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addAnswerOption(question.id)}
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm mt-3"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Answer Option
              </button>
            </div>

            {/* Hints */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hints (up to 4)
              </label>
              <div className="space-y-2">
                {[0, 1, 2, 3].map((hintIndex) => (
                  <input
                    key={hintIndex}
                    type="text"
                    value={
                      (question.hints || ["", "", "", ""])[hintIndex] || ""
                    }
                    onChange={(e) =>
                      updateQuestionHint(question.id, hintIndex, e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:shadow-[0_0_0_3px_rgba(11,107,58,0.06)] focus:border-teal-600 focus:outline-none text-sm placeholder-gray-400"
                    placeholder={`Hint ${hintIndex + 1} (optional)`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Question
        </button>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateAssignment}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm"
          >
            Create Assignment
          </button>
        </div>
      </div>

      {/* ✨ NEW: AI Quiz Generator Modal */}
      <AIQuizGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onQuizGenerated={handleAIQuizGenerated}
      />
    </div>
  );
};

export default TeacherCreateQuiz;
