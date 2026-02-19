import React, { useState, useEffect, useRef } from 'react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/sidebarorigin';
import Header from '../components/headerorigin';
import AdminViewWrapper from '../components/AdminViewWrapper';
import ActivityTab from '../components/ActivityTab'; 

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

// Helper function to get full image URL - ADDED for multi-device support
const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/120";
  
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

// Separate Password Modal Component to prevent re-renders
const PasswordModal = ({ isOpen, onClose, onSave }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSave = () => {
    onSave({ currentPassword, newPassword, confirmPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              type="button"
              className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
            >
              <span>Save Changes</span>
            </button>
            <button
              onClick={handleClose}
              type="button"
              className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('account');

  // Auto-switch to activity tab when navigated from dashboard "View All"
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'activity') {
      setActiveTab('activity');
    }
  }, [searchParams]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('profile');

  // Ensure activeMenuItem is always 'profile' when on profile page
  useEffect(() => {
    if (location.pathname === '/profile') {
      setActiveMenuItem('profile');
    }
  }, [location.pathname]);

  // Read these once and store in state to prevent re-renders
  const [adminToken] = useState(() => localStorage.getItem('adminToken'));
  const [isAdminViewing] = useState(() => localStorage.getItem('adminViewingAs'));

  // Form states - Initialize with empty values to prevent re-render issues
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    emotionDataConsent: true
  });

  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchUserData(); // This loads everything from database including profileImage
      setUserName(localStorage.getItem('userName') || 'Student');
      
    };

    loadInitialData();
    
  }, []); 

useEffect(() => {
  if (userData?.profileImage && userData.profileImage !== profileImage) {
    console.log('🖼️ Loading profile image from database:', userData.profileImage);
    const fullImageUrl = getImageUrl(userData.profileImage);
    console.log('🖼️ Converted to full URL:', fullImageUrl);
    setProfileImage(fullImageUrl);
    // Save the FULL URL to localStorage so Header can use it directly
    localStorage.setItem('studentProfileImage', fullImageUrl);
    console.log('💾 Saved to localStorage:', fullImageUrl);
    // Also dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('studentProfileImageChanged', { detail: fullImageUrl }));
  } else if (!userData?.profileImage) {
    // Clear profile image if user doesn't have one
    console.log('🖼️ No profile image, clearing...');
    setProfileImage(null);
    localStorage.removeItem('studentProfileImage');
  }
}, [userData?.profileImage, profileImage]);

  // Listen for profile image changes from upload
  useEffect(() => {
    const handleProfileImageChange = (e) => {
      console.log('🎨 Profile image changed event received:', e.detail);
      setProfileImage(e.detail);
    };

    window.addEventListener('studentProfileImageChanged', handleProfileImageChange);
    
    return () => {
      window.removeEventListener('studentProfileImageChanged', handleProfileImageChange);
    };
  }, []);

  // CRITICAL: Sync notification and privacy settings from userData
  useEffect(() => {
    if (userData) {
      console.log('📥 Syncing settings from userData:', userData);
      
      if (userData.notificationSettings) {
        console.log('Setting notifications:', userData.notificationSettings);
        setNotificationSettings(userData.notificationSettings);
      }
      
      if (userData.privacySettings) {
        console.log('Setting privacy:', userData.privacySettings);
        setPrivacySettings(userData.privacySettings);
      }
    }
  }, [userData]);

 // COMPLETE REPLACEMENT for fetchUserData function in StudentProfile.jsx
// Find the existing fetchUserData function and replace it entirely with this:

