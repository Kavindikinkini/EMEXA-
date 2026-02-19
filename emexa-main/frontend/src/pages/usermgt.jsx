// frontend/src/pages/usermgt.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import axios from 'axios';
import {
  getUsers,
  deleteUser,
} from "../services/user.service";
import Modal from "react-modal";
import Header from "../components/headerorigin.jsx";
import Sidebar from "../components/sidebarorigin.jsx";

const StatusTag = ({ status }) => (
  <span className={`px-3 py-1 rounded text-xs font-medium ${
    status === "Active" ? "bg-green-100 text-green-700" :
    status === "Inactive" ? "bg-red-100 text-red-700" :
    "bg-gray-100 text-gray-700"
  }`}>
    {status || "Pending"}
  </span>
);

const RoleTag = ({ role }) => (
  <span className={`px-3 py-1 rounded text-xs font-medium ${
    role === "Admin" ? "bg-purple-100 text-purple-700" :
    role === "Teacher" ? "bg-blue-100 text-blue-700" :
    role === "Student" ? "bg-green-100 text-green-700" :
    "bg-gray-100 text-gray-700"
  }`}>
    {role}
  </span>
);

const UserManagement = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [teacherApprovals, setTeacherApprovals] = useState([]);
  const [studentApprovals, setStudentApprovals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfileImage, setAdminProfileImage] = useState(null);

  const roles = ["All Roles", "Admin", "Teacher", "Student"];

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

const handleProfileImageChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validation
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

  // Optimistic preview
  const reader = new FileReader();
  reader.onload = (evt) => {
    setAdminProfileImage(evt.target.result);
  };
  reader.readAsDataURL(file);

  // Upload to Cloudinary via backend
  try {
    const formData = new FormData();
    formData.append('profile', file);
    formData.append('userRole', 'admin'); // IMPORTANT: Specify this is admin's image
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    console.log('📤 Uploading admin profile image...');
    
    const res = await axios.post('/api/users/upload-profile', formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Upload response:', res.data);

    // Get Cloudinary URL from response
    const cloudinaryUrl = res.data?.profileImage;
    if (cloudinaryUrl) {
      setAdminProfileImage(cloudinaryUrl);
      localStorage.setItem('adminProfileImage', cloudinaryUrl);
      
      // Dispatch event for header update - ONLY for admin
      window.dispatchEvent(new CustomEvent('adminProfileImageChanged', { detail: cloudinaryUrl }));
      
      alert('Admin profile picture updated successfully!');
      
      // Refetch profile to ensure sync
      try {
        const profileRes = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.data?.profileImage) {
          setAdminProfileImage(profileRes.data.profileImage);
          localStorage.setItem('adminProfileImage', profileRes.data.profileImage);
        }
      } catch (refetchErr) {
        console.warn('Refetch failed:', refetchErr.message);
      }
    }
  } catch (err) {
    console.error('❌ Upload failed:', err?.response?.data || err.message);
    alert('Failed to upload profile picture. Please try again.');
    
    // Revert to previous image on failure
    const storedImage = localStorage.getItem('adminProfileImage');
    if (storedImage) {
      setAdminProfileImage(storedImage);
    }
  } finally {
    e.target.value = '';
  }
};

  // FIXED: Updated navigation function with proper state management
  const navigateToDashboard = (type) => {
    console.log(`🔄 Navigating to ${type} dashboard as admin`);
    
    // Set the viewing mode BEFORE navigation
    localStorage.setItem("adminViewingAs", type);
    
    // Also set a flag that admin is viewing (for ProtectedRoute to check)
    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const adminUserData = localStorage.getItem('adminUser');
    
    console.log('Admin state:', {
      adminViewingAs: type,
      hasAdminToken: !!adminToken,
      hasAdminUser: !!adminUserData
    });
    
    // Navigate to the correct route based on type
    if (type === "student") {
      // Force reload to ensure StudentDashboard initializes with admin context
      window.location.href = "/dashboard";
    } else if (type === "teacher") {
      // Force reload to ensure TeacherDashboard initializes with admin context
      window.location.href = "/teacher-dashboard";
    }
  };

