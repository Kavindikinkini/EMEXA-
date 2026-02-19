import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center shadow-xl">
        {/* Checkmark Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title and Message */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h2>
        <p className="text-gray-600 text-sm mb-6">
          You will be logged out of your account.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm"
          >
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

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);

    // 🔑 STEP 1: Backup "Remember Me" credentials BEFORE clearing
    const rememberMe = localStorage.getItem("rememberMe");
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");

    console.log("💾 Preserving remember me data:", {
      rememberMe,
      hasEmail: !!savedEmail,
      hasPassword: !!savedPassword,
    });

    // 🧹 STEP 2: Clear all auth data
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

    // 🔑 STEP 3: Restore "Remember Me" credentials if they existed
    if (rememberMe === "true") {
      localStorage.setItem("rememberMe", rememberMe);
      if (savedEmail) {
        localStorage.setItem("savedEmail", savedEmail);
      }
      if (savedPassword) {
        localStorage.setItem("savedPassword", savedPassword);
      }
      console.log("✅ Remember me credentials restored");
    } else {
      // If remember me was not enabled, make sure it's cleared
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("savedEmail");
      localStorage.removeItem("savedPassword");
      console.log("🗑️ Remember me was not enabled - credentials cleared");
    }

    // 🚀 STEP 4: Navigate to logout/login page
    navigate("/logout");
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Handle menu item click
  const handleMenuClick = (item) => {
    if (setActiveMenuItem) {
      setActiveMenuItem(item.id);
    }

    if (item.onClick) {
      item.onClick();
    }
  };

  // Default menu items with proper navigation
  const defaultMenuItems = [
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

  const items = menuItems || defaultMenuItems;

  return (
    <>
      <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 bg-gradient-to-b from-green-50 via-green-50 to-white border-r border-gray-200 overflow-y-auto z-60">
        {/* Menu Items */}
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
              <span className="flex-1 text-left pointer-events-auto">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="absolute bottom-4 left-3 right-3 flex items-center gap-2.5 px-3 py-2.5 text-red-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium cursor-pointer"
        >
          <svg
            className="w-4 h-4 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Log Out</span>
        </button>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
};

export default Sidebar;