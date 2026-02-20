import React, { useState, useEffect } from 'react';
import { Bell, BookOpen, CheckCircle, Clock, User, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

// Load cached data synchronously before component renders
const loadCachedNotifications = () => {
  try {
    const cached = localStorage.getItem('cachedNotifications');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error loading cached notifications:', error);
    return [];
  }
};

const loadCachedUnreadCount = () => {
  try {
    const cached = localStorage.getItem('cachedUnreadCount');
    return cached ? parseInt(cached, 10) : 0;
  } catch (error) {
    return 0;
  }
};

export default function Notification() {
  const navigate = useNavigate();
  
  // Initialize with cached data immediately - no delay
  const [notifications, setNotifications] = useState(loadCachedNotifications());
  const [filter, setFilter] = useState('all'); // all, unread
  const [unreadCount, setUnreadCount] = useState(loadCachedUnreadCount());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch fresh data immediately
    fetchNotifications();
    
    // Poll for new notifications every 2 seconds
    const interval = setInterval(fetchNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const formattedNotifications = response.data.notifications.map(notif => {
          let formattedDueDate = notif.dueDate;
          
          // Format due date and convert time to 12-hour format with AM/PM
          if (formattedDueDate) {
            formattedDueDate = formattedDueDate.replace(/T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '').trim();
            
            // Extract time part (assuming format: "date, time")
            const parts = formattedDueDate.split(',');
            if (parts.length === 2) {
              const timePart = parts[1].trim();
              const [hours, minutes] = timePart.split(':');
              const hour = parseInt(hours, 10);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              formattedDueDate = `${parts[0].trim()}, ${hour12}:${minutes} ${ampm}`;
            }
          }

          // Map notification types
          let mappedType = 'assignment';
          if (notif.type === 'quiz_graded') {
            mappedType = 'grade';
          } else if (notif.type === 'data_export') {
            mappedType = 'export';
          } else if (notif.type === 'quiz_assigned') {
            mappedType = 'assignment';
          }

          return {
            id: notif._id,
            quizId: notif.quizId,
            title: notif.title,
            description: notif.description,
            instructor: notif.instructor,
            dueDate: formattedDueDate,
            score: notif.score,
            timestamp: formatTimestamp(notif.createdAt),
            type: mappedType,
            status: notif.status,
            icon: notif.type === 'quiz_graded' ? 'check' : (notif.type === 'data_export' ? 'download' : 'book'),
            isRead: notif.isRead
          };
        });

        setNotifications(formattedNotifications);
        setUnreadCount(response.data.unreadCount);
        
        // Update cache with fresh data
        localStorage.setItem('cachedUnreadCount', response.data.unreadCount.toString());
        localStorage.setItem('cachedNotifications', JSON.stringify(formattedNotifications));
        
        // Dispatch event to update header notification count
        window.dispatchEvent(new Event('refreshNotifications'));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 2) return `${diffInHours} hour ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read first if unread
    if (!notification.isRead) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(
          `${API_BASE}/api/notifications/${notification.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Update local state and cache immediately
        const updatedNotifications = notifications.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifications);
        const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        localStorage.setItem('cachedUnreadCount', newUnreadCount.toString());
        // Trigger header refresh
        window.dispatchEvent(new Event('refreshNotifications'));
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // For export notifications, open the PDF file
    if (notification.type === 'export') {
      // Get the stored PDF URL from localStorage
      const pdfUrl = localStorage.getItem('lastExportedPdfUrl');
      
      if (pdfUrl) {
        // Open PDF in new tab
        window.open(pdfUrl, '_blank');
      }
      return;
    }

    // Navigate based on notification type
    if (notification.quizId) {
      console.log('🚀 Navigating to quiz:', notification.quizId, 'Type:', notification.type);
      // For graded quizzes, show results page
      if (notification.type === 'grade') {
        console.log('📊 Going to results page');
        navigate(`/quiz/${notification.quizId}?results=true`);
      } else {
        // For assignment notifications, navigate to student dashboard with highlighted quiz
        console.log('📚 Going to dashboard with highlight:', notification.quizId);
        navigate(`/dashboard?highlightQuiz=${notification.quizId}`);
      }
    } else {
      console.log('⚠️ No quizId in notification:', notification);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      // Trigger immediate header refresh
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      // Trigger immediate header refresh
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  // Determine correct back navigation based on user role
  const handleBackClick = () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'student') {
      navigate('/dashboard');
    } else if (userRole === 'teacher') {
      navigate('/teacher-dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-900" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{unreadCount}</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            </div>
            
            <button
              onClick={handleMarkAllAsRead}
              className="text-[#4F46E5] text-sm font-medium hover:underline flex items-center gap-1"
            >
              <span className="text-lg tracking-tighter">✓✓</span>
              Mark all as read
            </button>
          </div>
          <p className="text-gray-600 text-sm">Stay updated with your latest assignments and grades.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition relative ${
              filter === 'unread'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Unread
            <span className={`ml-2 px-2 py-0.5 bg-[#4F46E5] text-white text-xs rounded-full ${unreadCount === 0 ? 'invisible' : ''}`}>
              {unreadCount || 0}
            </span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`rounded-lg p-4 border transition hover:shadow-md cursor-pointer ${
                  notification.type === 'export' && notification.isRead
                    ? 'bg-emerald-50 border-emerald-200'
                    : notification.type === 'export' && !notification.isRead
                    ? 'bg-emerald-100 border-emerald-300'
                    : notification.type === 'grade' && notification.isRead
                    ? 'bg-purple-50 border-purple-200'
                    : notification.type === 'grade' && !notification.isRead
                    ? 'bg-purple-100 border-purple-300'
                    : notification.isRead
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    notification.type === 'export'
                      ? 'bg-emerald-200'
                      : notification.type === 'grade'
                      ? 'bg-purple-200'
                      : notification.isRead
                      ? 'bg-green-100'
                      : 'bg-blue-100'
                  }`}>
                    {notification.type === 'export' ? (
                      <Download className={`w-5 h-5 ${
                        notification.isRead ? 'text-emerald-600' : 'text-emerald-700'
                      }`} />
                    ) : notification.status === 'graded' ? (
                      <CheckCircle className={`w-5 h-5 ${
                        notification.type === 'grade' ? 'text-purple-600' : notification.isRead ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    ) : (
                      <BookOpen className={`w-5 h-5 ${
                        notification.isRead ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{notification.timestamp}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">{notification.description}</p>
                    
                    {/* Footer with instructor and due date */}
                    <div className="flex items-center justify-between text-sm">
                      {notification.instructor && (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <User className="w-4 h-4" />
                          <span>{notification.instructor}</span>
                        </div>
                      )}
                      
                      {notification.score && (
                        <div className="font-semibold text-green-700">
                          Score: {notification.score}
                        </div>
                      )}
                      
                      {notification.dueDate && (
                        <div className="font-medium text-orange-600">
                          Due: {notification.dueDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
