// frontend/src/components/StudyRecommendations.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const categoryConfig = {
  emotional: { color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', icon: '💜', label: 'Emotional' },
  academic:  { color: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700',   icon: '📚', label: 'Academic'  },
  strategy:  { color: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: '🎯', label: 'Strategy' },
  wellbeing: { color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: '🌿', label: 'Wellbeing' },
};

const priorityConfig = {
  high:   { color: 'bg-red-100 text-red-700',    label: 'High Priority'   },
  medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium Priority' },
  low:    { color: 'bg-green-100 text-green-700', label: 'Low Priority'    },
};

const emotionEmoji = {
  happy: '😊', sad: '😢', angry: '😠',
  confused: '😕', neutral: '😐', surprised: '😲', fear: '😨'
};

const StudyRecommendations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/study-recommendations/my-recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Study Recommendations</h2>
            <p className="text-sm text-gray-500">Analyzing your emotional & performance patterns...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button onClick={fetchRecommendations} className="px-5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI Study Recommendations</h2>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-semibold text-emerald-900 mb-2">No Data Yet</p>
          <p className="text-emerald-700 text-sm">Complete some quizzes to unlock personalized AI study recommendations based on your emotional patterns!</p>
        </div>
      </div>
    );
  }

  const healthScore = data.emotionalHealthScore || 0;
  const healthColor = healthScore >= 70 ? 'text-emerald-600' : healthScore >= 40 ? 'text-yellow-600' : 'text-red-600';
  const healthBg = healthScore >= 70 ? 'bg-emerald-50 border-emerald-200' : healthScore >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Study Recommendations</h2>
            <p className="text-sm text-gray-500">Based on {data.dataPoints?.quizzesAnalyzed} quizzes & {data.dataPoints?.emotionLogsAnalyzed} emotion captures</p>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className={`${healthBg} border rounded-xl p-4 text-center`}>
          <p className="text-xs font-medium text-gray-500 mb-1">Emotional Health</p>
          <p className={`text-2xl font-black ${healthColor}`}>{healthScore}</p>
          <p className="text-xs text-gray-400">/100</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Avg Score</p>
          <p className="text-2xl font-black text-blue-600">{data.dataPoints?.avgScore}%</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Dominant Emotion</p>
          <p className="text-2xl">{emotionEmoji[data.dataPoints?.dominantEmotion] || '😐'}</p>
          <p className="text-xs text-gray-500 capitalize">{data.dataPoints?.dominantEmotion}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Hints Used</p>
          <p className="text-2xl font-black text-amber-600">{data.dataPoints?.totalHints}</p>
        </div>
      </div>

      {/* Overall Insight */}
      {data.overallInsight && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm mb-1">AI Insight</p>
              <p className="text-gray-700 text-sm leading-relaxed">{data.overallInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.recommendations?.map((rec) => {
          const catConfig = categoryConfig[rec.category] || categoryConfig.strategy;
          const priConfig = priorityConfig[rec.priority] || priorityConfig.medium;
          const isExpanded = expandedCard === rec.id;

          return (
            <div
              key={rec.id}
              className={`${catConfig.color} border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md`}
              onClick={() => setExpandedCard(isExpanded ? null : rec.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{catConfig.icon}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${catConfig.badge}`}>
                    {catConfig.label}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${priConfig.color}`}>
                  {priConfig.label}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 mb-2">{rec.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{rec.description}</p>

              {/* Emotion Insight */}
              <div className="bg-white/60 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 italic">💡 {rec.emotionInsight}</p>
              </div>

              {/* Expandable Action Items */}
              {isExpanded && rec.actionItems && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Action Steps:</p>
                  {rec.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs font-bold text-emerald-600">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
                {isExpanded ? 'Click to collapse' : 'Click for action steps'}
              </div>
            </div>
          );
        })}
      </div>

      {lastRefresh && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default StudyRecommendations;