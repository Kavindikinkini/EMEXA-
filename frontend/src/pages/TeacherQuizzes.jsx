import React, { useState, useEffect } from "react";
import teacherQuizService from "../services/teacherQuizService";

const TeacherQuizzes = ({ setActiveMenuItem }) => {
  const [quizStats, setQuizStats] = useState({
    active: 0,
    drafts: 0,
    scheduled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await teacherQuizService.getQuizStats();
        console.log("📊 Quiz stats received:", response);

        // ✅ FIXED: Extract stats from response
        const statsData = response.stats || response.data?.stats || response;

        setQuizStats({
          active: statsData.active || 0,
          drafts: statsData.drafts || 0,
          scheduled: statsData.scheduled || 0,
        });
      } catch (error) {
        console.error("❌ Error loading quiz stats:", error);
        // Keep zeros on error
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Listen for quiz draft updates to refresh stats
    window.addEventListener("quizDraftsUpdated", loadStats);

    return () => {
      window.removeEventListener("quizDraftsUpdated", loadStats);
    };
  }, []);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
        <p className="text-gray-600">Manage your quizzes and assignments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Active Quizzes */}
        <div
          onClick={() => {
            localStorage.setItem("quizFilter", "active");
            setActiveMenuItem("quiz-drafts");
          }}
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_4px_8px_rgba(0,0,0,0.25)] cursor-pointer hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition"
        >
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">
                Active Quizzes
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  quizStats.active
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Drafts */}
        <div
          onClick={() => {
            localStorage.setItem("quizFilter", "draft");
            setActiveMenuItem("quiz-drafts");
          }}
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_4px_8px_rgba(0,0,0,0.25)] cursor-pointer hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-orange-600"
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
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Drafts</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  quizStats.drafts
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Scheduled */}
        <div
          onClick={() => {
            localStorage.setItem("quizFilter", "scheduled");
            setActiveMenuItem("quiz-drafts");
          }}
          className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_4px_8px_rgba(0,0,0,0.25)] cursor-pointer hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)] transition"
        >
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">
                Scheduled
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  quizStats.scheduled
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New Quiz Card */}
        <div
          onClick={() => setActiveMenuItem("create-quiz")}
          className="bg-white rounded-xl p-12 py-16 border-2 border-dashed border-gray-300 hover:border-green-500 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] transition cursor-pointer group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Create New Quiz
            </h3>
            <p className="text-gray-600 text-sm">
              Create and schedule a new quiz for your students
            </p>
          </div>
        </div>

        {/* View Drafts Card */}
        <div
          onClick={() => setActiveMenuItem("quiz-drafts")}
          className="bg-white rounded-xl p-12 py-16 border-2 border-dashed border-gray-300 hover:border-orange-500 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] transition cursor-pointer group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
              <svg
                className="w-8 h-8 text-orange-600"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              View Drafts
            </h3>
            <p className="text-gray-600 text-sm">
              Continue working on your saved quiz drafts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherQuizzes;
