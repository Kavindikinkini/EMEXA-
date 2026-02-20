// frontend/src/components/ActivityTab.jsx
// This component should be imported and used in StudentProfile.jsx

import React, { useState, useEffect } from 'react';
import { getStudentActivities, getStudentStats } from '../services/user.service';

const ActivityTab = () => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both activities and stats in parallel
      const [activitiesResponse, statsResponse] = await Promise.all([
        getStudentActivities(50, 0),
        getStudentStats()
      ]);

      console.log('📊 Activities response:', activitiesResponse);
      console.log('📊 Stats response:', statsResponse);

      setActivities(activitiesResponse.data || []);
      setStats(statsResponse.data || null);
    } catch (err) {
      console.error('Failed to fetch activity data:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return '0m 0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <span className="ml-3 text-gray-600">Loading activities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-4 bg-red-50 rounded-lg mb-4">
          <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4 font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No activity yet
        </h3>
        <p className="text-gray-500 mb-6">
          Your quiz attempts will appear here once you start taking quizzes
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-lg border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-teal-700 font-semibold">Total Quizzes</p>
              <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-teal-800">{stats.totalQuizzes}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-700 font-semibold">Average Score</p>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-blue-800">
              {stats.averageScore.toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-purple-700 font-semibold">Accuracy</p>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-purple-800">
              {stats.accuracy > 100
                ? stats.averageScore !== undefined
                  ? `${parseFloat(stats.averageScore).toFixed(1)}%`
                  : `${Math.min(stats.accuracy, 100)}%`
                : `${stats.accuracy}%`}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-orange-700 font-semibold">Total Attempts</p>
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-orange-800">
              {activities.length}
            </p>
          </div>
        </div>
      )}

      {/* Activity List Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Recent Quiz Attempts
        </h3>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-300 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-800 mb-1">
                  {activity.quizTitle}
                </h4>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {activity.teacherName}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {activity.quizCategory}
                  </span>
                </div>
              </div>
              
              {/* Score Badge */}
              <div className={`px-6 py-3 rounded-xl ${getScoreBadgeColor(activity.score)}`}>
                <div className="text-center">
                  <p className="text-3xl font-bold">{activity.score}%</p>
                  <p className="text-xs font-medium mt-1">Score</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Correct Answers</p>
                <p className="text-lg font-bold text-gray-800">
                  {/* correctAnswers = actual correct count derived from score */}
                  {activity.totalQuestions > 0
                    ? Math.round((activity.score / 100) * activity.totalQuestions)
                    : 0}/{activity.totalQuestions}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Accuracy</p>
                <p className="text-lg font-bold text-gray-800">
                  {activity.score !== undefined ? activity.score : 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Hints Used</p>
                <p className="text-lg font-bold text-gray-800">
                  {activity.hintsUsed || 0}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Completed</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatDate(activity.completedAt)}
                </p>
              </div>
            </div>

            {/* Emotion Summary (if available) */}
            {activity.emotionalSummary && activity.emotionalSummary.totalEmotionCaptures > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Emotional Analysis</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">
                    Most Common: <span className="font-semibold capitalize">{activity.emotionalSummary.mostCommonEmotion}</span>
                  </span>
                  <span className="text-gray-500">
                    ({activity.emotionalSummary.totalEmotionCaptures} captures)
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTab;