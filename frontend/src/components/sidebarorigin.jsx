import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h2>
        <p className="text-gray-600 text-sm mb-6">You will be logged out of your account.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeMenuItem, setActiveMenuItem, menuItems }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    const rememberMe = localStorage.getItem("rememberMe");
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");

    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("studentProfileImage");
    localStorage.removeItem("teacherProfileImage");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");

    if (rememberMe === "true") {
      localStorage.setItem("rememberMe", rememberMe);
      if (savedEmail) localStorage.setItem("savedEmail", savedEmail);
      if (savedPassword) localStorage.setItem("savedPassword", savedPassword);
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("savedEmail");
      localStorage.removeItem("savedPassword");
    }

    navigate("/logout");
  };

  const handleCancelLogout = () => setShowLogoutModal(false);

  const handleMenuClick = (item) => {
    if (setActiveMenuItem) setActiveMenuItem(item.id);
    if (item.onClick) item.onClick();
  };

  const getUserRole = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role?.toLowerCase() || 'student';
      } catch (e) {
        return 'student';
      }
    }
    return 'student';
  };

  const currentUserRole = getUserRole();

  // ✅ STUDENT MENU
  const studentMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      onClick: () => navigate("/dashboard"),
    },
    {
      id: "wellness",
      label: "Wellness Centre",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      onClick: () => navigate("/wellness-centre"),
    },
    {
      id: "gamification",
      label: "My Progress",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      onClick: () => navigate("/gamification"),
    },
    {
      id: "peer-comparison",
      label: "Peer Comparison",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => navigate("/peer-comparison"),
    },
    {
      id: "journal",
      label: "My Journal",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      onClick: () => navigate("/journal"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => navigate("/profile"),
    },
  ];

  // ✅ TEACHER MENU — now includes ALL 6 items matching TeacherDashboard exactly
  const teacherAdminMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      onClick: () => navigate("/teacher-dashboard"),
    },
    {
      id: "quizzes",
      label: "Quiz",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => navigate("/teacher-dashboard"),
    },
    {
      id: "customAnalytics",
      label: "Custom Analysis",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      onClick: () => navigate("/teacher/custom-analytics"),
    },
    // ✅ THIS WAS THE MISSING ITEM — now added to default teacher menu
    {
      id: "heatmap",
      label: "Emotion Heatmap",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      onClick: () => navigate("/teacher-dashboard", { state: { activeMenu: "heatmap" } }),
    },
    {
    id: "heatmap",
    label: "Emotion Heatmap",
    icon: (
      <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    onClick: () => navigate("/teacher-dashboard", { state: { activeMenu: "heatmap" } }),
  },
    {
      id: "difficulty",
      label: "Difficulty Analysis",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      onClick: () => navigate("/teacher/difficulty-analysis"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => navigate("/teacher-profile"),
    },
  ];

  // Use custom menuItems if provided, otherwise use role-based default
  const defaultMenuItems = currentUserRole === 'student' ? studentMenuItems : teacherAdminMenuItems;
  const items = menuItems || defaultMenuItems;

  return (
    <>
      <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 bg-gradient-to-b from-green-50 via-green-50 to-white border-r border-gray-200 overflow-y-auto z-60">
        <nav className="pt-6 px-3 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMenuClick(item)}
              className={`w-full block text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition text-sm cursor-pointer ${
                activeMenuItem === item.id
                  ? "bg-white text-green-600 shadow-sm font-medium"
                  : "text-gray-700 hover:bg-white/70"
              }`}
            >
              <span className="pointer-events-none">{item.icon}</span>
              <span className="flex-1 text-left pointer-events-auto">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="absolute bottom-4 left-3 right-3 flex items-center gap-2.5 px-3 py-2.5 text-red-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium cursor-pointer"
        >
          <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Log Out</span>
        </button>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
};

export default Sidebar;