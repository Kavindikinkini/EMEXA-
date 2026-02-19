// frontend/src/pages/TeacherDashboard.jsx
// FIXED VERSION - With Auto-Refresh and Notification Listener

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AdminViewWrapper from "../components/AdminViewWrapper";
import Header from "../components/headerorigin";
import Sidebar from "../components/sidebarorigin";
import TeacherQuizzes from "./TeacherQuizzes";
import TeacherCreateQuiz from "./TeacherCreateQuiz";
import TeacherQuizDraft from "./TeacherQuizDraft";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const adminToken = localStorage.getItem("adminToken");
  const isAdminViewing = localStorage.getItem("adminViewingAs");
  
  const [activeMenuItem, setActiveMenuItem] = useState(() => {
    if (isAdminViewing && adminToken) {
      return "dashboard";
    }
    const saved = localStorage.getItem("teacherActiveMenuItem");
    if (saved === "profile") {
      return "dashboard";
    }
    return saved || "dashboard";
  });
  
  const [userName, setUserName] = useState("");
  const [editingDraftId, setEditingDraftId] = useState(null);
  
  // ADDED: State for dashboard refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Handle navigation state from TeacherProfile
    if (location.state?.activeMenu) {
      setActiveMenuItem(location.state.activeMenu);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isAdminViewing || !adminToken) {
      localStorage.setItem("teacherActiveMenuItem", activeMenuItem);
    }
  }, [activeMenuItem, isAdminViewing, adminToken]);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  useEffect(() => {
    if (activeMenuItem === "create-quiz" && !editingDraftId) {
      setEditingDraftId(null);
    } else if (
      activeMenuItem !== "create-quiz" &&
      activeMenuItem !== "quiz-drafts"
    ) {
      setEditingDraftId(null);
    } else if (activeMenuItem === "quizzes") {
      // Clear editing state when going to main quiz page
      setEditingDraftId(null);
    }
  }, [activeMenuItem, editingDraftId]);

  // ADDED: Notification refresh listener (like student dashboard)
  useEffect(() => {
    if (activeMenuItem === 'dashboard') {
      // Force refresh notification count when dashboard is active
      console.log('🔔 Teacher Dashboard active - refreshing notifications');
      window.dispatchEvent(new Event('refreshNotifications'));
      
      // Listen for quiz submission events to refresh dashboard
      const handleQuizSubmission = () => {
        console.log('📝 Quiz submission detected - refreshing dashboard');
        setRefreshTrigger(prev => prev + 1);
      };
      
      window.addEventListener('quizSubmitted', handleQuizSubmission);
      window.addEventListener('refreshTeacherDashboard', handleQuizSubmission);
      
      return () => {
        window.removeEventListener('quizSubmitted', handleQuizSubmission);
        window.removeEventListener('refreshTeacherDashboard', handleQuizSubmission);
      };
    }
  }, [activeMenuItem]);

  const teacherMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
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
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      onClick: () => {
        setActiveMenuItem("dashboard");
      }
    },
    {
      id: "quizzes",
      label: "Quiz",
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      onClick: () => {
        setActiveMenuItem("quizzes");
        setEditingDraftId(null);
      }
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      onClick: () => {
        navigate("/teacher-profile");
      }
    },
  ];

  const renderContent = () => {
    switch (activeMenuItem) {
      case "dashboard":
        return <DashboardContent refreshTrigger={refreshTrigger} />; {/* ADDED: Pass refreshTrigger */}
      case "quizzes":
        return <TeacherQuizzes setActiveMenuItem={setActiveMenuItem} />;
      case "create-quiz":
        return (
          <TeacherCreateQuiz
            setActiveMenuItem={setActiveMenuItem}
            editingDraftId={editingDraftId}
            setEditingDraftId={setEditingDraftId}
          />
        );
      case "quiz-drafts":
        return (
          <TeacherQuizDraft
            setActiveMenuItem={setActiveMenuItem}
            setEditingDraftId={setEditingDraftId}
          />
        );
      default:
        return <DashboardContent refreshTrigger={refreshTrigger} />;
    }
  };

  if (isAdminViewing && adminToken) {
    return (
      <AdminViewWrapper dashboardType="teacher">
        <div className="bg-gradient-to-br from-green-50 to-white min-h-screen">
          {renderContent()}
        </div>
      </AdminViewWrapper>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-white min-h-screen">
      <Header userName={userName} userRole="teacher" />
      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        menuItems={teacherMenuItems}
      />
      <div className="ml-64 pt-20 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

// Dashboard Content Component with ACTUAL DATA + AUTO-REFRESH
const DashboardContent = ({ refreshTrigger }) => { {/* ADDED: Accept refreshTrigger prop */}
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [classProgress, setClassProgress] = useState([]);
  const [engagementTrend, setEngagementTrend] = useState([]);
  const [emotionalState, setEmotionalState] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAllStudents, setShowAllStudents] = useState(false);

  // FIXED: Add refreshTrigger to dependency array for auto-refresh
  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]); {/* ADDED: Refresh when refreshTrigger changes */}

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.log('❌ No token found');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      console.log('🔄 Fetching teacher dashboard data...');

      // Fetch all dashboard data in parallel
      const [statsRes, progressRes, trendRes, emotionRes, studentsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/teachers/dashboard/stats`, { headers }),
        axios.get(`${API_BASE}/api/teachers/dashboard/class-progress`, { headers }),
        axios.get(`${API_BASE}/api/teachers/dashboard/engagement-trend`, { headers }),
        axios.get(`${API_BASE}/api/teachers/dashboard/emotional-state`, { headers }),
        axios.get(`${API_BASE}/api/teachers/dashboard/students`, { headers })
      ]);

      console.log('✅ Dashboard data fetched successfully');
      
      setDashboardStats(statsRes.data.data);
      setClassProgress(progressRes.data.data);
      setEngagementTrend(trendRes.data.data);
      setEmotionalState(emotionRes.data.data);
      setStudents(studentsRes.data.data);
      
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate percentages for progress bars
  const presentPercentage = dashboardStats?.totalStudents > 0 
    ? Math.round((dashboardStats.presentToday / dashboardStats.totalStudents) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Admin Viewing Banner */}
        {localStorage.getItem("adminViewingAs") === "teacher" && localStorage.getItem("adminToken") && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Admin View Mode - Viewing: Teacher
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    You are viewing this teacher's dashboard as an
                    administrator
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Clear all viewing flags
                  localStorage.removeItem("adminViewingAs");
                  localStorage.removeItem("adminViewingUser");

                  // Navigate back to user management
                  window.location.href = "/admin/user-management";
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
              >
                ← Back to User Management
              </button>
            </div>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Teacher Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Monitor and manage your classes and student performance
        </p>

      {/* Stats Cards with ACTUAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Students */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats?.totalStudents || 0}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Present today</span>
              <span className="font-semibold text-gray-900">
                {dashboardStats?.presentToday || 0}/{dashboardStats?.totalStudents || 0}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${presentPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Average Progress */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">
                Average Progress
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats?.averageProgress || 0}%
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Target</span>
              <span className="font-semibold text-gray-900">
                {dashboardStats?.targetProgress || 80}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  (dashboardStats?.averageProgress || 0) >= (dashboardStats?.targetProgress || 80)
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(dashboardStats?.averageProgress || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Engagement Level */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
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
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">
                Engagement Level
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats?.engagementLevel || 'Low'}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Weekly change</span>
              <span className="font-semibold text-green-600">
                +{dashboardStats?.weeklyChange || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dashboardStats?.engagementPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Progress Chart with ACTUAL DATA */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Class Progress
        </h2>
        <div className="relative h-80 pl-8 pr-4 pt-2 pb-16">
          <div className="absolute left-0 top-2 bottom-16 w-8 flex flex-col justify-between text-xs text-gray-600">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          <div className="absolute left-8 right-4 top-2 bottom-16 border-l border-b border-gray-400">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-t border-dotted border-gray-300"></div>
              ))}
            </div>

            <div className="absolute inset-0 flex justify-around pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-l border-dotted border-gray-300 h-full"></div>
              ))}
            </div>

            <div className="absolute inset-0 flex items-end justify-around px-8">
              {classProgress.map((week, index) => (
                <div key={index} className="flex items-end gap-1.5 h-full">
                  <div
                    className="w-10 bg-teal-700 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${week.completed}%` }}
                  ></div>
                  <div
                    className="w-10 bg-green-300 rounded-t transition-all hover:opacity-80"
                    style={{ height: `${week.target}%` }}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute left-8 right-4 bottom-0 flex justify-around text-sm text-gray-700 font-medium">
            {classProgress.map((week, index) => (
              <span key={index}>{week.label}</span>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center gap-8 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-700 rounded-sm"></div>
            <span className="text-sm text-gray-700">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
            <span className="text-sm text-gray-700">Target</span>
          </div>
        </div>
      </div>

      {/* Engagement Trend & Emotional State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Engagement Trend Chart with ACTUAL DATA */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Engagement Trend
          </h2>
          <div className="relative h-64 pl-8 pr-4 pt-2 pb-12">
            <div className="absolute left-0 top-2 bottom-12 w-8 flex flex-col justify-between text-xs text-gray-600">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            <div className="absolute left-8 right-4 top-2 bottom-12 border-l border-b border-gray-400">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-t border-dotted border-gray-300"></div>
                ))}
              </div>

              <div className="absolute inset-0 flex justify-around pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-l border-dotted border-gray-300 h-full"></div>
                ))}
              </div>

              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {engagementTrend.length > 0 && (
                  <>
                    <polygon
                      points={engagementTrend.map((d, i) => 
                        `${(i / (engagementTrend.length - 1)) * 100},${100 - d.score}`
                      ).join(' ') + ' 100,100 0,100'}
                      fill="#0d9488"
                      opacity="0.1"
                    />
                    <polyline
                      points={engagementTrend.map((d, i) => 
                        `${(i / (engagementTrend.length - 1)) * 100},${100 - d.score}`
                      ).join(' ')}
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </svg>

              <div className="absolute inset-0">
                {engagementTrend.map((point, idx) => (
                  <div
                    key={idx}
                    className="absolute w-2 h-2 bg-teal-700 rounded-full"
                    style={{
                      left: `${(idx / (engagementTrend.length - 1)) * 100}%`,
                      top: `${100 - point.score}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="absolute left-8 right-4 bottom-0 flex justify-around text-xs text-gray-600">
              {engagementTrend.map((day, index) => (
                <span key={index}>{day.day}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-700 rounded-full"></div>
              <span className="text-xs text-gray-700">Engagement %</span>
            </div>
          </div>
        </div>

        {/* Emotional State with ACTUAL DATA */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Emotional State
          </h2>
          <div className="flex justify-center items-center h-64">
            <svg className="w-64 h-64" viewBox="0 0 200 200">
              {emotionalState && (
                <>
                  {/* Happy */}
                  <path
                    d={`M 100,100 L 100,0 A 100,100 0 0,1 ${100 + 100 * Math.cos((emotionalState.happy / 100) * 2 * Math.PI - Math.PI/2)},${100 + 100 * Math.sin((emotionalState.happy / 100) * 2 * Math.PI - Math.PI/2)} Z`}
                    fill="#0f766e"
                  />
                  {/* Confused */}
                  <path
                    d={`M 100,100 L ${100 + 100 * Math.cos((emotionalState.happy / 100) * 2 * Math.PI - Math.PI/2)},${100 + 100 * Math.sin((emotionalState.happy / 100) * 2 * Math.PI - Math.PI/2)} A 100,100 0 0,1 ${100 + 100 * Math.cos(((emotionalState.happy + emotionalState.confused) / 100) * 2 * Math.PI - Math.PI/2)},${100 + 100 * Math.sin(((emotionalState.happy + emotionalState.confused) / 100) * 2 * Math.PI - Math.PI/2)} Z`}
                    fill="#86efac"
                  />
                  {/* Frustrated */}
                  <path
                    d={`M 100,100 L ${100 + 100 * Math.cos(((emotionalState.happy + emotionalState.confused) / 100) * 2 * Math.PI - Math.PI/2)},${100 + 100 * Math.sin(((emotionalState.happy + emotionalState.confused) / 100) * 2 * Math.PI - Math.PI/2)} A 100,100 0 0,1 ${100 + 100 * Math.cos(((emotionalState.happy + emotionalState.confused + emotionalState.frustrated) / 100) * 2 * Math.PI - Math.PI/2)},${100 + 100 * Math.sin(((emotionalState.happy + emotionalState.confused + emotionalState.frustrated) / 100) * 2 * Math.PI - Math.PI/2)} Z`}
                    fill="#14b8a6"
                  />
                  {/* Neutral */}
                  <path
                    d={`M 100,100 L ${100 + 100 * Math.cos(((emotionalState.happy + emotionalState.confused + emotionalState.frustrated) / 100) * 2 * Math.PI - Math.PI/2)},${100 + 100 * Math.sin(((emotionalState.happy + emotionalState.confused + emotionalState.frustrated) / 100) * 2 * Math.PI - Math.PI/2)} A 100,100 0 0,1 100,0 Z`}
                    fill="#fde047"
                  />
                </>
              )}
            </svg>
          </div>
          <div className="flex justify-center flex-wrap gap-3 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-teal-700 rounded-sm"></div>
              <span className="text-xs text-gray-600">Happy {emotionalState?.happy || 0}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
              <span className="text-xs text-gray-600">Confused {emotionalState?.confused || 0}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-teal-500 rounded-sm"></div>
              <span className="text-xs text-gray-600">Frustrated {emotionalState?.frustrated || 0}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
              <span className="text-xs text-gray-600">Neutral {emotionalState?.neutral || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Overview with ACTUAL DATA */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Overview
          </h2>
          {students.length > 4 && (
            <button 
              onClick={() => setShowAllStudents(!showAllStudents)}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              {showAllStudents ? 'Show Less' : `View All (${students.length})`}
            </button>
          )}
        </div>
        {students.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500 text-sm">No students assigned to your quizzes yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(showAllStudents ? students : students.slice(0, 4)).map((student, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shrink-0">
                    {student.profileImage ? (
                      <img 
                        src={student.profileImage} 
                        alt={student.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{student.name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-600">Engagement:</span>
                      <span className={`text-xs font-semibold ${
                        student.engagement === 'High' ? 'text-green-600' :
                        student.engagement === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {student.engagement}
                      </span>
                      <svg
                        className={`w-3 h-3 ${
                          student.engagement === 'High' ? 'text-green-600' :
                          student.engagement === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={student.engagement === 'High' ? 
                            "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" :
                            "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                          }
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {student.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        student.progress >= 80 ? 'bg-green-500' :
                        student.progress >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${student.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default TeacherDashboard;