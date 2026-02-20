// frontend/src/components/PersonalAnalytics.jsx
// UPDATED VERSION - With Emotion Data Integration
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const PersonalAnalytics = ({ userId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      if (!token) {
        console.log('❌ No token found for analytics');
        setLoading(false);
        return;
      }

      console.log('📊 Fetching personal analytics...');

      const response = await axios.get(
        `${API_BASE}/api/users/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('✅ Analytics data fetched:', response.data);
      setAnalytics(response.data.data || response.data);
      
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-base font-bold text-gray-900 mb-4">Personal Analytics</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-base font-bold text-gray-900 mb-4">Personal Analytics</h2>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalQuizzes === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-base font-bold text-gray-900 mb-4">Personal Analytics</h2>
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 text-sm font-medium mb-2">No analytics data yet</p>
          <p className="text-gray-500 text-xs mb-4">Complete some quizzes to see your performance trends</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
          >
            Refresh Analytics
          </button>
        </div>
      </div>
    );
  }

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceTextColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Emotion helper functions
  const getEmotionColor = (emotion) => {
    const colors = {
      happy: '#10b981',      // green
      neutral: '#facc15',    // yellow
      confused: '#f59e0b',   // orange
      frustrated: '#ef4444', // red
      sad: '#3b82f6',        // blue
      angry: '#dc2626',      // dark red
      surprised: '#8b5cf6',  // purple
      fear: '#6b7280'        // gray
    };
    return colors[emotion?.toLowerCase()] || '#9ca3af';
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      happy: '😊',
      neutral: '😐',
      confused: '😕',
      frustrated: '😤',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      fear: '😨'
    };
    return emojis[emotion?.toLowerCase()] || '❓';
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-bold text-gray-900">Personal Analytics</h2>
        <button
          onClick={fetchAnalytics}
          className="text-green-600 text-xs font-medium hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg p-4 border border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Best Score</p>
              <p className="text-3xl font-bold text-yellow-600">
                {Math.round(analytics.highestScore)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emotional State Summary */}
      {analytics.emotionalData && analytics.emotionalData.totalCaptures > 0 && (
        <div className="mb-6 bg-gradient-to-br from-purple-50 to-white rounded-lg p-5 border border-purple-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Emotional State During Quizzes
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {analytics.emotionalData.distribution && Object.entries(analytics.emotionalData.distribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)
              .map(([emotion, count]) => (
                <div key={emotion} className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <div className="text-2xl mb-1">{getEmotionEmoji(emotion)}</div>
                  <p className="text-xs text-gray-600 capitalize mb-1">{emotion}</p>
                  <p className="text-lg font-bold" style={{ color: getEmotionColor(emotion) }}>
                    {count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round((count / analytics.emotionalData.totalCaptures) * 100)}%
                  </p>
                </div>
              ))}
          </div>

          {analytics.emotionalData.mostCommonEmotion && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Most Common Emotion</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getEmotionEmoji(analytics.emotionalData.mostCommonEmotion)}</span>
                <span className="text-sm font-semibold capitalize" style={{ color: getEmotionColor(analytics.emotionalData.mostCommonEmotion) }}>
                  {analytics.emotionalData.mostCommonEmotion}
                </span>
                <span className="text-xs text-gray-500">
                  ({analytics.emotionalData.mostCommonCount} times)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Trend Chart */}
      {analytics.recentPerformance && analytics.recentPerformance.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Performance Trend</h3>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200">
            {/* Chart area with fixed height */}
            <div className="flex items-end gap-2" style={{ height: "180px" }}>
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between h-full text-xs text-gray-500 font-medium shrink-0 pb-5">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              {/* Bars + grid */}
              <div className="flex-1 h-full relative">
                {/* Dashed grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-5">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className="border-t border-dashed border-gray-300 w-full" />
                  ))}
                </div>

                {/* Bars */}
                <div className="absolute inset-0 flex items-end justify-around gap-1 pb-5">
                  {analytics.recentPerformance.slice(-8).map((quiz, index) => {
                    const score = Math.round(quiz.score || 0);
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center justify-end gap-1 group relative h-full"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-20 shadow-lg">
                          <p className="font-semibold">{quiz.title}</p>
                          {quiz.subject && <p className="text-gray-300">{quiz.subject}</p>}
                          <p className="font-bold mt-1 text-green-400">{score}%</p>
                          <p className="text-gray-400 text-xs">
                            {quiz.correctAnswers}/{quiz.totalQuestions} correct
                          </p>
                          {quiz.emotion && (
                            <p className="text-gray-300 text-xs mt-1">
                              {getEmotionEmoji(quiz.emotion)} {quiz.emotion}
                            </p>
                          )}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                        </div>

                        {/* Score label above bar */}
                        <span className={`text-xs font-bold mb-0.5 ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {score}%
                        </span>

                        {/* The actual bar */}
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 hover:opacity-75 ${getPerformanceColor(score)}`}
                          style={{ height: `${score}%` }}
                        />

                        {/* X-axis label */}
                        <span className="text-xs text-gray-500 font-medium mt-1 shrink-0">
                          Q{index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Showing last {Math.min(analytics.recentPerformance.length, 8)} quizzes • Hover over bars for details
          </p>
        </div>
      )}

      {/* Subject-wise Performance */}
      {analytics.subjectPerformance && analytics.subjectPerformance.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance by Subject</h3>
          <div className="space-y-3">
            {analytics.subjectPerformance.map((subject, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{subject.subject}</span>
                      <p className="text-xs text-gray-500">{subject.count} quiz{subject.count !== 1 ? 'zes' : ''} taken</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getPerformanceTextColor(subject.averageScore)}`}>
                    {Math.round(subject.averageScore)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getPerformanceColor(subject.averageScore)}`}
                      style={{ width: `${Math.min(subject.averageScore, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Best: <span className="font-semibold text-green-600">{Math.round(subject.highestScore)}%</span></span>
                    <span>Lowest: <span className="font-semibold text-red-600">{Math.round(subject.lowestScore)}%</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!analytics.recentPerformance || analytics.recentPerformance.length === 0) && 
       (!analytics.subjectPerformance || analytics.subjectPerformance.length === 0) && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 text-sm font-medium">No detailed analytics available yet</p>
          <p className="text-gray-400 text-xs mt-1">Complete more quizzes to see performance trends and subject breakdowns</p>
        </div>
      )}
    </div>
  );
};

export default PersonalAnalytics;