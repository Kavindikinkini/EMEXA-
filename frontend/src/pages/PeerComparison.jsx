// frontend/src/pages/PeerComparison.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/headerorigin';
import Sidebar from '../components/sidebarorigin';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const EmotionIcon = ({ emotion }) => {
  const map = {
    happy: '😊', neutral: '😐', calm: '😌', confused: '😕',
    anxious: '😰', angry: '😠', sad: '😢', fear: '😨', frustrated: '😤'
  };
  return <span>{map[emotion] || '🙂'}</span>;
};

const RingChart = ({ value, max = 100, size = 120, color = '#10b981', label, sublabel }) => {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
          fontSize="18" fontWeight="bold" fill="#111827">{value}</text>
        {sublabel && (
          <text x="50" y="62" textAnchor="middle" fontSize="10" fill="#6b7280">{sublabel}</text>
        )}
      </svg>
      {label && <p className="text-xs font-semibold text-gray-500 text-center">{label}</p>}
    </div>
  );
};

const DiffBar = ({ mine, classAvg, label }) => {
  const max = Math.max(mine, classAvg, 1);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
        <span>{label}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs w-16 text-teal-700 font-semibold">You</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
              style={{ width: `${(mine / max) * 100}%` }}
            >
              <span className="text-white text-xs font-bold">{mine}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-16 text-gray-500 font-semibold">Class</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
              style={{ width: `${(classAvg / max) * 100}%` }}
            >
              <span className="text-white text-xs font-bold">{classAvg}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PeerComparison = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('peer-comparison');
  const [userName, setUserName] = useState('');
  const [overallData, setOverallData] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'Student');
    fetchOverall();
  }, []);

  const fetchOverall = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/peer-comparison/overall`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverallData(res.data.data);
      if (res.data.data?.subjectComparisons?.length > 0) {
        setSelectedQuizId(res.data.data.subjectComparisons[0].quizId);
      }
    } catch (err) {
      console.error('Overall fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizComparison = async (qId) => {
    if (!qId) return;
    setQuizLoading(true);
    setQuizData(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/peer-comparison/${qId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizData(res.data.data);
    } catch (err) {
      console.error('Quiz comparison error:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    if (selectedQuizId) fetchQuizComparison(selectedQuizId);
  }, [selectedQuizId]);

  const getRankLabel = (rank, total) => {
    if (rank === 1) return '🥇 Top of class!';
    if (rank === 2) return '🥈 2nd place';
    if (rank === 3) return '🥉 3rd place';
    const pct = Math.round(((total - rank) / total) * 100);
    if (pct >= 90) return `Top 10% 🌟`;
    if (pct >= 75) return `Top 25% ⭐`;
    if (pct >= 50) return `Top 50%`;
    return `Keep going 💪`;
  };

  const studentMenuItems = [
    {
      id: 'dashboard', label: 'Dashboard',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
      onClick: () => navigate('/dashboard')
    },
    {
      id: 'wellness', label: 'Wellness Centre',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
      onClick: () => navigate('/wellness-centre')
    },
    {
      id: 'gamification', label: 'My Progress',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      onClick: () => navigate('/gamification')
    },
    {
      id: 'peer-comparison', label: 'Peer Comparison',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      onClick: () => navigate('/peer-comparison')
    },
    {
      id: 'journal', label: 'My Journal',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      onClick: () => navigate('/journal')
    },
    {
      id: 'profile', label: 'Profile',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      onClick: () => navigate('/profile')
    },
  ];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header userName={userName} userRole="student" />
        <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} />
        <div className="ml-52 pt-14 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading your comparison data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header userName={userName} userRole="student" />
      <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} />

      <div className="ml-52 pt-14">
        <div className="p-8 max-w-6xl mx-auto">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Peer Comparison</h1>
            <p className="text-gray-500">See how you compare — all names are anonymous to protect privacy.</p>
          </div>

          {/* No data state */}
          {(!overallData || overallData.totalAttempts === 0) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No quiz data yet</h3>
              <p className="text-gray-500 text-sm">Complete a quiz to see how you compare with your class.</p>
              <button onClick={() => navigate('/dashboard')}
                className="mt-6 px-6 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition font-semibold text-sm">
                Go to Dashboard
              </button>
            </div>
          )}

          {overallData && overallData.totalAttempts > 0 && (
            <>
              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                <div className="flex">
                  {['overview', 'by-quiz'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
                        activeTab === tab ? 'text-teal-700 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}>
                      {tab === 'overview' ? '📊 Overall Overview' : '🎯 Quiz Breakdown'}
                      {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top stats row */}
                  <div className="grid grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Avg Score</p>
                      <RingChart value={Math.round(overallData.myOverallAvg)} color="#14b8a6" sublabel="/ 100" />
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quizzes Taken</p>
                      <div className="flex items-center justify-center h-[120px]">
                        <span className="text-5xl font-black text-teal-600">{overallData.totalQuizzesTaken}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Total Attempts</p>
                      <div className="flex items-center justify-center h-[120px]">
                        <span className="text-5xl font-black text-blue-600">{overallData.totalAttempts}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject-wise comparison table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Quiz-by-Quiz Comparison</h2>
                    <div className="space-y-3">
                      {overallData.subjectComparisons.map((quiz, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 hover:bg-teal-50 transition-all border border-transparent hover:border-teal-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{quiz.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{quiz.subject} • {quiz.totalStudents} students</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                quiz.percentile >= 75 ? 'bg-green-100 text-green-700' :
                                quiz.percentile >= 50 ? 'bg-blue-100 text-blue-700' :
                                quiz.percentile >= 25 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {getRankLabel(quiz.rank, quiz.totalStudents)}
                              </span>
                            </div>
                          </div>
                          <DiffBar mine={Math.round(quiz.myScore)} classAvg={Math.round(quiz.classAvg)} label="" />
                          <p className="text-xs text-gray-400 text-right">Rank #{quiz.rank} of {quiz.totalStudents} • Top {100 - quiz.percentile}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* BY-QUIZ TAB */}
              {activeTab === 'by-quiz' && (
                <div className="space-y-6">
                  {/* Quiz selector */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select a Quiz</label>
                    <select
                      value={selectedQuizId}
                      onChange={e => setSelectedQuizId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-300 focus:border-teal-500 text-sm font-medium"
                    >
                      {overallData.subjectComparisons.map(q => (
                        <option key={q.quizId} value={q.quizId}>{q.title}</option>
                      ))}
                    </select>
                  </div>

                  {quizLoading && (
                    <div className="text-center py-12">
                      <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Loading quiz comparison...</p>
                    </div>
                  )}

                  {quizData && !quizLoading && quizData.totalStudents > 0 && (
                    <>
                      {/* Rank card */}
                      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-teal-100 text-sm font-medium mb-1">Your Standing</p>
                            <p className="text-4xl font-black">Rank #{quizData.rank}</p>
                            <p className="text-teal-100 mt-1 text-sm">out of {quizData.totalStudents} students</p>
                            <p className="text-white font-semibold mt-2 text-lg">
                              {getRankLabel(quizData.rank, quizData.totalStudents)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="bg-white/20 rounded-2xl p-4">
                              <RingChart
                                value={Math.round(quizData.percentile)}
                                size={100}
                                color="#fff"
                                sublabel="percentile"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score comparison */}
                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                          <h3 className="font-bold text-gray-900 mb-4">Score Comparison</h3>
                          <div className="space-y-4">
                            {[
                              { label: 'Your Score', value: Math.round(quizData.myScore), color: 'bg-teal-500' },
                              { label: 'Class Average', value: Math.round(quizData.classStats.avg), color: 'bg-gray-400' },
                              { label: 'Highest Score', value: Math.round(quizData.classStats.max), color: 'bg-green-500' },
                            ].map((item, i) => (
                              <div key={i}>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span className="font-semibold">{item.label}</span>
                                  <span className="font-bold text-gray-900">{item.value}%</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                    style={{ width: `${item.value}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                          <h3 className="font-bold text-gray-900 mb-4">Score Distribution</h3>
                          <div className="space-y-2">
                            {quizData.scoreDistribution?.map((bucket, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 w-16 font-medium">{bucket.range}</span>
                                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-teal-400 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                                    style={{ width: `${Math.max((bucket.count / quizData.totalStudents) * 100, bucket.count > 0 ? 8 : 0)}%` }}
                                  >
                                    {bucket.count > 0 && <span className="text-white text-xs font-bold">{bucket.count}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hints + Emotion row */}
                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                          <h3 className="font-bold text-gray-900 mb-4">💡 Hints Used</h3>
                          <div className="flex items-center justify-around">
                            <div className="text-center">
                              <p className="text-4xl font-black text-teal-600">{quizData.hintsComparison?.mine ?? 0}</p>
                              <p className="text-xs text-gray-400 mt-1 font-semibold">You</p>
                            </div>
                            <div className="w-px h-16 bg-gray-200" />
                            <div className="text-center">
                              <p className="text-4xl font-black text-gray-400">{quizData.hintsComparison?.classAvg ?? 0}</p>
                              <p className="text-xs text-gray-400 mt-1 font-semibold">Class Avg</p>
                            </div>
                          </div>
                          <p className="text-xs text-center text-gray-400 mt-4">
                            {(quizData.hintsComparison?.mine ?? 0) < (quizData.hintsComparison?.classAvg ?? 0)
                              ? '✨ You used fewer hints than average!'
                              : (quizData.hintsComparison?.mine ?? 0) > (quizData.hintsComparison?.classAvg ?? 0)
                              ? '💪 Try to rely on hints less next time'
                              : '👍 Right on the class average'}
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                          <h3 className="font-bold text-gray-900 mb-4">🧠 Emotional Calm Rate</h3>
                          <div className="flex items-center justify-around">
                            <div className="text-center">
                              <RingChart value={quizData.emotionComparison?.myCalmRate ?? 0} color="#14b8a6" size={90} sublabel="%" />
                              <p className="text-xs text-gray-400 mt-2 font-semibold">You</p>
                            </div>
                            <div className="w-px h-16 bg-gray-200" />
                            <div className="text-center">
                              <RingChart value={quizData.emotionComparison?.classCalmRate ?? 0} color="#9ca3af" size={90} sublabel="%" />
                              <p className="text-xs text-gray-400 mt-2 font-semibold">Class</p>
                            </div>
                          </div>
                          <p className="text-xs text-center text-gray-400 mt-2">
                            Calm = happy, neutral or calm emotions
                          </p>
                        </div>
                      </div>

                      {/* My emotion breakdown */}
                      {quizData.emotionComparison?.myEmotions && Object.keys(quizData.emotionComparison.myEmotions).length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                          <h3 className="font-bold text-gray-900 mb-4">Your Emotion Breakdown vs Class</h3>
                          <div className="grid grid-cols-2 gap-8">
                            {[
                              { label: 'You', data: quizData.emotionComparison.myEmotions },
                              { label: 'Class Average', data: quizData.emotionComparison.classEmotions }
                            ].map((side, si) => {
                              const total = Object.values(side.data).reduce((a, b) => a + b, 0) || 1;
                              return (
                                <div key={si}>
                                  <p className="text-sm font-semibold text-gray-500 mb-3">{side.label}</p>
                                  <div className="space-y-2">
                                    {Object.entries(side.data)
                                      .sort(([, a], [, b]) => b - a)
                                      .map(([emotion, count]) => (
                                        <div key={emotion} className="flex items-center gap-2">
                                          <EmotionIcon emotion={emotion} />
                                          <span className="text-xs text-gray-600 capitalize w-20">{emotion}</span>
                                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-teal-400 rounded-full transition-all duration-700"
                                              style={{ width: `${(count / total) * 100}%` }}
                                            />
                                          </div>
                                          <span className="text-xs font-bold text-gray-500">
                                            {Math.round((count / total) * 100)}%
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
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

export default PeerComparison;