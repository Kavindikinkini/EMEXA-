import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './headerorigin';

const TeacherActivityTab = () => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizPerformance, setQuizPerformance] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showQuizDetailModal, setShowQuizDetailModal] = useState(false);
  const [quizDetails, setQuizDetails] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [activitiesResponse, statsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/teacher/activities', { headers }),
        axios.get('http://localhost:5000/api/teacher/stats', { headers })
      ]);

      console.log('📊 Activities response:', activitiesResponse.data);
      console.log('📊 Stats response:', statsResponse.data);

      setActivities(activitiesResponse.data.data || []);
      setStats(statsResponse.data.data || null);
    } catch (err) {
      console.error('Failed to fetch activity data:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizCardClick = async (quiz) => {
  try {
    console.log('📝 Fetching quiz details for:', quiz.id);
    
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/teacher-quizzes/${quiz.id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Quiz details response:', response.data);
    
    // ✅ Handle both response formats
    const quizData = response.data.quiz || response.data.data || response.data;
    
    console.log('📊 Quiz data:', quizData);
    console.log('📋 Questions:', quizData.questions);
    console.log('📋 Questions length:', quizData.questions?.length);
    
    if (quizData.questions && quizData.questions.length > 0) {
      console.log('📝 First question:', quizData.questions[0]);
    }
    
    setQuizDetails(quizData);
    setShowQuizDetailModal(true);
  } catch (err) {
    console.error('❌ Failed to fetch quiz details:', err);
    console.error('Error response:', err.response?.data);
    alert('Failed to load quiz details: ' + (err.response?.data?.message || err.message));
  }
};

  const fetchQuizPerformance = async (quizId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/teacher/quiz/${quizId}/performance`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setQuizPerformance(response.data.data);
      setShowPerformanceModal(true);
    } catch (err) {
      console.error('Failed to fetch quiz performance:', err);
      alert('Failed to load quiz performance details');
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

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      closed: 'bg-red-100 text-red-700'
    };

    return badges[status] || badges.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      scheduled: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      active: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      closed: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    };

    return icons[status] || icons.draft;
  };

  if (loading) {
    return (
      <>
        <Header 
          userName={localStorage.getItem('userName') || 'Teacher'}
          userRole="teacher"
        />
        <div className="pt-16 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <span className="ml-3 text-gray-600">Loading activities...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header 
          userName={localStorage.getItem('userName') || 'Teacher'}
          userRole="teacher"
        />
        <div className="pt-16 text-center py-12">
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
      </>
    );
  }

  if (activities.length === 0) {
    return (
      <>
        <Header 
          userName={localStorage.getItem('userName') || 'Teacher'}
          userRole="teacher"
        />
        <div className="pt-16 text-center py-16">
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
            No quizzes yet
          </h3>
          <p className="text-gray-500 mb-6">
            Your created quizzes and their performance will appear here
          </p>
          <button
            onClick={() => window.location.href = '/teacher-create-quiz'}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Create Your First Quiz
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header - Always visible */}
      <Header 
        userName={localStorage.getItem('userName') || 'Teacher'}
        userRole="teacher"
      />
      
      {/* Main Content with padding for fixed header */}
      <div className="pt-16 px-6 py-6">
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
                <p className="text-xs text-teal-600 mt-1">
                  {stats.draftQuizzes} drafts • {stats.activeQuizzes} active • {stats.closedQuizzes || 0} closed
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-blue-700 font-semibold">Total Attempts</p>
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-blue-800">{stats.totalAttempts}</p>
                <p className="text-xs text-blue-600 mt-1">{stats.totalStudents} unique students</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-purple-700 font-semibold">Avg Score</p>
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-purple-800">{stats.averageScore.toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-orange-700 font-semibold">Engagement</p>
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-orange-800">{stats.engagementRate}%</p>
              </div>
            </div>
          )}

          {/* Activity List Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Created Quizzes
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

          {/* Activity List - CLICKABLE CARDS */}
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleQuizCardClick(activity)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-300 transition-all duration-200 cursor-pointer group"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                        {activity.quizTitle}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(activity.status || 'draft')}`}>
                        {getStatusIcon(activity.status || 'draft')}
                        {(activity.status || 'draft').charAt(0).toUpperCase() + (activity.status || 'draft').slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {activity.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Grade {activity.gradeLevel}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Click to view details
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Questions</p>
                    <p className="text-lg font-bold text-gray-800">
                      {activity.totalQuestions}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Attempts</p>
                    <p className="text-lg font-bold text-gray-800">
                      {activity.totalAttempts}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Students</p>
                    <p className="text-lg font-bold text-gray-800">
                      {activity.studentCount}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Avg Score</p>
                    <p className={`text-lg font-bold ${
                      activity.averageScore >= 80 ? 'text-green-600' :
                      activity.averageScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {activity.averageScore.toFixed(1)}%
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>

                {/* View Performance Button */}
                {activity.totalAttempts > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchQuizPerformance(activity.id);
                      }}
                      className="w-full px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Student Performance
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Quiz Detail Modal - PORTAL STYLE with z-[9999] */}
      {showQuizDetailModal && quizDetails && (
        <div className="fixed inset-0 z-[9999]">
          {/* Blurred Background Overlay */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowQuizDetailModal(false)}
          ></div>
          
          {/* Modal Container - Centered */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-7xl w-[calc(100%-2rem)] max-h-[85vh]">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {quizDetails.title}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(quizDetails.status)}`}>
                        {getStatusIcon(quizDetails.status)}
                        {(quizDetails.status || 'draft').charAt(0).toUpperCase() + (quizDetails.status || 'draft').slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {quizDetails.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Grade {Array.isArray(quizDetails.gradeLevel) ? quizDetails.gradeLevel.join(', ') : quizDetails.gradeLevel}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {quizDetails.duration || 'N/A'} mins
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowQuizDetailModal(false)}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-5rem)] bg-gray-50">
                <div className="p-6">
                  {/* Quiz Information */}
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-900 mb-3">Quiz Information</h3>
                    <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Created Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(quizDetails.createdAt)}</p>
                      </div>
                      {quizDetails.scheduleDate && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Scheduled Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(quizDetails.scheduleDate)}</p>
                        </div>
                      )}
                      {quizDetails.dueDate && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Due Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(quizDetails.dueDate)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Questions</p>
                        <p className="text-sm font-medium text-gray-900">{quizDetails.questions?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3">Questions</h3>
                    <div className="space-y-3">
                      {quizDetails.questions && quizDetails.questions.length > 0 ? (
                        quizDetails.questions.map((question, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-7 h-7 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </span>
                              
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-3 text-sm">
                                  {question.questionText || question.question || question.text || 'No question text'}
                                </p>
                                
                                {question.type === 'mcq' && question.options && question.options.length > 0 && (
                                  <div className="space-y-2">
                                    {question.options.map((option, optIndex) => {
                                      const isCorrect = option.isCorrect === true;
                                      
                                      return (
                                        <div
                                          key={optIndex}
                                          className={`flex items-center gap-2 p-2.5 rounded-lg ${
                                            isCorrect 
                                              ? 'bg-green-50 border border-green-300' 
                                              : 'bg-gray-50 border border-gray-200'
                                          }`}
                                        >
                                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isCorrect 
                                              ? 'bg-green-500 text-white' 
                                              : 'bg-gray-300 text-gray-600'
                                          }`}>
                                            {String.fromCharCode(65 + optIndex)}
                                          </span>
                                          <span className={`flex-1 text-sm ${isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                                            {option.text || option}
                                          </span>
                                          {isCorrect && (
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {question.type === 'short' && (
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-700 font-semibold mb-1">Expected Answer:</p>
                                    <p className="text-sm text-gray-900">{question.shortAnswer || 'Teacher will grade manually'}</p>
                                  </div>
                                )}

                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                                    {question.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                                  </span>
                                  {question.hints && question.hints.filter(h => h && h.trim()).length > 0 && (
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-medium flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      {question.hints.filter(h => h && h.trim()).length} hints
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">No questions available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && quizPerformance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {quizPerformance.quiz.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {quizPerformance.quiz.subject} • {quizPerformance.quiz.totalQuestions} questions
                  </p>
                </div>
                <button
                  onClick={() => setShowPerformanceModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Attempts</p>
                  <p className="text-2xl font-bold text-blue-800">{quizPerformance.statistics.totalAttempts}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Unique Students</p>
                  <p className="text-2xl font-bold text-green-800">{quizPerformance.statistics.uniqueStudents}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-purple-800">{quizPerformance.statistics.averageScore.toFixed(1)}%</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Highest Score</p>
                  <p className="text-2xl font-bold text-orange-800">{quizPerformance.statistics.highestScore}%</p>
                </div>
              </div>

              {/* Student Attempts */}
              <h3 className="text-lg font-bold text-gray-900 mb-4">Student Attempts</h3>
              <div className="space-y-3">
                {quizPerformance.attempts.map((attempt) => (
                  <div
                    key={attempt.attemptId}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{attempt.studentName}</p>
                      <p className="text-sm text-gray-600">{attempt.studentEmail}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Completed: {formatDate(attempt.completedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        attempt.score >= 80 ? 'text-green-600' :
                        attempt.score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {attempt.score}%
                      </p>
                      <p className="text-sm text-gray-600">
                        {attempt.correctAnswers}/{attempt.totalQuestions} correct
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherActivityTab;