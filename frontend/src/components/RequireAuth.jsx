import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children, allowedRoles = [] }) {
  const location = useLocation();

  // Get authentication data from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  // If no token or user, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified and user's role is not in the list
  if (allowedRoles.length > 0 && userRole) {
    // Normalize role for comparison (case-insensitive)
    const normalizedUserRole = userRole.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toLowerCase()
    );

    // Check if user's role is allowed
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // Redirect to appropriate dashboard based on user's actual role
      if (normalizedUserRole === "teacher") {
        return <Navigate to="/teacher-dashboard" replace />;
      } else if (normalizedUserRole === "student") {
        return <Navigate to="/dashboard" replace />;
      } else {
        // Unknown role, redirect to login
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
    }
  }

  // User is authenticated and has proper role (if specified)
  return children;
}
