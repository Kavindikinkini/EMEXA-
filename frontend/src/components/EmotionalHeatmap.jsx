// frontend/src/components/EmotionalHeatmap.jsx
// Feature 3: Emotional Heatmap for Teachers
// Shows per-question emotional friction across all students

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const EmotionalHeatmap = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [heatmapData, setHeatmapData] = useState(null);
  const [effortData, setEffortData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('heatmap');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Load teacher's quizzes on mount
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Load heatmap when quiz selected
  useEffect(() => {
    if (selectedQuizId) {
      fetchHeatmapData(selectedQuizId);
      fetchEffortData(selectedQuizId);
    }
  }, [selectedQuizId]);

  const fetchQuizzes = async () => {
    try {
      // Try dashboard quizzes first, fallback to my-quizzes
      let quizList = [];
      try {
        const res = await axios.get(`${API_BASE}/api/teacher/dashboard/quizzes`, { headers });
        quizList = res.data?.quizzes || res.data?.data || res.data || [];
      } catch {
        const res2 = await axios.get(`${API_BASE}/api/quizzes/my-quizzes`, { headers });
        quizList = res2.data?.quizzes || res2.data?.data || res2.data || [];
      }
      setQuizzes(quizList);
      if (quizList.length > 0) {
  const firstQuiz = quizList[0];
  const firstId = firstQuiz._id || firstQuiz.id || firstQuiz.quizId;
  console.log('🔍 First quiz object:', firstQuiz);
  console.log('🔍 Using ID:', firstId);
  setSelectedQuizId(firstId);
}
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const fetchHeatmapData = async (quizId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/emotion/heatmap/${quizId}`, { headers });
      setHeatmapData(res.data?.data || res.data);
    } catch (err) {
      console.error('Error fetching heatmap:', err);
      setHeatmapData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchEffortData = async (quizId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/hint/class/${quizId}`, { headers });
      setEffortData(res.data?.data || res.data);
    } catch (err) {
      console.error('Error fetching effort data:', err);
      setEffortData(null);
    }
  };

  // Color scale for friction intensity (0=calm green → 5=frustrated red)
  const getFrictionColor = (intensity) => {
    if (intensity === undefined || intensity === null) return { bg: 'bg-gray-100', text: 'text-gray-400', hex: '#f3f4f6' };
    if (intensity <= 0.2) return { bg: 'bg-green-100', text: 'text-green-700', hex: '#dcfce7' };
    if (intensity <= 0.4) return { bg: 'bg-lime-200', text: 'text-lime-700', hex: '#d9f99d' };
    if (intensity <= 0.6) return { bg: 'bg-yellow-200', text: 'text-yellow-700', hex: '#fef08a' };
    if (intensity <= 0.8) return { bg: 'bg-orange-300', text: 'text-orange-800', hex: '#fdba74' };
    return { bg: 'bg-red-400', text: 'text-red-900', hex: '#f87171' };
  };

  const getEmotionEmoji = (emotion) => {
    const map = { happy: '😊', neutral: '😐', confused: '😕', sad: '😢', angry: '😤', anxious: '😰' };
    return map[emotion] || '😐';
  };

  const getFrictionLabel = (intensity) => {
    if (intensity <= 0.2) return 'Calm';
    if (intensity <= 0.4) return 'Mild';
    if (intensity <= 0.6) return 'Moderate';
    if (intensity <= 0.8) return 'Tense';
    return 'High Friction';
  };

  const selectedQuiz = quizzes.find(q => q._id === selectedQuizId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🌡️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emotional Heatmap</h1>
            <p className="text-sm text-gray-500">See which questions cause emotional friction across your class</p>
          </div>
        </div>
      </div>

      {/* Quiz Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Quiz</label>
        {quizzesLoading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No quizzes found. Create a quiz first.</p>
        ) : (
          <select
            value={selectedQuizId}
            onChange={e => setSelectedQuizId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {quizzes.map((q, i) => (
              <option key={q._id || q.id || i} value={q._id || q.id || q.quizId}>
              {q.title || q.name || q.quizTitle || `Quiz ${i+1}`}
            </option>
        ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'heatmap', label: '🌡️ Emotion Heatmap', desc: 'Per-question friction' },
          { id: 'effort', label: '⚡ Effort Analytics', desc: 'Hint effort breakdown' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* ── HEATMAP TAB ── */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              {!heatmapData || !heatmapData.questionHeatmap?.length ? (
                <EmptyState message="No emotion data yet. Students need to take this quiz first." />
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard
                      icon="👥"
                      label="Total Students"
                      value={heatmapData.totalStudents || 0}
                      color="blue"
                    />
                    <SummaryCard
                      icon="📊"
                      label="Avg Friction"
                      value={`${Math.round((heatmapData.avgClassFriction || 0) * 100)}%`}
                      color="purple"
                    />
                    <SummaryCard
                      icon="🔥"
                      label="Hot Spots"
                      value={heatmapData.frictionHotspots?.length || 0}
                      color="red"
                    />
                    <SummaryCard
                      icon="😤"
                      label="Frustration Rate"
                      value={`${Math.round((heatmapData.avgFrustrationRate || 0) * 100)}%`}
                      color="orange"
                    />
                  </div>

                  {/* Heatmap Grid */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-semibold text-gray-900">Question Friction Map</h2>
                      {/* Legend */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Calm</span>
                        {['#dcfce7','#d9f99d','#fef08a','#fdba74','#f87171'].map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded" style={{ backgroundColor: c }}></div>
                        ))}
                        <span>Friction</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {heatmapData.questionHeatmap.map((q, idx) => {
                        const color = getFrictionColor(q.intensity);
                        return (
                          <div
                            key={idx}
                            className={`${color.bg} rounded-xl p-4 border-2 transition-transform hover:scale-105 cursor-default`}
                            style={{ borderColor: color.hex }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-500">Q{q.questionIndex + 1}</span>
                              <span className="text-lg">{getEmotionEmoji(q.dominantEmotion)}</span>
                            </div>
                            <div className={`text-sm font-bold ${color.text} mb-1`}>
                              {getFrictionLabel(q.intensity)}
                            </div>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <div>Avg friction: <span className="font-medium">{(q.avgFriction || 0).toFixed(1)}/5</span></div>
                              <div>Dominant: <span className="font-medium capitalize">{q.dominantEmotion || 'neutral'}</span></div>
                              {q.frustrationRate > 0.3 && (
                                <div className="text-red-600 font-medium">⚠️ {Math.round(q.frustrationRate * 100)}% frustrated</div>
                              )}
                            </div>
                            {/* Friction bar */}
                            <div className="mt-2 w-full bg-white/60 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-current opacity-60"
                                style={{ width: `${(q.intensity || 0) * 100}%`, backgroundColor: color.hex }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Friction Hotspots */}
                  {heatmapData.frictionHotspots?.length > 0 && (
                    <div className="bg-white rounded-xl border border-red-100 p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">🔥 Friction Hotspots</h2>
                      <p className="text-sm text-gray-500 mb-4">Questions causing the most emotional distress — consider revising these.</p>
                      <div className="space-y-3">
                        {heatmapData.frictionHotspots.map((spot, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-100">
                            <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {spot.questionIndex + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">Question {spot.questionIndex + 1}</span>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                  {getFrictionLabel(spot.intensity)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {getEmotionEmoji(spot.dominantEmotion)} Dominant: {spot.dominantEmotion} · {Math.round(spot.frustrationRate * 100)}% frustrated
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-600">{(spot.avgFriction || 0).toFixed(1)}</div>
                              <div className="text-xs text-gray-400">/ 5.0</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── EFFORT TAB ── */}
          {activeTab === 'effort' && (
            <div className="space-y-6">
              {!effortData || !effortData.questionEffortMap?.length ? (
                <EmptyState message="No hint data yet. Students need to use hints in this quiz first." />
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <SummaryCard icon="💡" label="Total Hint Events" value={effortData.totalHintEvents || 0} color="yellow" />
                    <SummaryCard icon="📋" label="Questions with Hints" value={effortData.questionEffortMap?.length || 0} color="blue" />
                    <SummaryCard
                      icon="⚡"
                      label="Most Hints On"
                      value={effortData.questionEffortMap?.length > 0
                        ? `Q${(effortData.questionEffortMap.reduce((max, q) => q.hintsRequested > max.hintsRequested ? q : max)).questionIndex + 1}`
                        : 'N/A'}
                      color="purple"
                    />
                  </div>

                  {/* Per-question effort breakdown */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-5">Effort Distribution by Question</h2>
                    <div className="space-y-4">
                      {effortData.questionEffortMap.map((q, idx) => {
                        const total = Object.values(q.effortDistribution || {}).reduce((a, b) => a + b, 0);
                        const effortOrder = ['none', 'minimal', 'some', 'good', 'strong'];
                        const effortColors = {
                          none: 'bg-red-400',
                          minimal: 'bg-orange-400',
                          some: 'bg-yellow-400',
                          good: 'bg-blue-400',
                          strong: 'bg-green-500'
                        };
                        return (
                          <div key={idx} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-gray-800">Question {q.questionIndex + 1}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {q.hintsRequested} hint{q.hintsRequested !== 1 ? 's' : ''} requested
                              </span>
                            </div>
                            {/* Stacked bar */}
                            <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-2">
                              {effortOrder.map(level => {
                                const count = q.effortDistribution?.[level] || 0;
                                const pct = total > 0 ? (count / total) * 100 : 0;
                                return pct > 0 ? (
                                  <div
                                    key={level}
                                    className={`${effortColors[level]} transition-all`}
                                    style={{ width: `${pct}%` }}
                                    title={`${level}: ${count}`}
                                  ></div>
                                ) : null;
                              })}
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap gap-2">
                              {effortOrder.map(level => {
                                const count = q.effortDistribution?.[level] || 0;
                                if (count === 0) return null;
                                return (
                                  <span key={level} className="text-xs text-gray-600 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${effortColors[level]} inline-block`}></span>
                                    {level}: {count}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Raw hint events table */}
                  {effortData.rawHints?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Hint Events</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-100">
                              <th className="pb-2 font-medium">Student</th>
                              <th className="pb-2 font-medium">Question</th>
                              <th className="pb-2 font-medium">Effort</th>
                              <th className="pb-2 font-medium">Time Before Hint</th>
                              <th className="pb-2 font-medium">Deduction</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {effortData.rawHints.slice(0, 10).map((hint, i) => {
                              const effortColors = {
                                none: 'bg-red-100 text-red-700',
                                minimal: 'bg-orange-100 text-orange-700',
                                some: 'bg-yellow-100 text-yellow-700',
                                good: 'bg-blue-100 text-blue-700',
                                strong: 'bg-green-100 text-green-700',
                                unknown: 'bg-gray-100 text-gray-600'
                              };
                              return (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="py-2 text-gray-800">{hint.studentName || 'Anonymous'}</td>
                                  <td className="py-2 text-gray-600">Q{(hint.questionIndex || 0) + 1}</td>
                                  <td className="py-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${effortColors[hint.effortLevel] || effortColors.unknown}`}>
                                      {hint.effortLevel || 'unknown'}
                                    </span>
                                  </td>
                                  <td className="py-2 text-gray-600">{hint.timeSpentBeforeHint || 0}s</td>
                                  <td className="py-2 text-red-600 font-medium">−{hint.deduction || 0} pts</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
  );
};

// ── Helper Components ──────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    red: 'bg-red-50 border-red-100',
    orange: 'bg-orange-50 border-orange-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    green: 'bg-green-50 border-green-100',
  };
  return (
    <div className={`${colors[color] || colors.blue} rounded-xl border p-4`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
    <div className="text-5xl mb-3">📭</div>
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

export default EmotionalHeatmap;