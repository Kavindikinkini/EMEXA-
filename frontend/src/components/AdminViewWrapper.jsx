import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './headerorigin.jsx';
import Sidebar from './sidebarorigin.jsx';

const AdminViewWrapper = ({ children, dashboardType }) => {
  const navigate = useNavigate();
  
  // CRITICAL: Get all auth tokens
  const adminToken = localStorage.getItem('adminToken');
  const isAdminViewing = localStorage.getItem('adminViewingAs');
  const regularToken = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const [activeMenuItem, setActiveMenuItem] = React.useState('');

  React.useEffect(() => {
    if (dashboardType === 'student') {
      setActiveMenuItem('studentDashboard');
    } else if (dashboardType === 'teacher') {
      setActiveMenuItem('teacherDashboard');
    } else {
      setActiveMenuItem('userManagement');
    }
  }, [dashboardType]);

  // CRITICAL FIX: If there's NO adminToken but there IS adminViewingAs, clear it!
  React.useEffect(() => {
    if (!adminToken && isAdminViewing) {
      console.log('🔧 Clearing orphaned adminViewingAs flag');
      localStorage.removeItem('adminViewingAs');
    }
  }, [adminToken, isAdminViewing]);

  const adminMenuItems = [
    {
      id: "userManagement",
      label: "User Management",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      onClick: () => {
        localStorage.removeItem('adminViewingAs');
        navigate('/admin/user-management');
      }
    },
    {
      id: "studentDashboard",
      label: "Student Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => {
        localStorage.setItem('adminViewingAs', 'student');
        navigate('/dashboard');
      }
    },
    {
      id: "teacherDashboard",
      label: "Teacher Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      onClick: () => {
        localStorage.setItem('adminViewingAs', 'teacher');
        navigate('/teacher-dashboard');
      }
    },
  ];

  // CRITICAL CHECK: Only show admin wrapper if BOTH adminToken exists AND adminViewingAs is set
  // AND the user is NOT a regular teacher/student (check userRole)
  const shouldShowAdminView = adminToken && isAdminViewing && userRole === 'admin';

  console.log('🔍 AdminViewWrapper Check:', {
    adminToken: !!adminToken,
    isAdminViewing,
    userRole,
    shouldShowAdminView
  });

  if (shouldShowAdminView) {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          userName={adminUser?.name || "Admin"} 
          userRole="admin"
        />

        <Sidebar 
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
          menuItems={adminMenuItems}
        />

        <div className="ml-52 pt-14">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminViewWrapper;
