import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoIcon from '../assets/headerlogo.png';
import axios from 'axios';
import HelpSupportModal from './HelpSupportModal'; // Import the modal

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

// Helper function to convert relative paths to full URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, construct full URL using API_BASE
  if (imagePath.startsWith('/uploads/')) {
    return `${API_BASE}${imagePath}`;
  }
  
  return imagePath;
};

// Load cached unread count synchronously
const loadCachedUnreadCount = () => {
  try {
    const cached = localStorage.getItem('cachedUnreadCount');
    return cached ? parseInt(cached, 10) : 0;
  } catch (error) {
    return 0;
  }
};

const Header = ({ userName, userRole }) => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [displayName, setDisplayName] = useState(userName);
  const [unreadCount, setUnreadCount] = useState(loadCachedUnreadCount()); // Initialize with cached value
  const [showHelpModal, setShowHelpModal] = useState(false); // State for help modal

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    
    if (confirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      navigate("/login");
    }
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleHelpClick = () => {
    setShowHelpModal(true);
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || (userRole !== 'student' && userRole !== 'teacher')) {
        console.log('🔔 Skipping notification count fetch - no token or wrong role:', userRole);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('🔔 Unread notification count:', response.data.count);
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    }
  };

  // Poll for unread count every 1 second (for students and teachers)
  useEffect(() => {
    if (userRole === 'student' || userRole === 'teacher') {
      // Fetch fresh data immediately
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 1000);
      
      // Listen for custom event to refresh notification count immediately
      const handleRefreshNotifications = () => {
        console.log('🔔 Manual notification refresh triggered');
        fetchUnreadCount();
      };
      
      window.addEventListener('refreshNotifications', handleRefreshNotifications);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshNotifications', handleRefreshNotifications);
      };
    }
  }, [userRole]);

  // Load profile image from localStorage and listen for changes
  useEffect(() => {
    const storageKey = userRole === 'admin' ? 'adminProfileImage' : (userRole === 'teacher' ? 'teacherProfileImage' : 'studentProfileImage');
    const eventName = userRole === 'admin' ? 'adminProfileImageChanged' : (userRole === 'teacher' ? 'teacherProfileImageChanged' : 'studentProfileImageChanged');

    const storedImage = localStorage.getItem(storageKey);
    console.log('🖼️ Header - StorageKey:', storageKey);
    console.log('🖼️ Header - Stored image from localStorage:', storedImage);
    
    // Convert relative paths to full URLs
    if (storedImage && storedImage.trim().length > 0) {
      const fullUrl = getImageUrl(storedImage);
      console.log('🖼️ Header - Converted URL:', fullUrl);
      setProfileImage(fullUrl);
    } else {
      console.log('🖼️ Header - No image in localStorage');
      setProfileImage(null);
    }

    const handleProfileImageChange = (e) => {
      console.log('🖼️ Header - Profile image change event received:', e?.detail);
      const fullUrl = getImageUrl(e?.detail);
      console.log('🖼️ Header - Converted event URL:', fullUrl);
      setProfileImage(fullUrl);
    };

    const handleStorageChange = () => {
      const updatedImage = localStorage.getItem(storageKey);
      console.log('🖼️ Header - Storage changed:', updatedImage);
      const fullUrl = getImageUrl(updatedImage);
      setProfileImage(fullUrl);
    };

    // Listen for both custom events and storage changes
    window.addEventListener(eventName, handleProfileImageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener(eventName, handleProfileImageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userRole]);
  
  // Sync displayName with userName prop changes
  useEffect(() => {
    if (userName) {
      console.log('🔄 Header: userName prop changed, syncing displayName:', userName);
      setDisplayName(userName);
    }
  }, [userName]);

  // Listen for name changes
  useEffect(() => {
    const handleNameChange = (e) => {
      console.log('Name change event received:', e?.detail);
      setDisplayName(e?.detail);
    };
    
    const handleStorageChange = () => {
      const updatedName = localStorage.getItem('userName');
      if (updatedName) {
        console.log('Storage change detected, updating name to:', updatedName);
        setDisplayName(updatedName);
      }
    };
    
    window.addEventListener('userNameChanged', handleNameChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('userNameChanged', handleNameChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 h-14 z-50">
        <div className="h-full flex items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img 
              src={LogoIcon}
              alt="Logo" 
              className="w-34 h-34 object-contain"
            />
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-1">
            {/* Notifications */}
            <button 
              onClick={handleNotificationClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition relative"
              title="Notifications"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {(userRole === 'student' || userRole === 'teacher') && unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Help - Now opens modal */}
            <button 
              onClick={handleHelpClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Help & Support"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* User Profile - Display Only */}
            <div className="relative">
              <div className="flex items-center space-x-2 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition ml-1">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 ${
                      userRole === "teacher" ? "bg-purple-600" : "bg-blue-600"
                    } rounded-full flex items-center justify-center text-white font-semibold text-xs`}
                  >
                    {displayName?.charAt(0).toUpperCase() || "A"}
                  </div>
                )}
                <span className="font-medium text-gray-900 text-sm">
                  {displayName || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Help Support Modal */}
      <HelpSupportModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        userRole={userRole}
        userName={displayName}
      />
    </>
  );
};

export default Header;