// frontend/src/pages/QuizDifficultyAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/headerorigin';
import Sidebar from '../components/sidebarorigin';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const DifficultyBadge = ({ difficulty }) => {
  const config = {
    Easy:    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  dot: 'bg-green-500'  },
    Medium:  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
    Hard:    { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500'    },
    Unknown: { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200',   dot: 'bg-gray-400'   },
  };
  const c = config[difficulty] || config.Unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {difficulty}
    </span>
  );
};

const OverallBadge = ({ difficulty }) => {
  const config = {
    Easy:     { bg: 'bg-green-50',  text: 'text-green-700',  icon: '🟢' },
    Moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '🟡' },
    Hard:     { bg: 'bg-red-50',    text: 'text-red-700',    icon: '🔴' },
    'No Data':{ bg: 'bg-gray-50',   text: 'text-gray-500',   icon: '⚪' },
  };
  const c = config[difficulty] || config['No Data'];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${c.bg} ${c.text}`}>
      {c.icon} {difficulty}
    </span>
  );
};

const QuizDifficultyAnalysis = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('difficulty');
  const [userName, setUserName] = useState('');
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'Teacher');
    fetchAllSummary();
  }, []);

  const fetchAllSummary = async () => {
    setLoadingAll(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/quiz-difficulty/teacher/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllQuizzes(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedQuizId(res.data.data[0].quizId);
      }
    } catch (err) {
      console.error('Summary fetch error:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  const fetchAnalysis = async (qId) => {
    if (!qId) return;
    setLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/quiz-difficulty/${qId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalysis(res.data.data);
    } catch (err) {
      console.error('Analysis fetch error:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (selectedQuizId) fetchAnalysis(selectedQuizId);
  }, [selectedQuizId]);

  const teacherMenuItems = [
    {
      id: 'dashboard', label: 'Dashboard',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
      onClick: () => navigate('/teacher-dashboard')
    },
    {
      id: 'quizzes', label: 'Quiz',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      onClick: () => navigate('/teacher-dashboard')
    },
    {
      id: 'customAnalytics', label: 'Custom Analysis',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
      onClick: () => navigate('/teacher/custom-analytics')
    },
    {
      id: 'heatmap', label: 'Emotion Heatmap',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      onClick: () => navigate('/teacher-dashboard', { state: { activeMenu: 'heatmap' } })
    },
    {
      id: 'difficulty', label: 'Difficulty Analysis',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
      onClick: () => navigate('/teacher/difficulty-analysis')
    },
    {
      id: 'profile', label: 'Profile',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      onClick: () => navigate('/teacher-profile')
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header userName={userName} userRole="teacher" />
      <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} menuItems={teacherMenuItems} />

      <div className="ml-52 pt-14">
        <div className="p-8 max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Quiz Difficulty Analysis</h1>
            <p className="text-gray-500">
              Auto-detected difficulty per question based on class performance.
              <span className="ml-2 font-semibold text-emerald-600">Revisions are suggested automatically.</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="flex">
              {[
                { id: 'overview', label: '📋 All Quizzes' },
                { id: 'detail',   label: '🔍 Question Detail' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
                    activeTab === tab.id ? 'text-emerald-700 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}>
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* OVERVIEW TAB - all quizzes summary */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {loadingAll && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Loading your quizzes...</p>
                </div>
              )}

              {!loadingAll && allQuizzes.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No quizzes found</h3>
                  <p className="text-gray-500 text-sm">Create a quiz and share it with students to start seeing difficulty analysis.</p>
                  <button onClick={() => navigate('/teacher-create-quiz')}
                    className="mt-6 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-semibold text-sm">
                    Create a Quiz
                  </button>
                </div>
              )}

              {!loadingAll && allQuizzes.length > 0 && (
                <>
                  {/* Quick stats */}
                  <div className="grid grid-cols-4 gap-5 mb-2">
                    {[
                      { label: 'Total Quizzes', value: allQuizzes.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Need Revision', value: allQuizzes.reduce((s, q) => s + q.revisionsNeeded, 0), color: 'text-red-600', bg: 'bg-red-50' },
                      { label: 'Hard Quizzes', value: allQuizzes.filter(q => q.overallDifficulty === 'Hard').length, color: 'text-orange-600', bg: 'bg-orange-50' },
                      { label: 'Total Attempts', value: allQuizzes.reduce((s, q) => s + q.totalAttempts, 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
                          {['📚', '✏️', '🔴', '✍️'][i]}
                        </div>
                        <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quiz cards */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quiz</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Difficulty</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Score</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Attempts</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Revisions</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allQuizzes.map((quiz, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900 text-sm">{quiz.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{quiz.questionCount} questions • {quiz.subject}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <OverallBadge difficulty={quiz.overallDifficulty} />
                            </td>
                            <td className="px-6 py-4 text-center">
                              {quiz.classAvgScore !== null
                                ? <span className={`font-bold text-sm ${quiz.classAvgScore >= 70 ? 'text-green-600' : quiz.classAvgScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {quiz.classAvgScore}%
                                  </span>
                                : <span className="text-gray-400 text-xs">—</span>
                              }
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-gray-700 font-semibold text-sm">{quiz.totalAttempts}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {quiz.revisionsNeeded > 0
                                ? <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                    {quiz.revisionsNeeded} needed
                                  </span>
                                : <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Good</span>
                              }
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => { setSelectedQuizId(quiz.quizId); setActiveTab('detail'); }}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition"
                              >
                                Analyse →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* DETAIL TAB */}
          {activeTab === 'detail' && (
            <div className="space-y-6">
              {/* Quiz selector */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Quiz to Analyse</label>
                <select
                  value={selectedQuizId}
                  onChange={e => setSelectedQuizId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 text-sm font-medium"
                >
                  <option value="">Choose a quiz...</option>
                  {allQuizzes.map(q => (
                    <option key={q.quizId} value={q.quizId}>{q.title}</option>
                  ))}
                </select>
              </div>

              {loadingAnalysis && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Analysing question difficulty...</p>
                </div>
              )}

              {analysis && !loadingAnalysis && (
                <>
                  {/* Quiz summary bar */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{analysis.quizTitle}</h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {analysis.totalAttempts} attempts · {analysis.totalStudents} students · Class avg: <strong>{analysis.classAvgScore}%</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OverallBadge difficulty={analysis.overallDifficulty} />
                        {analysis.revisionsNeeded > 0 && (
                          <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-bold">
                            ⚠️ {analysis.revisionsNeeded} question{analysis.revisionsNeeded > 1 ? 's' : ''} need revision
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Summary pills */}
                    <div className="flex gap-3 mt-5">
                      {[
                        { label: 'Easy', count: analysis.summary.easy, color: 'bg-green-100 text-green-700 border-green-200' },
                        { label: 'Medium', count: analysis.summary.medium, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                        { label: 'Hard', count: analysis.summary.hard, color: 'bg-red-100 text-red-700 border-red-200' },
                        { label: 'Unknown', count: analysis.summary.unknown, color: 'bg-gray-100 text-gray-500 border-gray-200' },
                      ].filter(s => s.count > 0).map((s, i) => (
                        <span key={i} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${s.color}`}>
                          {s.label}: {s.count}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Revision alerts */}
                  {analysis.revisionList?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                      <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Revision Suggestions
                      </h3>
                      <div className="space-y-2">
                        {analysis.revisionList.map((item, i) => (
                          <div key={i} className="bg-white rounded-xl p-4 border border-red-100">
                            <p className="font-semibold text-gray-900 text-sm mb-1">
                              Q{item.questionIndex + 1}: {item.questionText.length > 80
                                ? item.questionText.slice(0, 80) + '…'
                                : item.questionText}
                            </p>
                            <p className="text-xs text-red-700">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-question table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Question-by-Question Analysis</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {analysis.questions.map((q, idx) => (
                        <div key={idx} className={`p-5 ${q.needsRevision ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
                          <div className="flex items-start gap-4">
                            {/* Q number */}
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-black text-gray-600">
                              Q{idx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                <p className="font-semibold text-gray-900 text-sm truncate">{q.questionText}</p>
                                <DifficultyBadge difficulty={q.difficulty} />
                                {q.needsRevision && (
                                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                                    ✏️ Needs Revision
                                  </span>
                                )}
                              </div>

                              {/* Stats row */}
                              <div className="flex items-center gap-5 text-xs text-gray-500 flex-wrap">
                                {q.correctRate !== null && (
                                  <span className={`font-semibold ${q.correctRate >= 70 ? 'text-green-600' : q.correctRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    ✓ {q.correctRate}% correct
                                  </span>
                                )}
                                <span>💡 {q.hintRate}% used hints</span>
                                <span>😤 {q.frustrationRate}% frustration</span>
                                {q.totalAnswered > 0 && <span className="text-gray-400">{q.totalAnswered} answers</span>}
                              </div>

                              {/* Correct rate bar */}
                              {q.correctRate !== null && (
                                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden w-full max-w-md">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                      q.correctRate >= 70 ? 'bg-green-500' :
                                      q.correctRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${q.correctRate}%` }}
                                  />
                                </div>
                              )}

                              {/* Hint recommendation */}
                              {q.hintRecommendation && (
                                <div className={`mt-2 text-xs font-semibold px-3 py-1 rounded-lg inline-block ${
                                  q.hintRecommendation === 'increase'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  💡 Hint suggestion: {q.hintRecommendation === 'increase'
                                    ? 'Show hints more proactively on this question'
                                    : 'Reduce auto-hints — students handle this well'}
                                </div>
                              )}

                              {/* Revision reason */}
                              {q.needsRevision && q.revisionReason && (
                                <p className="mt-2 text-xs text-red-700 bg-red-100 px-3 py-1.5 rounded-lg inline-block">
                                  ⚠️ {q.revisionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!analysis && !loadingAnalysis && selectedQuizId && (
                <div className="text-center py-12 text-gray-400">
                  <p>Could not load analysis. Try again.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default QuizDifficultyAnalysis;