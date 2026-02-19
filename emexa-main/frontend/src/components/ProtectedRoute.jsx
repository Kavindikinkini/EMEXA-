import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, blockWellness = false }) => {
  const adminToken = localStorage.getItem('adminToken');
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const isAdminViewing = localStorage.getItem('adminViewingAs');

  console.log('🔐 ProtectedRoute Check:', {
    hasAdminToken: !!adminToken,
    hasToken: !!token,
    userRole,
    isAdminViewing,
    allowedRoles,
    blockWellness
  });

  // Check authentication - either admin or regular user must be authenticated
  if (!token && !adminToken) {
    console.log('❌ No authentication token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // ADMIN VIEWING MODE CHECKS
  if (adminToken) {
    console.log('👑 Admin detected');
    
    // If admin is trying to access wellness centre, block it
    if (isAdminViewing && blockWellness) {
      console.log('🚫 Admin blocked from Wellness Centre');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
            <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">Admin cannot access Wellness Centre in preview mode.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    // If admin is in viewing mode (viewing as teacher or student), allow access
    if (isAdminViewing) {
      console.log(`✅ Admin viewing as ${isAdminViewing} - access granted`);
      return children;
    }

    // If admin is NOT in viewing mode but route allows admin role, grant access
    if (allowedRoles && allowedRoles.includes('admin')) {
      console.log('✅ Admin role allowed - access granted');
      return children;
    }

    // Admin trying to access route without admin role and not in viewing mode
    console.log('⚠️ Admin not in viewing mode and role not allowed, redirecting to user management');
    return <Navigate to="/admin/user-management" replace />;
  }

  // REGULAR USER CHECKS (non-admin)
  if (allowedRoles && token && !allowedRoles.includes(userRole)) {
    console.log(`❌ User role "${userRole}" not in allowed roles [${allowedRoles.join(', ')}]`);
    
    // Redirect to appropriate dashboard based on user's actual role
    if (userRole === 'teacher') {
      return <Navigate to="/teacher-dashboard" replace />;
    } else if (userRole === 'student') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  console.log('✅ Access granted');
  return children;
};

export default ProtectedRoute;