const handleViewUser = (user) => {
  console.log('👁️ Admin viewing user profile:', user);
  
  // CRITICAL: Clean up ALL previous states first
  localStorage.removeItem('adminViewingUserId');
  localStorage.removeItem('adminViewingUserRole');
  localStorage.removeItem('adminViewingUserData');
  localStorage.removeItem('adminViewingAs');
  
  // Store the complete user data for the profile page
  const userDataToStore = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    profileImage: user.profileImage || null,
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth || '',
    qualifications: user.qualifications || '',
    subjects: user.subjects || [],
    grade: user.grade || '',
    guardianName: user.guardianName || '',
    guardianContact: user.guardianContact || '',
    bio: user.bio || '',
    address: user.address || '',
    notificationSettings: user.notificationSettings || {
      emailNotifications: true,
      smsNotifications: false,
      inAppNotifications: true
    },
    privacySettings: user.privacySettings || {
      emotionDataConsent: true
    }
  };
  
  // Set the admin viewing flags
  localStorage.setItem('adminViewingUserId', user._id);
  const roleFormatted = user.role.toLowerCase();
  localStorage.setItem('adminViewingUserRole', roleFormatted);
  localStorage.setItem('adminViewingAs', roleFormatted);
  localStorage.setItem('adminViewingUserData', JSON.stringify(userDataToStore));
  
  console.log('✅ Admin viewing state set:', {
    userId: user._id,
    role: roleFormatted,
    name: user.name,
    viewingAs: localStorage.getItem('adminViewingAs')
  });
  
  // Navigate based on role - use window.location.href for clean reload
  if (roleFormatted === 'student') {
    window.location.href = '/profile';
  } else if (roleFormatted === 'teacher') {
    window.location.href = '/teacher-profile';
  } else {
    console.error('Unknown role:', user.role);
    alert('Cannot view profile for this user role');
  }
};

  const adminMenuItems = [
    {
      id: "userManagement",
      label: "User Management",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      onClick: () => {
        localStorage.removeItem("adminViewingAs");
        window.location.href = "/admin/user-management";
      },
    },
    {
      id: "studentPreview",
      label: "Student Dashboard",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0H5" /></svg>,
      onClick: () => navigateToDashboard("student"),
    },
    {
      id: "teacherPreview",
      label: "Teacher Dashboard",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" /></svg>,
      onClick: () => navigateToDashboard("teacher"),
    },
  ];

  useEffect(() => {
    const admin = localStorage.getItem("adminUser");
    if (admin) setAdminUser(JSON.parse(admin));
    
    const savedImage = localStorage.getItem('adminProfileImage');
    if (savedImage) {
      setAdminProfileImage(savedImage);
    }
  }, []);

  // Fetch admin profile from server to get profileImage
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const res = await axios.get('/api/users/profile', {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined
          }
        });
        
        console.log('📥 Admin profile fetched:', res.data);
        
        if (res.data?.profileImage) {
          setAdminProfileImage(res.data.profileImage);
          localStorage.setItem('adminProfileImage', res.data.profileImage);
        }
      } catch (err) {
        console.warn('Failed to fetch admin profile image:', err?.response?.data || err.message);
      }
    };
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!adminToken && (!token || role !== "admin")) {
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch data with new approval endpoints
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        
        // Fetch all three lists in parallel
        const [usersRes, teacherRes, studentRes] = await Promise.allSettled([
          getUsers(),
          fetch("http://localhost:5000/api/auth/teacher-approvals", { 
            credentials: "include",
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(r => r.ok ? r.json() : []),
          fetch("http://localhost:5000/api/auth/student-approvals", { 
            credentials: "include",
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(r => r.ok ? r.json() : [])
        ]);

        // Set users list (approved users from Student/Teacher collections)
        setUsers(usersRes.status === "fulfilled" ? usersRes.value || [] : []);
        
        // Set approval lists (pending/rejected from User collection)
        const teachers = teacherRes.status === "fulfilled" ? teacherRes.value || [] : [];
        const students = studentRes.status === "fulfilled" ? studentRes.value || [] : [];
        
        console.log('📊 Fetched data:', { 
          users: usersRes.status === "fulfilled" ? usersRes.value?.length : 0,
          teachers: teachers.length, 
          students: students.length 
        });
        
        setTeacherApprovals(teachers);
        setStudentApprovals(students);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (type, user) => { setModalType(type); setSelectedUser(user); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalType(""); setSelectedUser(null); };

  const handleDeleteUser = (id) => {
    deleteUser(id).then(() => {
      setUsers(prev => prev.filter(u => u._id !== id));
      closeModal();
    });
  };

  // Student approval handlers
  const handleApproveStudent = async (id) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/auth/student-approvals/${id}/approve`, { 
        method: "PUT", 
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        console.log('✅ Student approved');
        // Remove from approval list
        setStudentApprovals(prev => prev.filter(a => a._id !== id));
        // Refresh users list to show newly approved user
        const usersRes = await getUsers();
        setUsers(usersRes || []);
        alert('Student approved successfully! They can now login and will appear in All Users tab.');
      } else {
        const error = await res.json();
        console.error('❌ Approval failed:', error);
        alert(error.message || 'Failed to approve student');
      }
    } catch (err) { 
      console.error('❌ Error approving student:', err); 
      alert('Error approving student');
    }
  };

  const handleRejectStudent = async (id) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/auth/student-approvals/${id}/reject`, { 
        method: "PUT", 
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        console.log('❌ Student rejected');
        // Update the status in the list
        setStudentApprovals(prev => prev.map(a => 
          a._id === id ? { ...a, approvalStatus: 'rejected', status: 'Inactive' } : a
        ));
        alert('Student rejected');
      } else {
        const error = await res.json();
        console.error('❌ Rejection failed:', error);
        alert(error.message || 'Failed to reject student');
      }
    } catch (err) { 
      console.error('❌ Error rejecting student:', err);
      alert('Error rejecting student');
    }
  };

// Replace the handleApproveTeacher function in usermgt.jsx with this fixed version:

const handleApproveTeacher = async (id) => {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    console.log('🔄 Approving teacher with ID:', id);
    
    const res = await fetch(`http://localhost:5000/api/auth/teacher-approvals/${id}/approve`, { 
      method: "PUT", 
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', res.status);
    const responseData = await res.json();
    console.log('Response data:', responseData);
    
    // Check if request was successful OR teacher already exists
    if (res.ok) {
      console.log('✅ Teacher approved successfully');
      
      // Remove from approval list
      setTeacherApprovals(prev => prev.filter(a => a._id !== id));
      
      // Refresh users list to show the newly approved teacher
      const usersRes = await getUsers();
      setUsers(usersRes || []);
      
      alert('✅ Teacher approved successfully! They can now login and will appear in All Users tab.');
    } else if (res.status === 400 && responseData.message?.includes('already exists')) {
      // Teacher already exists - this is actually OK, just remove from pending list
      console.log('✅ Teacher already approved, removing from pending list');
      
      // Remove from approval list
      setTeacherApprovals(prev => prev.filter(a => a._id !== id));
      
      // Refresh users list
      const usersRes = await getUsers();
      setUsers(usersRes || []);
      
      alert('✅ This teacher was already approved! Removed from pending list.');
    } else {
      // Actual error
      console.error('❌ Approval failed:', responseData);
      alert(responseData.message || 'Failed to approve teacher');
    }
  } catch (err) { 
    console.error('❌ Error approving teacher:', err);
    alert(`Error approving teacher: ${err.message}`);
  }
};

  const handleRejectTeacher = async (id) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/auth/teacher-approvals/${id}/reject`, { 
        method: "PUT", 
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        console.log('❌ Teacher rejected');
        // Update the status in the list
        setTeacherApprovals(prev => prev.map(a => 
          a._id === id ? { ...a, approvalStatus: 'rejected', status: 'Inactive' } : a
        ));
        alert('Teacher rejected');
      } else {
        const error = await res.json();
        console.error('❌ Rejection failed:', error);
        alert(error.message || 'Failed to reject teacher');
      }
    } catch (err) { 
      console.error('❌ Error rejecting teacher:', err);
      alert('Error rejecting teacher');
    }
  };

  // FIXED: Filter users based on role AND search query
  const filteredUsers = users.filter(u => {
    // Role filter - handle case-insensitive comparison
    const userRole = u.role?.toLowerCase();
    const selectedRoleLower = selectedRole.toLowerCase();
    const roleMatch = selectedRole === "All Roles" || 
                     userRole === selectedRoleLower ||
                     u.role === selectedRole;
    
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = searchQuery === "" || 
      u.name?.toLowerCase().includes(searchLower) || 
      u.email?.toLowerCase().includes(searchLower);
    
    return roleMatch && searchMatch;
  });

  // Debug log to check what we're filtering
  console.log('Total users:', users.length, 'Filtered users:', filteredUsers.length, 'Selected role:', selectedRole);
  
  // Debug: Log user roles if filter returns empty
  if (users.length > 0 && filteredUsers.length === 0) {
    console.log('All user roles:', users.map(u => u.role));
    console.log('Selected role for filter:', selectedRole);
  }

  const pendingTeacherApprovals = teacherApprovals.filter(a => a.approvalStatus === 'pending').length;
  const pendingStudentApprovals = studentApprovals.filter(a => a.approvalStatus === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-24"></div>
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

          <p className="mt-6 text-center text-gray-500 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfileImageChange}
        style={{ display: 'none' }}
      />
      
      <Header userName={adminUser?.name || "Admin"} userRole="admin" />

      <div className="flex">
        <Sidebar activeMenuItem="userManagement" menuItems={adminMenuItems} />

        <main className="flex-1 ml-64 pt-20 px-8">
          {/* Admin Profile Header Section */}
          <div className="relative mb-12">
            <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-24 rounded-t-lg"></div>
            <div className="bg-white h-24"></div>
            
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
              <div className="relative">
                <div className="bg-white rounded-full p-1 shadow-lg">
                  <img
                    src={adminProfileImage || "https://via.placeholder.com/120"}
                    alt="Admin Profile"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
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
                <h1 className="text-xl font-bold text-gray-900">{adminUser?.name || 'Admin'}</h1>
                <p className="text-gray-600 text-sm">{adminUser?.email || 'admin@emexa.edu'}</p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900">User Management Dashboard</h1>
              <p className="text-gray-600 mt-3 text-lg">Manage all users, approvals, and system access</p>
            </div>

            <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200">
              <div className="flex gap-10 px-8 pt-5">
                <button onClick={() => setTab("users")} className={`pb-4 text-base font-medium border-b-3 transition-all ${tab === "users" ? "text-emerald-600 border-emerald-600" : "text-gray-500 border-transparent hover:text-gray-700"}`}>
                  All Users
                </button>
                <button onClick={() => setTab("teacher-approvals")} className={`pb-4 text-base font-medium relative ${tab === "teacher-approvals" ? "text-emerald-600 border-b-3 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>
                  Teacher Approvals
                  {pendingTeacherApprovals > 0 && <span className="ml-2 px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">{pendingTeacherApprovals}</span>}
                </button>
                <button onClick={() => setTab("student-approvals")} className={`pb-4 text-base font-medium relative ${tab === "student-approvals" ? "text-emerald-600 border-b-3 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>
                  Student Approvals
                  {pendingStudentApprovals > 0 && <span className="ml-2 px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">{pendingStudentApprovals}</span>}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0">
              {tab === "users" && (
                <>
                  <div className="p-8 border-b border-gray-200 flex items-center gap-6">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-96 text-base"
                    />
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                        className="px-8 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-between min-w-56 text-base font-medium text-gray-700 shadow-sm"
                      >
                        {selectedRole}
                        <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showRoleDropdown && (
                        <div className="absolute top-full mt-2 w-full min-w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                          {roles.map(role => (
                            <button
                              key={role}
                              onClick={() => { setSelectedRole(role); setShowRoleDropdown(false); }}
                              className="w-full px-6 py-4 text-left hover:bg-emerald-50 flex items-center justify-between text-base font-medium transition"
                            >
                              <span>{role}</span>
                              {selectedRole === role && (
                                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Role</th>
                          <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Date Added</th>
                          <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-32 text-gray-500 text-lg font-medium">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50 transition">
                              <td className="px-8 py-5 text-base font-medium text-gray-900">{u.name}</td>
                              <td className="px-8 py-5 text-base text-gray-600">{u.email}</td>
                              <td className="px-8 py-5"><RoleTag role={u.role} /></td>
                              <td className="px-8 py-5"><StatusTag status={u.status} /></td>
                              <td className="px-8 py-5 text-base text-gray-600">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                              </td>
                              <td className="px-8 py-5 text-base">
                                <button onClick={() => handleViewUser(u)} className="text-emerald-600 hover:text-emerald-800 font-semibold mr-6">View</button>
                                <button onClick={() => openModal("delete", u)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Teacher approvals tab */}
              {tab === "teacher-approvals" && (
                <div className="p-10">
                  <ApprovalTab 
                    approvals={teacherApprovals} 
                    title="Teacher Approval Requests" 
                    onApprove={handleApproveTeacher} 
                    onReject={handleRejectTeacher} 
                  />
                </div>
              )}

              {/* Student approvals tab */}
              {tab === "student-approvals" && (
                <div className="p-10">
                  <ApprovalTab 
                    approvals={studentApprovals} 
                    title="Student Approval Requests" 
                    onApprove={handleApproveStudent} 
                    onReject={handleRejectStudent} 
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {modalOpen && modalType === "delete" && (
  <DeleteUserModal 
    user={selectedUser} 
    onSubmit={() => handleDeleteUser(selectedUser._id)} 
    onCancel={closeModal} 
  />
)}
    </div>
  );
};

// FIXED: Sort approvals to show pending first, approved in middle, rejected last
const ApprovalTab = ({ approvals = [], title, onApprove, onReject }) => {
  // Sort approvals: pending -> approved -> rejected
  const sortedApprovals = [...approvals].sort((a, b) => {
    const order = { 'pending': 1, 'approved': 2, 'rejected': 3 };
    const statusA = a.approvalStatus || 'pending';
    const statusB = b.approvalStatus || 'pending';
    return order[statusA] - order[statusB];
  });

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4 text-gray-900">{title}</h2>
      <p className="text-gray-600 mb-10 text-lg">Review and manage pending registration requests</p>
      {sortedApprovals.length === 0 ? (
        <div className="text-center py-32 text-gray-500 border-2 border-dashed border-gray-300 rounded-2xl text-xl font-medium">
          No pending requests
        </div>
      ) : (
        <div className="space-y-8">
          {sortedApprovals.map(ap => (
            <div key={ap._id} className="border rounded-2xl p-8 hover:shadow-xl transition bg-gradient-to-r from-emerald-50/50 to-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-2xl text-gray-900">{ap.name}</h3>
                  <p className="text-gray-700 mt-2 text-lg">{ap.email}</p>
                  <p className="text-gray-500 mt-3">Requested: {ap.createdAt ? new Date(ap.createdAt).toLocaleDateString() : "N/A"}</p>
                  <p className="text-gray-600 mt-2">
                    {ap.year ? `${ap.year}` : 'Year: N/A'}{ap.semester ? ` • ${ap.semester}` : ' • Semester: N/A'}
                  </p>
                  {ap.qualifications && <p className="mt-6 text-gray-800 text-base"><strong className="font-bold">Qualifications:</strong> {ap.qualifications}</p>}
                  <div className="mt-4">
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      ap.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      ap.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Status: {ap.approvalStatus || 'pending'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  {ap.approvalStatus === 'pending' || !ap.approvalStatus ? (
                    <>
                      <button onClick={() => onApprove(ap._id)} className="px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-lg shadow-md">Approve</button>
                      <button onClick={() => onReject(ap._id)} className="px-8 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-bold text-lg">Reject</button>
                    </>
                  ) : ap.approvalStatus === 'approved' ? (
                    <span className="px-8 py-4 bg-green-100 text-green-700 rounded-xl font-bold text-xl">Approved</span>
                  ) : (
                    <span className="px-8 py-4 bg-red-100 text-red-700 rounded-xl font-bold text-xl">Rejected</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DeleteUserModal = ({ user, onSubmit, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
    <div className="bg-white rounded-lg max-w-sm w-full text-center shadow-xl overflow-hidden">
      {/* Teal Background Header (matches your logout modal) */}
      <div className="bg-teal-0 px-3 py-6">
        {/* Checkmark Circle Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
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
      </div>

      {/* White Content Area */}
      <div className="p-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h2>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-6">
          Do you want to permanently delete <strong className="font-semibold">{user?.name}</strong>?
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
           <button
          onClick={onCancel}
          className="px-9 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-bold text-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-xl transition-colors"
        >
          Delete User
        </button>
        </div>
      </div>
    </div>
  </div>
);


export default UserManagement;