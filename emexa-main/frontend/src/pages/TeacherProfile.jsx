import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Camera, Eye, EyeOff } from "lucide-react";
import Header from "../components/headerorigin";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebarorigin";
import AdminViewWrapper from "../components/AdminViewWrapper";
import tProfile from "../assets/t-profile.png";
import jsPDF from "jspdf";
import TeacherActivityTab from '../components/TeacherActivityTab'; 

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

// Helper function to get full image URL - IMPORTANT for multi-device support
const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/120";

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it's a relative path, construct full URL using API_BASE
  if (imagePath.startsWith("/uploads/")) {
    return `${API_BASE}${imagePath}`;
  }

  return imagePath;
};

// Password Modal Component - Separate to prevent re-renders
const PasswordModal = ({ isOpen, onClose, onSave }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleSave = () => {
    onSave({ currentPassword, newPassword, confirmPassword });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.current ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              type="button"
              className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Save Changes
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

const TeacherProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = useState("profile");
  const [activeTab, setActiveTab] = useState("account");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "Teacher",
  });

  const [isAdminViewing, setIsAdminViewing] = useState(false);
  const [viewingUserData, setViewingUserData] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    emotionDataConsent: true,
  });

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [adminToken] = useState(() => localStorage.getItem("adminToken"));

  // Teacher menu items with navigation
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
        navigate("/teacher-dashboard");
      },
    },
    {
      id: "quiz",
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
        navigate("/teacher-dashboard", { state: { activeMenu: "quizzes" } });
      },
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
        setActiveMenuItem("profile");
        navigate("/teacher-profile");
      },
    },
  ];

  // Ensure activeMenuItem is always 'profile' when on profile page
  useEffect(() => {
    if (location.pathname === "/teacher-profile") {
      setActiveMenuItem("profile");
    }
  }, [location.pathname]);

  // CRITICAL: Main data fetching effect - handles both admin viewing and regular teacher
  useEffect(() => {
    const fetchTeacherData = async () => {
      setLoading(true);

      try {
        const adminViewingAs = localStorage.getItem("adminViewingAs");
        const viewingUserId = localStorage.getItem("adminViewingUserId");
        const adminToken = localStorage.getItem("adminToken");

        console.log("🔍 Checking admin view status:", {
          adminViewingAs,
          viewingUserId,
          hasAdminToken: !!adminToken,
        });

        // ADMIN VIEWING SPECIFIC TEACHER
        if (adminViewingAs === "teacher" && viewingUserId && adminToken) {
          console.log("👤 Admin viewing teacher ID:", viewingUserId);
          setIsAdminViewing(true);

          try {
            // Fetch the specific teacher's profile by ID
            const response = await axios.get(
              `http://localhost:5000/api/users/${viewingUserId}`,
              {
                headers: { Authorization: `Bearer ${adminToken}` },
              }
            );

            const user = response.data;
            console.log("✅ Fetched teacher data for admin view:", user);

            setViewingUserData(user);

            setFormData({
              fullName: user.name || "",
              email: user.email || "",
              role: "Teacher",
            });

            // IMPORTANT: Use getImageUrl helper for proper image URL
            if (user.profileImage) {
              const imageUrl = getImageUrl(user.profileImage);
              console.log("🖼️ Setting teacher profile image:", imageUrl);
              setAvatarUrl(imageUrl);
            }

            // Set notification settings
            if (user.notificationSettings) {
              setNotificationSettings({
                emailNotifications:
                  user.notificationSettings.emailNotifications ?? true,
                smsNotifications:
                  user.notificationSettings.smsNotifications ?? false,
                inAppNotifications:
                  user.notificationSettings.inAppNotifications ?? true,
              });
            }

            // Set privacy settings
            if (user.privacySettings) {
              setPrivacySettings({
                emotionDataConsent:
                  user.privacySettings.emotionDataConsent ?? true,
              });
            }

            setLoading(false);
            return;
          } catch (error) {
            console.error("❌ Error fetching teacher for admin:", error);
            alert(
              "Failed to load teacher profile. Returning to user management."
            );

            // Clear admin viewing flags and return to user management
            localStorage.removeItem("adminViewingUserId");
            localStorage.removeItem("adminViewingUserRole");
            localStorage.removeItem("adminViewingAs");
            localStorage.removeItem("adminViewingUserData");

            navigate("/admin/user-management");
            return;
          }
        }

        // NORMAL TEACHER VIEWING THEIR OWN PROFILE
        console.log("👤 Regular teacher viewing own profile");
        setIsAdminViewing(false);

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setFormData((prev) => ({
            ...prev,
            fullName: parsed.fullName || parsed.name || prev.fullName,
            email: parsed.email || prev.email,
            role: "Teacher",
          }));
        } else {
          const storedName =
            localStorage.getItem("userName") || localStorage.getItem("name");
          const storedEmail = localStorage.getItem("email");
          setFormData((prev) => ({
            ...prev,
            fullName: storedName || prev.fullName,
            email: storedEmail || prev.email,
            role: "Teacher",
          }));
        }

        // Try to fetch profile from server
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const response = await axios.get("/api/users/profile", {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.profileImage) {
              const cloudinaryUrl = getImageUrl(response.data.profileImage);
              setAvatarUrl(cloudinaryUrl);
              localStorage.setItem("teacherProfileImage", cloudinaryUrl);
            }

            if (response.data?.data?.settings) {
              const serverSettings = response.data.data.settings;

              setNotificationSettings({
                emailNotifications: serverSettings.emailNotifications ?? true,
                smsNotifications: serverSettings.smsNotifications ?? false,
                inAppNotifications: serverSettings.inAppNotifications ?? true,
              });

              setPrivacySettings({
                emotionDataConsent: serverSettings.emotionDataConsent ?? true,
              });

              localStorage.setItem(
                "profileSettings",
                JSON.stringify(serverSettings)
              );
            }
          }
        } catch (err) {
          console.warn(
            "Failed to fetch teacher profile:",
            err?.response?.data || err.message
          );

          // Load cached image if available
          const savedImage = localStorage.getItem("teacherProfileImage");
          if (savedImage) {
            setAvatarUrl(savedImage);
          }
        }
      } catch (error) {
        console.error("💥 Critical error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [navigate]);

  const handleAvatarClick = () => {
    // Admin can now edit profile images too
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      e.target.value = "";
      return;
    }

    console.log("📤 Starting profile image upload...");
    console.log("File:", file.name, "Size:", file.size, "Type:", file.type);
    console.log("Admin viewing:", isAdminViewing);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("profile", file);

      // CRITICAL: Add userId and role when admin is uploading for another user
      if (isAdminViewing && viewingUserData?._id) {
        formDataToSend.append("targetUserId", viewingUserData._id);
        formDataToSend.append("userRole", "teacher");
        console.log(
          "📤 Admin uploading image for teacher:",
          viewingUserData._id
        );
      } else {
        formDataToSend.append("userRole", "teacher");
      }

      // IMPORTANT: Use admin token if admin is viewing
      const token = isAdminViewing
        ? localStorage.getItem("adminToken") || localStorage.getItem("token")
        : localStorage.getItem("token");

      if (!token) {
        alert("Authentication required. Please log in again.");
        return;
      }

      console.log("🔑 Token found, uploading...");

      // Upload endpoint
      const uploadUrl = "/api/users/upload-profile";

      const res = await axios.post(uploadUrl, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Upload response:", res.data);

      const cloudinaryUrl = res.data?.profileImage;
      if (cloudinaryUrl) {
        const fullUrl = getImageUrl(cloudinaryUrl);
        setAvatarUrl(fullUrl);

        // Only update localStorage if not admin viewing
        if (!isAdminViewing) {
          localStorage.setItem("teacherProfileImage", fullUrl);
          window.dispatchEvent(
            new CustomEvent("teacherProfileImageChanged", { detail: fullUrl })
          );
        }

        alert("✅ Profile picture updated successfully!");
      }
    } catch (err) {
      console.error("❌ Upload failed:", err?.response?.data || err.message);
      alert("Failed to upload profile picture. Please try again.");

      if (!isAdminViewing) {
        const storedImage = localStorage.getItem("teacherProfileImage");
        if (storedImage) {
          setAvatarUrl(storedImage);
        }
      }
    } finally {
      e.target.value = "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Only update localStorage events if not admin viewing
    if (name === "fullName" && value.trim() && !isAdminViewing) {
      setDisplayName(value);
      localStorage.setItem("userName", value);
      window.dispatchEvent(
        new CustomEvent("userNameChanged", { detail: value })
      );
    }
  };

  const handleNotificationToggle = (key) => {
    // Admin can now toggle settings
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrivacyToggle = (key) => {
    // Admin can now toggle privacy settings
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleUpdateProfile = async () => {
    if (!formData.fullName || formData.fullName.trim() === "") {
      alert("Name cannot be empty");
      return;
    }

    try {
      // IMPORTANT: Use admin token if admin is viewing
      const token = isAdminViewing
        ? localStorage.getItem("adminToken") || localStorage.getItem("token")
        : localStorage.getItem("token");

      if (!token) {
        console.warn("No token found");
        alert("Please login again to save changes");
        return;
      }

      console.log("💾 Saving profile data:", formData);
      console.log(
        "Admin viewing:",
        isAdminViewing,
        "User ID:",
        viewingUserData?._id
      );

      // If admin is viewing, update the specific user's profile
      let updateUrl = "/api/teacher/update-name";
      let requestData = { name: formData.fullName };

      if (isAdminViewing && viewingUserData?._id) {
        // Update specific user by ID (admin endpoint)
        updateUrl = `/api/users/${viewingUserData._id}`;
        requestData = {
          name: formData.fullName,
          email: formData.email,
        };

        const response = await axios.put(updateUrl, requestData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success || response.data) {
          // Update local state
          setViewingUserData((prev) => ({
            ...prev,
            name: formData.fullName,
          }));

          alert("✅ Teacher profile updated successfully by admin!");
        }
      } else {
        // Regular teacher updating their own profile
        const response = await axios.put(updateUrl, requestData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success || response.data?.data) {
          const updatedName = response.data.data?.name || formData.fullName;

          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.name = updatedName;
            parsed.fullName = updatedName;
            localStorage.setItem("user", JSON.stringify(parsed));
          }

          localStorage.setItem("userName", updatedName);
          setDisplayName(updatedName);
          window.dispatchEvent(
            new CustomEvent("userNameChanged", { detail: updatedName })
          );

          if (avatarUrl) {
            window.dispatchEvent(
              new CustomEvent("teacherProfileImageChanged", {
                detail: avatarUrl,
              })
            );
          }

          alert("Profile updated successfully!");
        }
      }
    } catch (error) {
      console.error("Save changes error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to save changes. Please try again."
      );
    }
  };

  const handleChangePassword = () => {
    // Admin can change password too
    setShowPasswordModal(true);
  };

  const handleSubmitChangePassword = async ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    try {
      // Use admin token if admin is viewing
      const token = isAdminViewing
        ? localStorage.getItem("adminToken") || localStorage.getItem("token")
        : localStorage.getItem("token");

      if (!token) {
        alert("Please login again to change password");
        return;
      }

      const response = await axios.put(
        "/api/teacher/change-password",
        { currentPassword, newPassword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        alert("Password changed successfully!");
        setShowPasswordModal(false);
      }
    } catch (error) {
      console.error("Password change error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to change password. Please try again."
      );
    }
  };

  const handleSaveNotifications = async () => {
    setSettingsLoading(true);

    try {
      // IMPORTANT: Use admin token if admin is viewing
      const token = isAdminViewing
        ? localStorage.getItem("adminToken") || localStorage.getItem("token")
        : localStorage.getItem("token");

      console.log("💾 Saving notification settings:", notificationSettings);
      console.log(
        "Admin viewing:",
        isAdminViewing,
        "User ID:",
        viewingUserData?._id
      );

      let updateUrl = "http://localhost:5000/api/teacher/settings";

      if (isAdminViewing && viewingUserData?._id) {
        // Admin updating specific user's settings
        updateUrl = `http://localhost:5000/api/users/${viewingUserData._id}/notification-settings`;

        const response = await axios.put(updateUrl, notificationSettings, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success || response.data) {
          alert("✅ Notification settings updated successfully by admin!");
        }
      } else {
        const response = await axios.put(updateUrl, notificationSettings, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success) {
          localStorage.setItem(
            "profileSettings",
            JSON.stringify(notificationSettings)
          );
          alert("Notification settings saved successfully!");
        }
      }
    } catch (err) {
      console.error(
        "❌ Failed to save settings:",
        err?.response?.data || err.message
      );

      if (!isAdminViewing) {
        localStorage.setItem(
          "profileSettings",
          JSON.stringify(notificationSettings)
        );
      }

      alert("Error: " + (err?.response?.data?.message || err.message));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSettingsLoading(true);

    try {
      // IMPORTANT: Use admin token if admin is viewing
      const token = isAdminViewing
        ? localStorage.getItem("adminToken") || localStorage.getItem("token")
        : localStorage.getItem("token");

      console.log("💾 Saving privacy settings:", privacySettings);
      console.log(
        "Admin viewing:",
        isAdminViewing,
        "User ID:",
        viewingUserData?._id
      );

      const payload = {
        ...notificationSettings,
        ...privacySettings,
      };

      let updateUrl = "http://localhost:5000/api/teacher/settings";

      if (isAdminViewing && viewingUserData?._id) {
        // Admin updating specific user's privacy settings
        updateUrl = `http://localhost:5000/api/users/${viewingUserData._id}/privacy-settings`;

        const response = await axios.put(updateUrl, privacySettings, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success || response.data) {
          alert("✅ Privacy settings updated successfully by admin!");
        }
      } else {
        const response = await axios.put(updateUrl, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success) {
          localStorage.setItem("profileSettings", JSON.stringify(payload));
          alert("Privacy settings saved successfully!");
        }
      }
    } catch (err) {
      console.error(
        "❌ Failed to save privacy settings:",
        err?.response?.data || err.message
      );
      alert("Error: " + (err?.response?.data?.message || err.message));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChangePwdInput = (e) => {
    const { name, value } = e.target;
    setChangePwdData((p) => ({ ...p, [name]: value }));
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
    setChangePwdData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    alert("Logged out successfully!");
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE = "http://localhost:5000";
      const response = await axios.get(`${API_BASE}/api/users/export-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teacher Data Export - ${formData.fullName || "Teacher"}</title>
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
            <h1>Teacher Data Export</h1>
            <p>Export Date: ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
          </div>

          <div class="profile-section">
            ${
              avatarUrl
                ? `
              <div class="profile-image">
                <img src="${avatarUrl}" alt="Profile Picture" />
              </div>
            `
                : ""
            }
            <div class="profile-info">
              <h2>${formData.fullName || "Teacher"}</h2>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${formData.email || "N/A"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Role:</span>
                <span class="info-value">Teacher</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📋 Notification Settings</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-label">Email Notifications</div>
                <div class="setting-value">${
                  notificationSettings.emailNotifications
                    ? "✓ Enabled"
                    : "✗ Disabled"
                }</div>
              </div>
              <div class="setting-item">
                <div class="setting-label">SMS Notifications</div>
                <div class="setting-value">${
                  notificationSettings.smsNotifications
                    ? "✓ Enabled"
                    : "✗ Disabled"
                }</div>
              </div>
              <div class="setting-item">
                <div class="setting-label">In-App Notifications</div>
                <div class="setting-value">${
                  notificationSettings.inAppNotifications
                    ? "✓ Enabled"
                    : "✗ Disabled"
                }</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>🔒 Privacy Settings</h3>
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-label">Emotion Detection Consent</div>
                <div class="setting-value">${
                  privacySettings.emotionDataConsent
                    ? "✓ Granted"
                    : "✗ Not Granted"
                }</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is an official export of your EMEXA teacher profile. Generated on ${new Date().toLocaleString()}</p>
            <p>For security, please keep this document private and do not share with others.</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 250);

      // Create notification for successful data export
      const fileName = `Teacher_Data_Export_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      try {
        await axios.post(
          `${API_BASE}/api/notifications/data-export`,
          { fileName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ Data export notification created");
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      alert("Your data has been exported successfully as a PDF!");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    }
  };

  // Loading state display
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

          <p className="mt-6 text-center text-gray-500 text-sm">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // Main profile content (used in both admin and regular views)
  // Main profile content (used in both admin and regular views)
  const profileContent = (
    <div className="min-h-screen bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: "none" }}
      />

      {/* Admin Preview Banner - Only shows when admin is viewing */}
      {isAdminViewing && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-yellow-800">
              Admin Preview Mode: Viewing {viewingUserData?.name || "Teacher"}'s
              Profile
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("adminViewingAs");
              localStorage.removeItem("adminViewingUserId");
              localStorage.removeItem("adminViewingUserRole");
              localStorage.removeItem("adminViewingUserData");
              window.location.href = "/admin/user-management";
            }}
            className="text-sm text-yellow-700 hover:text-yellow-900 font-medium flex items-center gap-2"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to User Management
          </button>
        </div>
      )}

      {/* Profile Header Section */}
      <div className="relative bg-white">
        <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-32"></div>

        <div className="px-8 -mt-16 pb-6">
          <div className="flex items-end gap-6">
            <div className="relative">
              <div className="bg-white rounded-full p-1 shadow-lg">
                <img
                  src={avatarUrl || "https://via.placeholder.com/120"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              </div>
              {/* Camera button - Now available for admin too */}
              <button
                onClick={handleAvatarClick}
                type="button"
                className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 shadow-lg transition-colors"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="pb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {formData.fullName || "Teacher"}
              </h1>
              <p className="text-gray-600 text-sm mt-1">{formData.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="bg-white px-8 py-6">
        <div className="mb-6">
          <div className="flex gap-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("account")}
              className={`pb-4 px-2 transition relative ${
                activeTab === "account"
                  ? "text-teal-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Account Info
              {activeTab === "account" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-4 px-2 transition relative ${
                activeTab === "settings"
                  ? "text-teal-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Settings
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`pb-4 px-2 transition relative ${
                activeTab === "activity"
                  ? "text-teal-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Activity
              {activeTab === "activity" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`pb-4 px-2 transition relative ${
                activeTab === "privacy"
                  ? "text-teal-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Privacy & Data
              {activeTab === "privacy" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* ACCOUNT INFO TAB */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              Account Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  autoComplete="off"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition text-sm bg-white border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  autoComplete="off"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="max-w-[calc(50%-12px)]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value="Teacher"
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Change Password Section - Available for admin */}
            <div className="pt-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Change Password
              </h3>
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Do you want change the password
              </button>
            </div>

            {/* Save Changes Button - Available for admin */}
            <div className="pt-6">
              <button
                onClick={handleUpdateProfile}
                type="button"
                className="px-6 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg transition hover:bg-teal-700 flex items-center gap-2"
              >
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
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              Notification Preferences
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={() =>
                      handleNotificationToggle("emailNotifications")
                    }
                    className="sr-only peer"
                  />
                  <div
                    className={`w-14 h-7 rounded-full peer-focus:ring-4 peer-focus:ring-teal-300 relative transition-all duration-300 ${
                      notificationSettings.emailNotifications
                        ? "bg-teal-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                        notificationSettings.emailNotifications
                          ? "translate-x-7 left-1"
                          : "left-1"
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      notificationSettings.emailNotifications
                        ? "text-teal-600"
                        : "text-gray-500"
                    }`}
                  >
                    {notificationSettings.emailNotifications ? "ON" : "OFF"}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-medium text-gray-900">
                    In-App Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Receive notifications in the application
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notificationSettings.inAppNotifications}
                    onChange={() =>
                      handleNotificationToggle("inAppNotifications")
                    }
                    className="sr-only peer"
                  />
                  <div
                    className={`w-14 h-7 rounded-full peer-focus:ring-4 peer-focus:ring-teal-300 relative transition-all duration-300 ${
                      notificationSettings.inAppNotifications
                        ? "bg-teal-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                        notificationSettings.inAppNotifications
                          ? "translate-x-7 left-1"
                          : "left-1"
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      notificationSettings.inAppNotifications
                        ? "text-teal-600"
                        : "text-gray-500"
                    }`}
                  >
                    {notificationSettings.inAppNotifications ? "ON" : "OFF"}
                  </span>
                </label>
              </div>
            </div>

            {/* Save Notifications Button - Available for admin */}
            <div className="pt-4">
              <button
                onClick={handleSaveNotifications}
                disabled={settingsLoading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors font-medium disabled:opacity-50"
              >
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
           <TeacherActivityTab />
        )}

        {/* PRIVACY & DATA TAB */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Privacy & Data</h2>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Emotion Data Consent
              </h3>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-3">
                      Allow the application to collect and analyze emotional
                      data during quiz sessions.
                    </p>
                    <a
                      href="#"
                      className="text-sm text-teal-600 hover:underline"
                    >
                      Read our privacy policy
                    </a>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input
                      type="checkbox"
                      checked={privacySettings.emotionDataConsent}
                      onChange={() => handlePrivacyToggle("emotionDataConsent")}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-14 h-7 rounded-full peer-focus:ring-4 peer-focus:ring-teal-300 relative transition-all duration-300 ${
                        privacySettings.emotionDataConsent
                          ? "bg-teal-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                          privacySettings.emotionDataConsent
                            ? "translate-x-7 left-1"
                            : "left-1"
                        }`}
                      ></div>
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        privacySettings.emotionDataConsent
                          ? "text-teal-600"
                          : "text-gray-500"
                      }`}
                    >
                      {privacySettings.emotionDataConsent
                        ? "GRANTED"
                        : "NOT GRANTED"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Export Data Section - Only for non-admin users */}
            {!isAdminViewing && (
              <div className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Export Your Data
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download a copy of your personal data and activity history.
                </p>
                <button
                  onClick={handleExportData}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors"
                >
                  <span>Export All Data</span>
                </button>
              </div>
            )}

            {/* Save Privacy Settings Button - Available for admin */}
            <div className="pt-6">
              <button
                onClick={handleSavePrivacy}
                disabled={settingsLoading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 transition-colors font-medium disabled:opacity-50 w-fit"
              >
                <span>Save Privacy Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSave={handleSubmitChangePassword}
      />
    </div>
  );

  // Determine if this is actually admin viewing
  const isActuallyAdminViewing =
    isAdminViewing && adminToken && localStorage.getItem("adminViewingUserId");

  console.log("🎯 Render decision:", {
    isAdminViewing,
    hasAdminToken: !!adminToken,
    hasViewingUserId: !!localStorage.getItem("adminViewingUserId"),
    isActuallyAdminViewing,
  });

  // If admin is viewing, wrap in AdminViewWrapper
  if (isActuallyAdminViewing) {
    return (
      <AdminViewWrapper dashboardType="teacher">
        {profileContent}
      </AdminViewWrapper>
    );
  }

  // Normal teacher viewing their own profile
  // Normal teacher viewing their own profile
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userName={formData.fullName || displayName || "Teacher"}
        userRole="teacher"
      />
      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        menuItems={teacherMenuItems}
      />
      <div className="ml-55 pt-16">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            {profileContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
