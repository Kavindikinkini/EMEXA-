import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminViewWrapper from "../components/AdminViewWrapper";
import Header from "../components/headerorigin";
import Sidebar from "../components/sidebarorigin";
import TeacherCreateQuiz from "./TeacherCreateQuiz";

const TeacherCreateQuizWrapper = () => {
  const navigate = useNavigate();
  
  const adminToken = localStorage.getItem("adminToken");
  const isAdminViewing = localStorage.getItem("adminViewingAs");
  
  const [activeMenuItem, setActiveMenuItem] = useState("quiz");
  const [userName, setUserName] = useState("");
  const [editingDraftId, setEditingDraftId] = useState(null);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

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
      }
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
        setActiveMenuItem("quiz");
        navigate("/teacher-create-quiz");
      }
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
      }
    },
  ];

  const PageLayout = ({ children }) => (
    <div className="bg-gradient-to-br from-green-50 to-white min-h-screen">
      {children}
    </div>
  );

  // For navigating back to dashboard
  const handleBackToDashboard = () => {
    navigate("/teacher-dashboard");
  };

  if (isAdminViewing && adminToken) {
    return (
      <AdminViewWrapper dashboardType="teacher">
        <PageLayout>
          <TeacherCreateQuiz
            setActiveMenuItem={(page) => {
              if (page === "dashboard") navigate("/teacher-dashboard");
              else if (page === "quiz") navigate("/teacher-create-quiz");
              else if (page === "profile") navigate("/teacher-profile");
            }}
            editingDraftId={editingDraftId}
            setEditingDraftId={setEditingDraftId}
          />
        </PageLayout>
      </AdminViewWrapper>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-white min-h-screen">
      <Header userName={userName} userRole="teacher" />
      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        menuItems={teacherMenuItems}
      />
      <div className="ml-52 pt-14">
        <TeacherCreateQuiz
          setActiveMenuItem={(page) => {
            if (page === "dashboard") navigate("/teacher-dashboard");
            else if (page === "quiz") navigate("/teacher-create-quiz");
            else if (page === "profile") navigate("/teacher-profile");
          }}
          editingDraftId={editingDraftId}
          setEditingDraftId={setEditingDraftId}
        />
      </div>
    </div>
  );
};

export default TeacherCreateQuizWrapper;