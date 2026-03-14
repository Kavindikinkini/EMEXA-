import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const DistractorAnalysis = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [error, setError] = useState('');

  // Load teacher's quizzes on mount
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/api/teacher-quizzes/my-quizzes`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Also include scheduled and closed, not just active
const allQuizzes = (res.data.quizzes || res.data || []).filter(
  q => !q.isDeleted
);

// Debug: log what quizzes came back
console.log('📋 Quizzes for dropdown:', allQuizzes.length, allQuizzes.map(q => q.title));

setQuizzes(allQuizzes);
      } catch (err) {
        console.error('Error loading quizzes:', err);
        setError('Could not load your quizzes.');
      } finally {
        setLoadingQuizzes(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleAnalyse = async () => {
    if (!selectedQuizId) return;
    setLoading(true);
    setAnalysis(null);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_BASE}/api/teacher-quizzes/${selectedQuizId}/distractor-analysis`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalysis(res.data.data);
    } catch (err) {
      console.error('Distractor analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            🎯 AI Distractor Analyser
          </h1>
          <p className="text-gray-500 text-sm">
            Understand which wrong answers your students chose and why — powered by AI misconception detection.
          </p>
        </div>

        {/* Quiz Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select a Quiz to Analyse
          </label>
          {loadingQuizzes ? (
            <p className="text-gray-400 text-sm">Loading your quizzes...</p>
          ) : quizzes.length === 0 ? (
            <p className="text-gray-400 text-sm">No published quizzes found.</p>
          ) : (
            <div className="flex gap-3">
              <select
                value={selectedQuizId}
                onChange={e => setSelectedQuizId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">— Choose a quiz —</option>
                {quizzes.map(q => (
                  <option key={q._id} value={q._id}>
                    {q.title} {q.subject ? `(${q.subject})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAnalyse}
                disabled={!selectedQuizId || loading}
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  !selectedQuizId || loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-teal-700 text-white hover:bg-teal-800'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Analysing...
                  </span>
                ) : 'Analyse'}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Analysing student responses...</p>
            <p className="text-gray-400 text-sm mt-1">AI is identifying misconceptions. This takes 5–15 seconds.</p>
          </div>
        )}

        {/* No attempts yet */}
        {analysis && analysis.totalAttempts === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-700 font-semibold text-lg mb-2">{analysis.quizTitle}</p>
            <p className="text-gray-400 text-sm">{analysis.message}</p>
          </div>
        )}

        {/* Results */}
        {analysis && analysis.totalAttempts > 0 && (
          <>
            {/* Summary bar */}
            <div className="bg-teal-700 text-white rounded-xl p-5 mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">{analysis.quizTitle}</h2>
                <p className="text-teal-200 text-sm mt-0.5">
                  {analysis.totalAttempts} student attempt{analysis.totalAttempts !== 1 ? 's' : ''} analysed
                </p>
              </div>
              <div className="text-right">
                <p className="text-teal-200 text-xs">MCQ questions</p>
                <p className="text-2xl font-bold">{analysis.questions.length}</p>
              </div>
            </div>

            {/* Per-question cards */}
            {analysis.questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm">

                {/* Question header */}
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center text-sm font-bold border border-teal-200">
                    {qIdx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm leading-relaxed">
                      {q.questionText}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        ✓ {q.correctAnswer}
                      </span>
                      <span className="text-xs text-gray-400">
                        {q.totalAnswered} response{q.totalAnswered !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* No distractors */}
                {q.distractors.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-700 text-sm font-medium">
                      🎉 All students answered this question correctly!
                    </p>
                  </div>
                )}

                {/* Distractor rows */}
                {q.distractors.map((d, dIdx) => (
                  <div key={dIdx} className="mb-3 last:mb-0">
                    <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4">

                      {/* Wrong answer pill */}
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                          ✗ Wrong
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Option text + count */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-800">
                            "{d.optionText}"
                          </p>
                          <span className="flex-shrink-0 text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                            {d.chosenByCount} student{d.chosenByCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Student names */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {d.chosenByStudents.map((name, nIdx) => (
                            <span key={nIdx} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                              {name}
                            </span>
                          ))}
                        </div>

                        {/* AI misconception */}
                        <div className="flex items-start gap-2 bg-white border border-blue-100 rounded-lg p-3">
                          <span className="text-blue-500 flex-shrink-0 mt-0.5">🧠</span>
                          <p className="text-sm text-blue-800 leading-relaxed italic">
                            {d.misconception}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DistractorAnalysis;