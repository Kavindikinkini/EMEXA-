// frontend/src/components/BurnoutDetection.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const emotionEmoji = {
  happy: '😊', sad: '😢', angry: '😠',
  confused: '😕', neutral: '😐', surprised: '😲', fear: '😨'
};

const riskColors = {
  Critical: { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    bar: 'bg-red-500',    badge: 'bg-red-100 text-red-800'    },
  High:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' },
  Moderate: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  Low:      { bg: 'bg-emerald-50',border: 'border-emerald-300',text: 'text-emerald-700',bar: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-800'},
};

// Mini bar chart for trend
const TrendChart = ({ trendData }) => {
  if (!trendData || trendData.length === 0) return null;
  const maxScore = 100;

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Score Trend</p>
      <div className="flex items-end gap-2 h-24">
        {trendData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full relative flex items-end justify-center" style={{ height: '80px' }}>
              <div
                className={`w-full rounded-t-md transition-all ${
                  d.score >= 70 ? 'bg-emerald-400' :
                  d.score >= 50 ? 'bg-yellow-400' :
                  d.score >= 30 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ height: `${Math.max(4, (d.score / maxScore) * 80)}px` }}
                title={`${d.date}: ${d.score}% - ${d.emotion}`}
              />
            </div>
            <span className="text-xs text-gray-400">{emotionEmoji[d.emotion] || '😐'}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">Oldest</span>
        <span className="text-xs text-gray-400">Latest</span>
      </div>
    </div>
  );
};

// Gauge component for burnout score
const BurnoutGauge = ({ score, riskLevel }) => {
  const colors = riskColors[riskLevel?.level] || riskColors.Low;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={score >= 70 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 30 ? '#eab308' : '#10b981'}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <span className={`mt-2 px-4 py-1.5 rounded-full text-sm font-bold ${colors.badge}`}>
        {riskLevel?.emoji} {riskLevel?.level} Risk
      </span>
      <p className="text-xs text-gray-500 mt-1 text-center">{riskLevel?.message}</p>
    </div>
  );
};

const BurnoutDetection = ({ userId, isTeacherView = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBurnoutData();
  }, [userId]);

  const fetchBurnoutData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const url = isTeacherView && userId
        ? `${API_BASE}/api/burnout/student/${userId}`
        : `${API_BASE}/api/burnout/my-risk`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      setError('Failed to load burnout assessment.');
      console.error('Burnout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-50 p-3 rounded-xl">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Burnout Risk Assessment</h2>
            <p className="text-sm text-gray-500">Analyzing your patterns...</p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={fetchBurnoutData} className="px-5 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium">
          Retry
        </button>
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-50 p-3 rounded-xl">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Burnout Risk Assessment</h2>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <p className="font-semibold text-orange-900 mb-2">No Data Yet</p>
          <p className="text-orange-700 text-sm">{data?.message}</p>
        </div>
      </div>
    );
  }

  const colors = riskColors[data.riskLevel?.level] || riskColors.Low;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${colors.border} p-8`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 p-3 rounded-xl">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Burnout Risk Assessment</h2>
            <p className="text-sm text-gray-500">
              Based on {data.dataPoints?.quizzesAnalyzed} quizzes · {data.dataPoints?.emotionLogsAnalyzed} emotion captures
            </p>
          </div>
        </div>
        <button
          onClick={fetchBurnoutData}
          className="text-sm text-orange-600 border border-orange-200 px-4 py-2 rounded-xl hover:bg-orange-50 transition-all font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Gauge */}
        <div className="flex flex-col items-center justify-center">
          <BurnoutGauge score={data.burnoutScore} riskLevel={data.riskLevel} />
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-700 mb-3">Risk Factor Breakdown</p>
          {Object.entries(data.breakdown || {}).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span className="font-medium">{val.label}</span>
                <span className="font-bold">{val.score}/{val.max}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${colors.bar}`}
                  style={{ width: `${(val.score / val.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      {data.trendData && data.trendData.length > 0 && (
        <div className={`${colors.bg} rounded-xl p-5 mb-6`}>
          <TrendChart trendData={data.trendData} />
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-700 mb-3">Recommended Actions</p>
          <div className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <span className="text-2xl flex-shrink-0">{rec.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm mb-1">{rec.title}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{rec.description}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-2">→ {rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BurnoutDetection;