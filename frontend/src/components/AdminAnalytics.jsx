// frontend/src/components/AdminAnalytics.jsx
// FIXED VERSION - With Header, Sidebar, and filtered emotions

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import Header from '../components/headerorigin.jsx';
import Sidebar from '../components/sidebarorigin.jsx';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  // Admin menu items (same as usermgt.jsx)
  const adminMenuItems = [
    {
      id: "userManagement",
      label: "User Management",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>,
      onClick: () => navigate('/admin/user-management'),
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      onClick: () => navigate('/admin/analytics'),
    },
    {
      id: "customAnalytics",
      label: "Custom Analysis",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>,
      onClick: () => navigate('/admin/custom-analytics'),
    },
    {
      id: "studentPreview",
      label: "Student Dashboard",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0H5" />
      </svg>,
      onClick: () => {
        localStorage.setItem("adminViewingAs", "student");
        window.location.href = "/dashboard";
      },
    },
    {
      id: "teacherPreview",
      label: "Teacher Dashboard",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
      </svg>,
      onClick: () => {
        localStorage.setItem("adminViewingAs", "teacher");
        window.location.href = "/teacher-dashboard";
      },
    },
  ];

  useEffect(() => {
    const admin = localStorage.getItem("adminUser");
    if (admin) setAdminUser(JSON.parse(admin));
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('/api/analytics/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userName={adminUser?.name || "Admin"} userRole="admin" />
        <div className="flex">
          <Sidebar activeMenuItem="analytics" menuItems={adminMenuItems} />
          <main className="flex-1 ml-64 pt-20 px-8">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-xl text-gray-600">Loading analytics...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userName={adminUser?.name || "Admin"} userRole="admin" />
        <div className="flex">
          <Sidebar activeMenuItem="analytics" menuItems={adminMenuItems} />
          <main className="flex-1 ml-64 pt-20 px-8">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-xl text-red-600">Failed to load analytics</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ⭐ FILTER OUT "fear" and "surprise" emotions
  const allowedEmotions = ['happy', 'sad', 'angry', 'neutral', 'anxious', 'stressed', 'frustrated', 'calm', 'confused'];
  const filteredEmotions = Object.entries(analytics.emotions)
    .filter(([emotion]) => allowedEmotions.includes(emotion.toLowerCase()))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});

  // Format data for charts
  const genderData = Object.entries(analytics.demographics.byGender).map(([name, value]) => ({ name, value }));
  const yearData = Object.entries(analytics.demographics.byYear).map(([name, value]) => ({ name: name.replace(' year', 'Y'), value }));
  const emotionData = Object.entries(filteredEmotions).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ⭐ ADD HEADER */}
      <Header userName={adminUser?.name || "Admin"} userRole="admin" />

      <div className="flex">
        {/* ⭐ ADD SIDEBAR */}
        <Sidebar activeMenuItem="analytics" menuItems={adminMenuItems} />

        {/* ⭐ MAIN CONTENT WITH PROPER MARGIN */}
        <main className="flex-1 ml-64 pt-20 px-8">
          <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Analytics Dashboard</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Students" value={analytics.overview.totalStudents} icon="👨‍🎓" color="blue" />
              <StatCard title="Total Teachers" value={analytics.overview.totalTeachers} icon="👩‍🏫" color="green" />
              <StatCard title="Total Quizzes" value={analytics.overview.totalQuizzes} icon="📝" color="purple" />
              <StatCard title="Quiz Attempts" value={analytics.overview.totalAttempts} icon="✍️" color="orange" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gender Distribution */}
              <ChartCard title="Student Gender Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Academic Year Distribution */}
              <ChartCard title="Students by Academic Year">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Emotion Distribution */}
              <ChartCard title="Overall Emotion Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={emotionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Platform Engagement */}
              <ChartCard title="Platform Engagement">
                <div className="space-y-4 pt-4">
                  <EngagementStat label="Total Quizzes Created" value={analytics.overview.totalQuizzes} />
                  <EngagementStat label="Total Quiz Attempts" value={analytics.overview.totalAttempts} />
                  <EngagementStat label="Active Students" value={analytics.overview.totalStudents} />
                  <EngagementStat label="Active Teachers" value={analytics.overview.totalTeachers} />
                </div>
              </ChartCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    purple: 'from-purple-400 to-purple-600',
    orange: 'from-orange-400 to-orange-600'
  };

  return (
    <div className={`bg-gradient-to-r ${colors[color]} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-5xl opacity-50">{icon}</div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const EngagementStat = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-2xl font-bold text-gray-900">{value}</span>
  </div>
);

export default AdminAnalytics;