const fetchUserData = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const isAdminViewing = localStorage.getItem('adminViewingAs');
    const viewingUserId = localStorage.getItem('adminViewingUserId');
    
    console.log('🔍 Fetch user data:', {
      isAdminViewing,
      viewingUserId,
      hasToken: !!token,
      hasAdminToken: !!adminToken
    });

    // ADMIN VIEWING SPECIFIC USER
    if (isAdminViewing && adminToken && viewingUserId) {
      console.log('👤 Admin viewing user ID:', viewingUserId);
      
      try {
        // Fetch the specific user's profile by ID
        const response = await axios.get(
          `${API_BASE}/api/users/${viewingUserId}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const user = response.data;
        console.log('✅ Fetched user data for admin view:', user);
        
        // Set all user data
        setUserData(user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'student'
        });

        // Set notification settings
        if (user.notificationSettings) {
          console.log('📋 Setting notification settings:', user.notificationSettings);
          setNotificationSettings({
            emailNotifications: user.notificationSettings.emailNotifications ?? true,
            smsNotifications: user.notificationSettings.smsNotifications ?? false,
            inAppNotifications: user.notificationSettings.inAppNotifications ?? true
          });
        }

        // Set privacy settings
        if (user.privacySettings) {
          console.log('🔒 Setting privacy settings:', user.privacySettings);
          setPrivacySettings({
            emotionDataConsent: user.privacySettings.emotionDataConsent ?? true
          });
        }

        // Set profile image
        if (user.profileImage) {
          console.log('🖼️ Setting profile image:', user.profileImage);
          setProfileImage(getImageUrl(user.profileImage));
        }

        setLoading(false);
        return;
        
      } catch (error) {
        console.error('❌ Error fetching user for admin:', error);
        alert('Failed to load user profile. Returning to user management.');
        
        // Clear admin viewing flags and return to user management
        localStorage.removeItem('adminViewingUserId');
        localStorage.removeItem('adminViewingUserRole');
        localStorage.removeItem('adminViewingAs');
        
        navigate('/admin/user-management');
        return;
      }
    }

    // NORMAL USER VIEWING THEIR OWN PROFILE
    const storedUserName = localStorage.getItem('userName');
    const storedUserEmail = localStorage.getItem('userEmail');

    if (!token) {
      console.log('❌ No token found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      console.log('👤 Fetching own profile');
      const response = await axios.get(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = response.data;
      console.log('✅ Fetched own profile data:', user);
      console.log('🖼️ ProfileImage from API:', user.profileImage);
      
      setUserData(user);
      setFormData({
        name: user.name || storedUserName || '',
        email: user.email || storedUserEmail || '',
        role: user.role || 'student'
      });

      // Set notification settings
      if (user.notificationSettings) {
        console.log('📋 Loading notification settings:', user.notificationSettings);
        setNotificationSettings({
          emailNotifications: user.notificationSettings.emailNotifications ?? true,
          smsNotifications: user.notificationSettings.smsNotifications ?? false,
          inAppNotifications: user.notificationSettings.inAppNotifications ?? true
        });
      }

      // Set privacy settings
      if (user.privacySettings) {
        console.log('🔒 Loading privacy settings:', user.privacySettings);
        setPrivacySettings({
          emotionDataConsent: user.privacySettings.emotionDataConsent ?? true
        });
      }

      // Set profile image
      if (user.profileImage) {
        console.log('🖼️ Loading profile image:', user.profileImage);
        const fullImageUrl = getImageUrl(user.profileImage);
        console.log('🖼️ Converted to full URL:', fullImageUrl);
        setProfileImage(fullImageUrl);
        // SAVE TO LOCALSTORAGE IMMEDIATELY
        localStorage.setItem('studentProfileImage', fullImageUrl);
        console.log('💾 Saved to localStorage:', fullImageUrl);
        // Dispatch event for Header to pick up
        window.dispatchEvent(new CustomEvent('studentProfileImageChanged', { detail: fullImageUrl }));
        console.log('📢 Dispatched studentProfileImageChanged event');
      }

    } catch (apiError) {
      console.error('❌ API Error:', apiError);
      console.log('⚠️ Using fallback data from localStorage');
      
      const fallbackData = {
        name: storedUserName || 'Student',
        email: storedUserEmail || 'student@school.edu',
        role: 'student',
        profileImage: localStorage.getItem('studentProfileImage') || null,
        recentActivity: [],
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          inAppNotifications: true
        },
        privacySettings: {
          emotionDataConsent: true
        }
      };

      setUserData(fallbackData);
      setFormData({
        name: fallbackData.name,
        email: fallbackData.email,
        role: fallbackData.role
      });
      setNotificationSettings(fallbackData.notificationSettings);
      setPrivacySettings(fallbackData.privacySettings);
      
      if (fallbackData.profileImage) {
        setProfileImage(getImageUrl(fallbackData.profileImage));
      }
    }
    
  } catch (error) {
    console.error('💥 Critical error:', error);
    
    // Ultimate fallback
    const fallbackImage = localStorage.getItem('studentProfileImage');
    const fallbackName = localStorage.getItem('userName') || 'Student';
    
    setFormData({
      name: fallbackName,
      email: 'student@school.edu',
      role: 'student'
    });
    
    setUserData({
      name: fallbackName,
      email: 'student@school.edu',
      role: 'student',
      profileImage: fallbackImage
    });
    
    if (fallbackImage) {
      setProfileImage(getImageUrl(fallbackImage));
    }
    
  } finally {
    setLoading(false);
  }
};
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      if (prevData[name] === value) return prevData;
      return {
        ...prevData,
        [name]: value
      };
    });
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };
      console.log('🔄 Toggled notification:', key, 'New value:', !prev[key]);
      console.log('📝 New notification settings:', newSettings);
      return newSettings;
    });
  };

  const handlePrivacyToggle = (key) => {
    setPrivacySettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };
      console.log('🔄 Toggled privacy:', key, 'New value:', !prev[key]);
      console.log('📝 New privacy settings:', newSettings);
      return newSettings;
    });
  };

const handleSaveAccountInfo = async () => {
  try {
    // Check if admin is viewing
    const isAdminViewing = localStorage.getItem('adminViewingAs');
    const adminToken = localStorage.getItem('adminToken');
    const viewingUserId = localStorage.getItem('adminViewingUserId');
    
    const token = isAdminViewing && adminToken ? adminToken : localStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found, updating localStorage only');
      localStorage.setItem('userName', formData.name);
      setUserName(formData.name);
      
      setUserData(prev => ({
        ...prev,
        name: formData.name
      }));
      
      alert('Profile updated successfully (local only)!');
      return;
    }
    
    // IMPORTANT: Only send name, NOT email (email cannot be changed)
    const dataToSave = {
      name: formData.name
    };
    
    console.log('💾 Saving profile data:', dataToSave);
    
let updateUrl = `${API_BASE}/api/users/update-profile`;
    
    // If admin is viewing a specific user
    if (isAdminViewing && viewingUserId) {
      updateUrl = `${API_BASE}/api/users/${viewingUserId}`;
      console.log('👤 Admin updating user:', viewingUserId);
    }
    
    const response = await axios.put(
      updateUrl,
      dataToSave,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Profile update response:', response.data);
    
    if (response.data) {
      localStorage.setItem('userName', dataToSave.name);
      setUserName(dataToSave.name);
      
      setUserData(prev => ({
        ...prev,
        name: dataToSave.name
      }));
      
      // Dispatch event for header update
      window.dispatchEvent(new CustomEvent('userNameChanged', { detail: dataToSave.name }));
      
      alert('Profile updated successfully!');
    }
  } catch (error) {
    console.error('❌ Error saving profile:', error);
    console.error('Error response:', error.response?.data);
    
    // Still update locally
    localStorage.setItem('userName', formData.name);
    setUserName(formData.name);
    
    setUserData(prev => ({
      ...prev,
      name: formData.name
    }));
    
    alert(error.response?.data?.message || 'Profile updated locally. Server sync failed.');
  }
};

  const handleChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE}/api/users/change-password`,
        {
          currentPassword: currentPassword,
          newPassword: newPassword
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      if (response.data) {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('💾 Saving notification settings:', notificationSettings);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.put(
        `${API_BASE}/api/users/notification-settings`,
        notificationSettings,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log('✅ Server response:', response.data);
      
      if (response.data) {
        alert('Notification settings saved successfully!');
        
        // Refresh from server to confirm
        await fetchUserData();
      }
    } catch (error) {
      console.error('❌ Error saving notifications:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to save notification settings');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('💾 Saving privacy settings:', privacySettings);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.put(
        `${API_BASE}/api/users/privacy-settings`,
        privacySettings,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log('✅ Server response:', response.data);
      
      if (response.data) {
        alert('Privacy settings saved successfully!');
        
        // Refresh from server to confirm
        await fetchUserData();
      }
    } catch (error) {
      console.error('❌ Error saving privacy settings:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to save privacy settings');
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/users/export-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Student Data Export - ${data.profile?.name || 'Student'}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              max-width: 900px; 
              margin: 0 auto;
              color: #333;
              line-height: 1.6;
            }
            .header { 
              background: linear-gradient(135deg, #0f766e 0%, #059669 100%);
              color: white; 
              padding: 30px; 
              margin: -40px -40px 30px -40px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: bold;
            }
            .header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .profile-section {
              display: flex;
              gap: 30px;
              margin-bottom: 40px;
              background: #f8fafb;
              padding: 25px;
              border-radius: 8px;
              border-left: 4px solid #0f766e;
            }
            .profile-image {
              flex-shrink: 0;
            }
            .profile-image img {
              width: 120px;
              height: 120px;
              border-radius: 12px;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              object-fit: cover;
            }
            .profile-info {
              flex: 1;
            }
            .profile-info h2 {
              margin: 0 0 15px 0;
              font-size: 22px;
              color: #0f766e;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .info-label {
              font-weight: 600;
              color: #555;
              width: 120px;
              flex-shrink: 0;
            }
            .info-value {
              color: #333;
            }
            .section {
              margin-bottom: 35px;
              background: white;
              padding: 25px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              page-break-inside: avoid;
            }
            .section h3 {
              margin: 0 0 15px 0;
              font-size: 18px;
              color: #0f766e;
              border-bottom: 2px solid #0f766e;
              padding-bottom: 10px;
            }
            .settings-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .setting-item {
              padding: 12px;
              background: #f8fafb;
              border-radius: 6px;
              border-left: 3px solid #059669;
            }
            .setting-label {
              font-weight: 600;
              color: #333;
              font-size: 14px;
            }
            .setting-value {
              color: #666;
              font-size: 13px;
              margin-top: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #999;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .header { margin: -20px -20px 20px -20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Data Export</h1>
            <p>Export Date: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>

          <div class="profile-section">
            ${profileImage ? `
              <div class="profile-image">
                <img src="${profileImage}" alt="Profile Picture" />
              </div>
            ` : ''}
            <div class="profile-info">
              <h2>${data.profile?.name || 'Student'}</h2>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${data.profile?.email || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Role:</span>
                <span class="info-value">${data.profile?.role || 'Student'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Member Since:</span>
                <span class="info-value">${data.profile?.createdAt ? new Date(data.profile.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📋 Notification Settings</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-label">Email Notifications</div>
                <div class="setting-value">${data.settings?.notifications?.emailNotifications ? '✓ Enabled' : '✗ Disabled'}</div>
              </div>
              <div class="setting-item">
                <div class="setting-label">In-App Notifications</div>
                <div class="setting-value">${data.settings?.notifications?.inAppNotifications ? '✓ Enabled' : '✗ Disabled'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>🔒 Privacy Settings</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-label">Emotion Detection Consent</div>
                <div class="setting-value">${data.settings?.privacy?.emotionDataConsent ? '✓ Granted' : '✗ Not Granted'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📊 Learning Statistics</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-label">Total Quizzes</div>
                <div class="setting-value">${data.statistics?.totalQuizzes || 0}</div>
              </div>
              <div class="setting-item">
                <div class="setting-label">Average Score</div>
                <div class="setting-value">${data.statistics?.averageScore || 0}%</div>
              </div>
              <div class="setting-item">
                <div class="setting-label">Study Time</div>
                <div class="setting-value">${data.statistics?.studyTime || 0} hours</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is an official export of your EMEXA student profile. Generated on ${new Date().toLocaleString()}</p>
            <p>For security, please keep this document private and do not share with others.</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 250);

      alert('Data export ready. Please select "Save as PDF" in the print dialog.');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

const handleProfileImageChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    alert('File size should be less than 5MB');
    e.target.value = '';
    return;
  }
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    e.target.value = '';
    return;
  }

  console.log('📤 Starting profile image upload...');
  console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);

  try {
    // Create FormData
    const formData = new FormData();
    formData.append('profile', file);

    // Check if admin is viewing
    const isAdminViewing = localStorage.getItem('adminViewingAs');
    const viewingUserId = localStorage.getItem('adminViewingUserId');
    const adminToken = localStorage.getItem('adminToken');
    
    // Add metadata
    if (isAdminViewing && viewingUserId) {
      formData.append('targetUserId', viewingUserId);
      formData.append('userRole', 'student');
      console.log('📤 Admin uploading image for student:', viewingUserId);
    } else {
      formData.append('userRole', 'student');
    }

    // Get token
    const token = isAdminViewing && adminToken ? adminToken : localStorage.getItem('token');
    
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    console.log('🔑 Token found, uploading...');

    // Upload to server
    const response = await axios.post(
      `${API_BASE}/api/users/upload-profile`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log('✅ Upload response:', response.data);

    if (response.data && response.data.profileImage) {
      const cloudinaryUrl = response.data.profileImage;
      
      console.log('✅ Profile image URL:', cloudinaryUrl);

      // Update UI immediately
      setProfileImage(cloudinaryUrl);
      
      // Update userData
      setUserData(prev => ({
        ...prev,
        profileImage: cloudinaryUrl
      }));
      
      // Only cache in localStorage if not admin viewing
      if (!isAdminViewing) {
        localStorage.setItem('studentProfileImage', cloudinaryUrl);
        
        // Notify header component
        window.dispatchEvent(new CustomEvent('studentProfileImageChanged', { 
          detail: cloudinaryUrl 
        }));
      }
      
      alert('✅ Profile picture updated successfully!');
    } else {
      console.error('❌ Invalid response:', response.data);
      alert('Upload completed but no image URL received');
    }
  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    if (error.response) {
      console.error('Server error:', error.response.data);
      alert(`Upload failed: ${error.response.data.message || error.response.data.error || 'Server error'}`);
    } else if (error.request) {
      console.error('No response from server');
      alert('Upload failed: No response from server. Please check your connection.');
    } else {
      console.error('Request error:', error.message);
      alert(`Upload failed: ${error.message}`);
    }
  } finally {
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-24"></div>
            <div className="p-6 -mt-12 relative z-10">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 bg-gray-300 rounded-full animate-pulse border-4 border-white shadow-lg"></div>
                <div className="flex-1 pb-2">
                  <div className="h-6 bg-gray-300 rounded w-48 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }
  const profileContent = (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-24 rounded-t-lg"></div>
          <div className="bg-white h-24"></div>
          
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
              <div className="bg-white rounded-full p-1 shadow-lg">
                <img
                  key={getImageUrl(profileImage || userData?.profileImage)}
                  src={getImageUrl(profileImage || userData?.profileImage)}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  onLoad={() => {
                    console.log('✅ Image loaded successfully from:', getImageUrl(profileImage || userData?.profileImage));
                  }}
                  onError={(e) => {
                    console.error('❌ Image failed to load from:', e.target.src);
                    // Only set fallback if it's not already the fallback (prevent infinite loop)
                    if (!e.target.src.includes('placeholder')) {
                      console.log('🔄 Setting fallback image...');
                      e.target.src = "https://via.placeholder.com/128";
                    }
                  }}
                />
              </div>
              <button
                onClick={handleProfileImageClick}
                type="button"
                className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 shadow-lg transition-colors"
              >
                <Camera size={18} />
              </button>
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">{userData?.name || 'Student'}</h1>
              <p className="text-gray-600 text-sm">{userData?.email || ''}</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-gray-700 text-sm font-medium">
                  {userData?.year ? `${userData.year}` : 'Year: N/A'}{userData?.semester ? ` • ${userData.semester}` : ' • Semester: N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-lg shadow-sm p-8">
          <div className="mb-8">
            <div className="flex gap-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('account')}
                className={`pb-4 px-2 transition relative ${
                  activeTab === 'account'
                    ? 'text-teal-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Account Info
                {activeTab === 'account' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-4 px-2 transition relative ${
                  activeTab === 'settings'
                    ? 'text-teal-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
                {activeTab === 'settings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-4 px-2 transition relative ${
                  activeTab === 'activity'
                    ? 'text-teal-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                 Activity
                {activeTab === 'activity' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`pb-4 px-2 transition relative ${
                  activeTab === 'privacy'
                    ? 'text-teal-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Privacy & Data
                {activeTab === 'privacy' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
                )}
              </button>
            </div>
          </div>

          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Account Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  disabled
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize cursor-not-allowed"
                />
              </div>

              <div className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Do you want change the password
                </button>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleSaveAccountInfo}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors font-medium"
                >
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleNotificationToggle('emailNotifications')}
                      className="sr-only peer"
                    />
                    <div className={`w-14 h-7 rounded-full peer-focus:ring-4 peer-focus:ring-teal-300 relative transition-all duration-300 ${
                      notificationSettings.emailNotifications 
                        ? 'bg-teal-600' 
                        : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                        notificationSettings.emailNotifications ? 'translate-x-7 left-1' : 'left-1'
                      }`}></div>
                    </div>
                    <span className={`ml-3 text-sm font-medium ${
                      notificationSettings.emailNotifications ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                      {notificationSettings.emailNotifications ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>

              
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">In-App Notifications</h3>
                    <p className="text-sm text-gray-600">Receive notifications in the application</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={notificationSettings.inAppNotifications}
                      onChange={() => handleNotificationToggle('inAppNotifications')}
                      className="sr-only peer"
                    />
                    <div className={`w-14 h-7 rounded-full peer-focus:ring-4 peer-focus:ring-teal-300 relative transition-all duration-300 ${
                      notificationSettings.inAppNotifications 
                        ? 'bg-teal-600' 
                        : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                        notificationSettings.inAppNotifications ? 'translate-x-7 left-1' : 'left-1'
                      }`}></div>
                    </div>
                    <span className={`ml-3 text-sm font-medium ${
                      notificationSettings.inAppNotifications ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                      {notificationSettings.inAppNotifications ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveNotifications}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors font-medium"
                >
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
             <ActivityTab />
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Privacy & Data</h2>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Emotion Data Consent</h3>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 mb-3">
                        Allow the application to collect and analyze emotional data during quiz sessions to improve learning experience.
                      </p>
                      <a href="#" className="text-sm text-teal-600 hover:underline">Read our privacy policy</a>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={privacySettings.emotionDataConsent}
                        onChange={() => handlePrivacyToggle('emotionDataConsent')}
                        className="sr-only peer"
                      />
                      <div className={`w-14 h-7 rounded-full peer-focus:ring-4 peer-focus:ring-teal-300 relative transition-all duration-300 ${
                        privacySettings.emotionDataConsent 
                          ? 'bg-teal-600' 
                          : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                          privacySettings.emotionDataConsent ? 'translate-x-7 left-1' : 'left-1'
                        }`}></div>
                      </div>
                      <span className={`ml-3 text-sm font-medium ${
                        privacySettings.emotionDataConsent ? 'text-teal-600' : 'text-gray-500'
                      }`}>
                        {privacySettings.emotionDataConsent ? 'GRANTED' : 'NOT GRANTED'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Export Your Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download a copy of your personal data and activity history. The export includes your profile information, quiz history, and performance data.
                  </p>
                  <button
                    onClick={handleExportData}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors"
                  >
                    <span>Export All Data</span>
                  </button>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSavePrivacy}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors font-medium"
                  >
                    <span>Save Privacy Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSave={handleChangePassword}
      />
    </div>
  );

  if (isAdminViewing && adminToken) {
    return (
      <AdminViewWrapper dashboardType="student">
        {profileContent}
      </AdminViewWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header userName={userName} userRole="student" />
      <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} />
      <div className="ml-52 pt-14">
        {profileContent}
      </div>
    </div>
  );
};

export default Profile;