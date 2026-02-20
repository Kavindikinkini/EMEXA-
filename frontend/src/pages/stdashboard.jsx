// FIXED VERSION - Quiz expiration now correctly uses dueDate instead of endTime
// This fixes the issue where active quizzes were showing as expired

import React, { useState, useEffect, useRef } from "react";
import camera from "../lib/camera";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import teacherQuizService from "../services/teacherQuizService";
import AdminViewWrapper from "../components/AdminViewWrapper";
import Sidebar from "../components/sidebarorigin";
import Header from "../components/headerorigin";
import PersonalAnalytics from '../components/PersonalAnalytics';

// Helper function to convert 24-hour time to 12-hour AM/PM format
const formatTime12Hour = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const hourNum = parseInt(hours);
  const displayHour =
    hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
  const period = hourNum >= 12 ? "PM" : "AM";
  return `${displayHour}:${minutes} ${period}`;
};

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [sharedQuizzes, setSharedQuizzes] = useState([]);
  const [highlightedQuizId, setHighlightedQuizId] = useState(null);
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const quizRefs = useRef({});

  const adminToken = localStorage.getItem("adminToken");
  const isAdminViewing = localStorage.getItem("adminViewingAs");
  const viewingUserId = localStorage.getItem("adminViewingUserId");

  // Sync activeMenuItem with current location
  useEffect(() => {
    const pathToMenuItem = {
      "/dashboard": "dashboard",
      "/wellness-centre": "wellness",
      "/profile": "profile",
    };

    const menuItem = pathToMenuItem[location.pathname] || "dashboard";
    setActiveMenuItem(menuItem);
  }, [location.pathname]);

  // Handle highlighted quiz from notification
  useEffect(() => {
    console.log("🌐 Full URL:", window.location.href);
    console.log("🌐 Pathname:", location.pathname);
    console.log("🌐 Search:", location.search);
    const quizId = searchParams.get("highlightQuiz");
    console.log("🌐 URL Search Params:", searchParams.toString());
    console.log("🎯 highlightQuiz parameter:", quizId);
    if (quizId && !loading) {
      console.log("✨ Setting highlighted quiz ID to:", quizId);
      setHighlightedQuizId(quizId);
      // Auto-expand quiz list to ensure highlighted quiz is visible
      setShowAllQuizzes(true);
      console.log("📖 Auto-expanded quiz list");
    } else if (!quizId) {
      console.log("⚠️ No highlightQuiz parameter in URL");
    } else if (loading) {
      console.log("⏳ Still loading, will try again...");
    }
  }, [searchParams, loading, location]);

  // Scroll to highlighted quiz when it's rendered
  useEffect(() => {
    console.log(
      "🔔 Scroll effect running. highlightedQuizId:",
      highlightedQuizId,
      "loading:",
      loading
    );

    if (!highlightedQuizId || loading) {
      console.log("⏹️ Exiting scroll effect early");
      return;
    }

    console.log("📍 Scroll effect triggered for quiz:", highlightedQuizId);

    let hasScrolled = false; // Flag to prevent multiple scrolls
    const timers = [];

    // Use requestAnimationFrame for better timing
    const attemptScroll = () => {
      requestAnimationFrame(() => {
        // If already scrolled, don't try again
        if (hasScrolled) {
          console.log("⏭️ Already scrolled, skipping");
          return;
        }

        const allRefKeys = Object.keys(quizRefs.current);
        console.log("🔑 All available quiz refs:", allRefKeys);
        console.log("🔑 Total refs registered:", allRefKeys.length);

        // Try to find the element
        let quizElement = quizRefs.current[highlightedQuizId];

        // If not found, try string conversion
        if (!quizElement) {
          const stringId = String(highlightedQuizId);
          quizElement = quizRefs.current[stringId];
          console.log(
            "🔄 Tried string conversion:",
            stringId,
            "Found:",
            !!quizElement
          );
        }

        console.log("🔍 Quiz element found:", !!quizElement);

        if (quizElement) {
          console.log("✅ Scrolling NOW to quiz!");
          quizElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
          hasScrolled = true; // Mark as scrolled
          // Clear remaining timers since we found it
          timers.forEach(clearTimeout);
        } else {
          console.log("❌ No element found for ID:", highlightedQuizId);
        }
      });
    };

    // Try multiple times to ensure we catch the element, but stop after first success
    timers.push(setTimeout(attemptScroll, 100));
    timers.push(setTimeout(attemptScroll, 500));
    timers.push(setTimeout(attemptScroll, 1000));
    timers.push(setTimeout(attemptScroll, 1500));

    // Clear highlight after 5 seconds
    const clearTimer = setTimeout(() => {
      console.log("⏰ Clearing highlight after 5 seconds");
      setHighlightedQuizId(null);
      setSearchParams({});
    }, 5000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(clearTimer);
    };
  }, [highlightedQuizId, loading]);

  // ============================================
  // CRITICAL: Check if admin is viewing a specific student
  // ============================================
  useEffect(() => {
    const initializeDashboard = async () => {
      const isAdminViewingStudent = localStorage.getItem("adminViewingAs");
      const adminToken = localStorage.getItem("adminToken");
      const viewingUserId = localStorage.getItem("adminViewingUserId");
      const viewingUserName = localStorage.getItem("adminViewingUserName");
      const viewingUserEmail = localStorage.getItem("adminViewingUserEmail");

      console.log("🔍 Student Dashboard Initialize:", {
        isAdminViewingStudent,
        viewingUserId,
        viewingUserName,
        hasAdminToken: !!adminToken,
      });

      // If admin is viewing a specific student
      if (isAdminViewingStudent === "student" && adminToken && viewingUserId) {
        console.log("👤 Admin viewing student:", viewingUserName);

        try {
          // Fetch the specific student's dashboard data
          const response = await axios.get(
            `http://localhost:5000/api/users/${viewingUserId}/dashboard`,
            {
              headers: { Authorization: `Bearer ${adminToken}` },
            }
          );

          const studentData = response.data;
          console.log("✅ Fetched student data for admin view:", studentData);

          // Set the viewed student's information
          setUserName(studentData.name || viewingUserName || "Student");
          setUserEmail(studentData.email || viewingUserEmail || "");

          // Store for Header component
          localStorage.setItem("displayUserName", studentData.name);
          localStorage.setItem("displayUserEmail", studentData.email);

          // Set dashboard data if available
          if (studentData) {
            setDashboardData({
              name: studentData.name,
              email: studentData.email,
              totalQuizzes: studentData.totalQuizzes || 24,
              averageScore: studentData.averageScore || 82,
              studyTime: studentData.studyTime || 32,
              upcomingQuizzes: studentData.upcomingQuizzes || [],
              recentActivity: studentData.recentActivity || [],
            });
          }

          setLoading(false);
        } catch (error) {
          console.error("❌ Error fetching student data for admin:", error);
          alert("Failed to load student data. Returning to user management.");

          // Clear viewing flags
          localStorage.removeItem("adminViewingUserId");
          localStorage.removeItem("adminViewingUserName");
          localStorage.removeItem("adminViewingUserEmail");
          localStorage.removeItem("adminViewingAs");
          localStorage.removeItem("displayUserName");
          localStorage.removeItem("displayUserEmail");

          window.location.href = "/admin/user-management";
        }
      } else {
        // Normal student viewing their own dashboard
        console.log("👤 Student viewing own dashboard");

        const token = localStorage.getItem("token");
        const storedUserName = localStorage.getItem("userName");
        const storedUserEmail = localStorage.getItem("userEmail");

        if (!token) {
          console.log("❌ No token found, redirecting to login");
          navigate("/login");
          return;
        }

        setUserName(storedUserName || "Student");
        setUserEmail(storedUserEmail || "");

        // Fetch their own dashboard data
        await fetchDashboardData();
      }

      // Fetch shared quizzes for both cases
      await fetchSharedQuizzes();
      
      // Force refresh notification count
      console.log('🔔 Dashboard mounted - refreshing notification count');
      window.dispatchEvent(new Event('refreshNotifications'));
    };

    initializeDashboard();
  }, []);

  // Cleanup when leaving dashboard
  useEffect(() => {
    return () => {
      const currentPath = window.location.pathname;

      // Only clear if navigating back to user management
      if (
        currentPath === "/admin/user-management" ||
        currentPath.includes("/admin")
      ) {
        console.log("🧹 Cleaning up admin viewing flags");
        localStorage.removeItem("adminViewingUserId");
        localStorage.removeItem("adminViewingUserName");
        localStorage.removeItem("adminViewingUserEmail");
        localStorage.removeItem("adminViewingUserRole");
        localStorage.removeItem("adminViewingAs");
        localStorage.removeItem("adminViewingUser");
        localStorage.removeItem("displayUserName");
        localStorage.removeItem("displayUserEmail");
      }
    };
  }, []);

  const fetchSharedQuizzes = async () => {
    try {
      const response = await teacherQuizService.getSharedQuizzes();
      console.log("📚 Fetched shared quizzes:", response);

      if (response.quizzes && response.quizzes.length > 0) {
        setSharedQuizzes(response.quizzes);
      }
    } catch (error) {
      console.error("❌ Error fetching shared quizzes:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("❌ No token for dashboard fetch");
        return;
      }

      console.log("📊 Fetching dashboard data...");

      const response = await axios.get(
        "http://localhost:5000/api/users/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Dashboard data fetched:", response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);

      if (error.response?.status === 401) {
        console.log("⚠️ Unauthorized, clearing tokens");
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const DashboardContent = () => {
    // Calculate completion percentage
    const totalQuizzes = dashboardData?.totalQuizzes || 0;
    const completedQuizzes = totalQuizzes; // All quizzes in totalQuizzes are completed
    const completionPercentage =
      totalQuizzes > 0
        ? Math.round((completedQuizzes / totalQuizzes) * 100)
        : 0;

    // Calculate average score percentage for progress bar
    const averageScore = dashboardData?.averageScore || 0;

    // Calculate study time percentage (assuming target is 40 hours)
    const studyTime = dashboardData?.studyTime || 0;
    const studyTimeTarget = 40;
    const studyTimePercentage = Math.min(
      Math.round((studyTime / studyTimeTarget) * 100),
      100
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="max-w-7xl">
            {/* Show admin viewing banner */}
            {isAdminViewing && adminToken && (
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
                        Admin View Mode - Viewing: {userName || "Student"}
                      </p>
                      <p className="text-xs text-yellow-700 mt-0.5">
                        You are viewing this student's dashboard as an
                        administrator
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Clear all viewing flags
                      localStorage.removeItem("adminViewingUserId");
                      localStorage.removeItem("adminViewingUserName");
                      localStorage.removeItem("adminViewingUserEmail");
                      localStorage.removeItem("adminViewingUserRole");
                      localStorage.removeItem("adminViewingAs");
                      localStorage.removeItem("adminViewingUser");
                      localStorage.removeItem("displayUserName");
                      localStorage.removeItem("displayUserEmail");

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

            <div className="mb-5">
              <h1 className="text-2xl font-bold text-gray-900">
                Student Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back! Here's an overview of your academic progress.
              </p>
            </div>

            {/* Stats Cards with ACTUAL DATA */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {/* Total Quizzes Card */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
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
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Total Quizzes</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalQuizzes}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-semibold text-gray-900">
                      {completedQuizzes}/{totalQuizzes}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Average Score Card */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
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
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {averageScore}%
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Target</span>
                    <span className="font-semibold text-gray-900">80%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        averageScore >= 80 ? "bg-green-500" : "bg-yellow-500"
                      }`}
                      style={{ width: `${Math.min(averageScore, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Study Time Card */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Study Time</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {studyTime}h
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Target: {studyTimeTarget}h
                    </span>
                    <span
                      className={`font-semibold ${
                        studyTime >= studyTimeTarget
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {studyTimePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${studyTimePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Quizzes */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 mb-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Upcoming Quizzes
                </h2>
                {(() => {
                  const upcomingQuizzes = dashboardData?.upcomingQuizzes || [];
                  const combinedQuizzes = [...sharedQuizzes, ...upcomingQuizzes];
                  
                  // Remove duplicates based on quiz id
                  const seenIds = new Set();
                  const allQuizzes = combinedQuizzes.filter((quiz) => {
                    const quizId = String(quiz.id || quiz._id);
                    if (seenIds.has(quizId)) {
                      return false;
                    }
                    seenIds.add(quizId);
                    return true;
                  });

                  // Only show View All button if there are more than 2 quizzes
                  if (allQuizzes.length > 2) {
                    return (
                      <button
                        onClick={() => setShowAllQuizzes(!showAllQuizzes)}
                        className="text-green-600 text-xs font-medium hover:underline"
                      >
                        {showAllQuizzes
                          ? "Show Less"
                          : `View All (${allQuizzes.length})`}
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="space-y-3">
                {(() => {
                  const upcomingQuizzes = dashboardData?.upcomingQuizzes || [];
                  const combinedQuizzes = [...sharedQuizzes, ...upcomingQuizzes];
                  
                  // Remove duplicates based on quiz id
                  const seenIds = new Set();
                  const allQuizzes = combinedQuizzes.filter((quiz) => {
                    const quizId = String(quiz.id || quiz._id);
                    if (seenIds.has(quizId)) {
                      return false;
                    }
                    seenIds.add(quizId);
                    return true;
                  });

                  if (allQuizzes.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <svg
                          className="w-12 h-12 text-gray-300 mx-auto mb-3"
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
                        <p className="text-gray-500 text-sm">
                          No upcoming quizzes at the moment
                        </p>
                      </div>
                    );
                  }
                  
                  // Sort quizzes: active first, then upcoming, then expired at bottom
                  const sortedQuizzes = [...allQuizzes].sort((a, b) => {
                    const statusA = a.timeStatus || 'active';
                    const statusB = b.timeStatus || 'active';
                    const isActiveA = a.isCurrentlyActive !== undefined ? a.isCurrentlyActive : true;
                    const isActiveB = b.isCurrentlyActive !== undefined ? b.isCurrentlyActive : true;
                    
                    // Priority: active (1) > upcoming (2) > expired (3)
                    const getPriority = (status, isActive) => {
                      if (status === 'active' && isActive) return 1;
                      if (status === 'upcoming') return 2;
                      if (status === 'expired') return 3;
                      return 2; // default to upcoming priority
                    };
                    
                    return getPriority(statusA, isActiveA) - getPriority(statusB, isActiveB);
                  });
                  
                  // Show only first 2 quizzes if not expanded
                  const quizzesToShow = showAllQuizzes ? sortedQuizzes : sortedQuizzes.slice(0, 2);
                  
                  return quizzesToShow.map((quiz, index) => {
                    const quizId = quiz.id || quiz._id || `quiz-${index}`;
                    const isHighlighted =
                      highlightedQuizId &&
                      String(quizId) === String(highlightedQuizId);

                    // ✅ FIX: Check expiration using dueDate, not endTime
                    const now = new Date();
                    let isExpired = false;
                    let isActive = false;
                    let timeStatus = 'active';

                    // Check if quiz has started based on startTime
                    if (quiz.scheduleDate && quiz.startTime) {
                      const scheduleDate = new Date(quiz.scheduleDate);
                      const [startHour, startMinute] = quiz.startTime.split(':').map(Number);
                      const startDateTime = new Date(scheduleDate);
                      startDateTime.setHours(startHour, startMinute, 0, 0);
                      
                      if (now < startDateTime) {
                        timeStatus = 'upcoming';
                        isActive = false;
                      } else {
                        isActive = true;
                        timeStatus = 'active';
                      }
                    }

                    // ✅ CRITICAL FIX: Use dueDate to check if expired
                    if (quiz.dueDate) {
                      const dueDateTime = new Date(quiz.dueDate);
                      dueDateTime.setHours(23, 59, 59, 999);
                      if (now > dueDateTime) {
                        isExpired = true;
                        isActive = false;
                        timeStatus = 'expired';
                      }
                    }

                    console.log("📝 Rendering quiz:", {
                      index,
                      title: quiz.title,
                      quizId,
                      "quiz.id": quiz.id,
                      "quiz._id": quiz._id,
                      highlightedQuizId,
                      isHighlighted,
                      timeStatus,
                      isActive,
                      isExpired,
                      dueDate: quiz.dueDate,
                      now: now.toISOString()
                    });

                    return (
                      <div
                        key={index}
                        ref={(el) => {
                          if (quizId && el) {
                            quizRefs.current[quizId] = el;
                            console.log(
                              "🔗 Registered ref for quiz:",
                              quizId,
                              quiz.title
                            );
                            if (isHighlighted) {
                              console.log("⭐ This is the HIGHLIGHTED quiz!");
                            }
                          }
                        }}
                        className={`flex items-start justify-between p-3 border rounded-lg hover:border-gray-300 transition ${
                          isHighlighted
                            ? "border-blue-500 bg-blue-50 animate-pulse"
                            : isExpired
                            ? "border-gray-200 bg-gray-50 opacity-60"
                            : "border-gray-200"
                        }`}
                        style={
                          isHighlighted
                            ? {
                                animation: "pulse 1s ease-in-out 5",
                              }
                            : {}
                        }
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {quiz.title}
                            </h3>
  
    {quiz.maxAttempts > 1 && quiz.attemptsUsed !== undefined && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        quiz.canAttempt 
          ? 'bg-blue-100 text-blue-700' 
          : 'bg-red-100 text-red-700'
      }`}>
        {quiz.canAttempt 
          ? `Attempt ${quiz.attemptsUsed + 1}/${quiz.maxAttempts}`
          : `All ${quiz.maxAttempts} attempts used`
        }
      </span>
    )}
                            {timeStatus === "upcoming" && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                Upcoming
                              </span>
                            )}
                            {timeStatus === "active" && isActive && !isExpired && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                                Active Now
                              </span>
                            )}
                            {isExpired && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                Expired
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-1.5">
                            {quiz.subject && (
                              <span className="text-teal-600 font-medium">
                                {quiz.subject} •{" "}
                              </span>
                            )}
                            {quiz.scheduleDate &&
                              quiz.startTime && (
                                <span className="text-blue-600 font-medium">
                                  {(() => {
                                    try {
                                      const scheduleDate = new Date(quiz.scheduleDate);
                                      const [startHour, startMinute] = quiz.startTime.split(':').map(Number);
                                      
                                      // Create start datetime
                                      const startDateTime = new Date(scheduleDate);
                                      startDateTime.setHours(startHour, startMinute, 0, 0);
                                      
                                      // Format start time
                                      const startTimeStr = startDateTime.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      });
                                      const startDateStr = startDateTime.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      });
                                      
                                      return `Start: ${startTimeStr} on ${startDateStr}`;
                                    } catch {
                                      return "Invalid date/time";
                                    }
                                  })()}
                                </span>
                              )}
                          </p>
                          {quiz.dueDate && (
                            <p className="text-xs text-red-600 font-semibold mb-1.5">
                              Due: {new Date(quiz.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {quiz.description ||
                              (quiz.questions?.length
                                ? `${quiz.questions.length} question${
                                    quiz.questions.length !== 1 ? "s" : ""
                                  }`
                                : `Prepare for your ${quiz.title} quiz`)}
                          </p>
                        </div>
                        <button
  onClick={() => {
    // ✅ Check attempt limit first
    if (quiz.canAttempt === false) {
      alert(
        `You have used all ${quiz.maxAttempts} attempt(s) for this quiz. No more attempts are allowed.`
      );
      return;
    }
    if (isExpired) {
      alert(
        "This quiz has expired. The deadline has passed."
      );
      return;
    }
    if (!isActive && timeStatus === "upcoming") {
      alert(
        "This quiz has not started yet. Please wait until the scheduled time."
      );
      return;
    }
    const targetId = quiz.id || `quiz-${index}`;
    navigate(
      `/permission?quizId=${encodeURIComponent(
        targetId
      )}`
    );
  }}
  disabled={
    quiz.canAttempt === false ||
    isExpired ||
    (!isActive && timeStatus === "upcoming")
  }
                          style={
                            isExpired ? { backgroundColor: "#FF0000" } : {}
                          }
                          className={`inline-flex items-center justify-center text-white px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap min-w-[80px] ${
  quiz.canAttempt === false
    ? "!bg-red-500 !text-white cursor-not-allowed"
    : isExpired
    ? "cursor-not-allowed"
    : !isActive && timeStatus === "upcoming"
    ? "!bg-gray-300 !text-gray-500 cursor-not-allowed"
    : "bg-green-500 hover:bg-green-600"
}`}
                        >
                          {quiz.canAttempt === false
  ? "No Attempts Left"
  : isExpired
  ? "Expired"
  : timeStatus === "upcoming"
  ? "Not Started"
  : quiz.attemptsUsed > 0
  ? `Retake (${quiz.attemptsRemaining} left)`
  : "Take Quiz"}
                          </button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Recent Activity with ACTUAL DATA */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 mb-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Recent Activity
                </h2>
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
                  <button 
                    onClick={() => navigate("/profile?tab=activity")}
                    className="text-green-600 text-xs font-medium hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {(() => {
                  const recentActivity = dashboardData?.recentActivity || [];

                  if (recentActivity.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <svg
                          className="w-12 h-12 text-gray-300 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-gray-500 text-sm">
                          No recent activity to display
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Complete some quizzes to see your activity here
                        </p>
                      </div>
                    );
                  }

                  return recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 first:pt-0"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {activity.type}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {activity.title} •{" "}
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {activity.score !== undefined &&
                        activity.score !== null && (
                          <span
                            className={`font-bold text-sm ${
                              activity.score >= 80
                                ? "text-green-600"
                                : activity.score >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {activity.score}%
                          </span>
                        )}
                      {activity.status === "in-progress" && (
                        <span className="text-yellow-600 font-medium text-xs">
                          In Progress
                        </span>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Personal Analytics with REAL DATA */}
            <PersonalAnalytics userId={dashboardData?._id} />
          </div>
        </div>
      </div>
    );
  };

  // Check if admin is viewing
  if (isAdminViewing && adminToken) {
    return (
      <AdminViewWrapper dashboardType="student">
        <DashboardContent />
      </AdminViewWrapper>
    );
  }

  // Regular student view
  const studentMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-5 h-5 pointer-events-none"
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
      onClick: () => navigate("/dashboard"),
    },
    {
      id: "wellness",
      label: "Wellness Centre",
      icon: (
        <svg
          className="w-5 h-5 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      onClick: () => navigate("/wellness-centre"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg
          className="w-5 h-5 pointer-events-none"
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
      onClick: () => navigate("/profile"),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header userName={userName} userRole="student" />
      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        menuItems={studentMenuItems}
      />
      <div className="ml-52 pt-14">
        <DashboardContent />
      </div>
    </div>
  );
};

export default StudentDashboard;