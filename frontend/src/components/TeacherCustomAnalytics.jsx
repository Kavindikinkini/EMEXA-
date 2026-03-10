import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminViewWrapper from '../components/AdminViewWrapper';
import Header from '../components/headerorigin';
import Sidebar from '../components/sidebarorigin';

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const TeacherCustomAnalytics = ({ setActiveMenuItem: setParentMenuItem }) => {
  const navigate = useNavigate();
  
  const adminToken = localStorage.getItem("adminToken");
  const isAdminViewing = localStorage.getItem("adminViewingAs");
  
  const [activeMenuItem, setActiveMenuItem] = useState("customAnalytics");
  const [userName, setUserName] = useState("");
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [classAnalytics, setClassAnalytics] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [activeTab, setActiveTab] = useState('individual');

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchClassAnalytics();
  }, []);

  const teacherMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      onClick: () => {
        if (setParentMenuItem) setParentMenuItem("dashboard");
        else navigate("/teacher-dashboard");
      }
    },
    {
      id: "quizzes",
      label: "Quiz",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => {
        setActiveMenuItem("quizzes");
        navigate("/teacher-dashboard", { state: { activeMenu: "quizzes" } });
      }
    },
    {
      id: "customAnalytics",
      label: "Custom Analysis",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      onClick: () => {
        setActiveMenuItem("customAnalytics");
        navigate("/teacher/custom-analytics");
      }
    },
    {
      id: "heatmap",
      label: "Emotion Heatmap",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      onClick: () => {
        if (setParentMenuItem) setParentMenuItem("heatmap");
        else navigate("/teacher-dashboard", { state: { activeMenu: "heatmap" } });
      }
    },
    {
      id: "difficulty",
      label: "Difficulty Analysis",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      onClick: () => navigate("/teacher/difficulty-analysis"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => {
        navigate("/teacher-profile");
      }
    },
  ];

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/teacher-analytics/my-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchClassAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/teacher-analytics/class-analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching class analytics:', error);
    }
  };

  const analyzePatterns = async () => {
    if (!studentId) {
      alert('Please select a student');
      return;
    }
    
    setLoading(true);
    setPatterns(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_BASE}/api/teacher-analytics/student-patterns/${studentId}?days=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatterns(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error analyzing patterns');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCorrelation = async () => {
    if (!studentId) {
      alert('Please select a student');
      return;
    }

    setLoading(true);
    setCorrelation(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_BASE}/api/teacher-analytics/student-correlation/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCorrelation(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error analyzing correlation');
    } finally {
      setLoading(false);
    }
  };

  const CustomAnalyticsContent = () => (
    <div className="min-h-screen bg-white">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Admin Banner */}
        {isAdminViewing === "teacher" && adminToken && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-amber-900">Admin View Mode</p>
                  <p className="text-sm text-amber-700">Viewing teacher's custom analytics dashboard</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("adminViewingAs");
                  localStorage.removeItem("adminViewingUser");
                  window.location.href = "/admin/user-management";
                }}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-md font-medium"
              >
                ← Back to Management
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Custom Analysis
          </h1>
          <p className="text-gray-500 text-base">
            Analyze your students' emotional patterns using{' '}
            <span className="font-semibold text-emerald-600">proprietary EMEXA algorithms</span>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex-1 px-8 py-4 font-semibold transition-all relative ${
                activeTab === 'individual'
                  ? 'text-emerald-700 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Individual Analysis
              </div>
              {activeTab === 'individual' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('class')}
              className={`flex-1 px-8 py-4 font-semibold transition-all relative ${
                activeTab === 'class'
                  ? 'text-emerald-700 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Class-Wide Analytics
              </div>
              {activeTab === 'class' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
              )}
            </button>
          </div>
        </div>

        {/* Individual Tab */}
        {activeTab === 'individual' && (
          <div className="space-y-6">
            {/* Student Selection Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Select Student for Analysis</h3>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loadingStudents}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 disabled:opacity-50 text-base font-medium transition-all"
                  >
                    <option value="">
                      {loadingStudents ? '⏳ Loading students...' : 
                       students.length === 0 ? '❌ No students found' : 
                       '👥 Choose a student...'}
                    </option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name} • {student.studentId || student._id.slice(-6)} • {student.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={analyzePatterns}
                  disabled={!studentId || loading || loadingStudents}
                  className="px-7 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
                >
                  {loading ? '🔄 Analyzing...' : '🔍 Detect Patterns'}
                </button>
                <button
                  onClick={analyzeCorrelation}
                  disabled={!studentId || loading || loadingStudents}
                  className="px-7 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
                >
                  📊 Correlation
                </button>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>
                  <span className="font-semibold text-gray-700">Tip:</span> Select a student who has taken your quizzes to analyze their emotion patterns
                </p>
              </div>
              
              {!loadingStudents && students.length === 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-100 p-2 rounded-lg flex-shrink-0">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-yellow-900 mb-1">No Students Found</p>
                      <p className="text-yellow-800 text-sm">Students will appear here once they take your quizzes. Create and publish a quiz to get started!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pattern Results */}
            {patterns && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Emotion Pattern Detection</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Algorithm: {patterns.algorithm}</p>
                  </div>
                </div>
                
                {patterns.stressScore && (
                  <div className={`p-6 rounded-2xl mb-8 border ${
                    patterns.stressScore.level === 'Low' ? 'bg-green-50 border-green-200' :
                    patterns.stressScore.level === 'Moderate' ? 'bg-yellow-50 border-yellow-200' :
                    patterns.stressScore.level === 'High' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Stress Score</h3>
                        <p className="text-sm text-gray-500 mb-2">{patterns.stressScore.algorithm}</p>
                        <p className="text-sm font-semibold text-gray-700">Level: <span className="text-base">{patterns.stressScore.level}</span></p>
                      </div>
                      <div className="text-center">
                        <div className="text-5xl font-black text-gray-900 mb-1">
                          {patterns.stressScore.score}
                        </div>
                        <div className="text-base font-bold text-gray-500">/100</div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white/80 rounded-xl">
                      <p className="text-sm font-medium text-gray-700">{patterns.stressScore.recommendation}</p>
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900 mb-4">Detected Emotion Sequences</h3>
                <div className="space-y-3 mb-8">
                  {patterns.patterns?.sequences?.length > 0 ? (
                    patterns.patterns.sequences.map((seq, idx) => (
                      <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-base font-semibold text-gray-900">{seq.pattern}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-emerald-600">{seq.frequency}</span>
                            <span className="text-sm text-gray-400">frequency</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Occurred <span className="font-semibold">{seq.occurrences}</span> times</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 italic">
                      No significant patterns detected yet. Student needs more quiz activity.
                    </div>
                  )}
                </div>

                {patterns.recommendations && patterns.recommendations.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Teaching Recommendations</h3>
                    <div className="space-y-3">
                      {patterns.recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-xl">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{rec.title}</h4>
                              <p className="text-gray-600 text-sm">{rec.suggestion}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                              rec.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                              rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Correlation Results */}
            {correlation && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Performance-Emotion Correlation</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Algorithm: {correlation.algorithm}</p>
                  </div>
                </div>
                
                {correlation.dataPoints >= 3 ? (
                  <>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                        <p className="text-sm font-medium text-gray-500 mb-2">Correlation Coefficient</p>
                        <p className="text-4xl font-black text-blue-600">
                          {correlation.correlation.coefficient}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
                        <p className="text-sm font-medium text-gray-500 mb-2">Strength</p>
                        <p className="text-2xl font-black text-purple-600">{correlation.correlation.strength}</p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                        <p className="text-sm font-medium text-gray-500 mb-2">Data Points</p>
                        <p className="text-4xl font-black text-emerald-600">{correlation.dataPoints}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-2">Interpretation</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{correlation.correlation.interpretation}</p>
                    </div>

                    {correlation.insights && correlation.insights.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h4 className="font-bold text-gray-900 mb-3">Teaching Insights</h4>
                        {correlation.insights.map((insight, idx) => (
                          <div key={idx} className="bg-green-50 p-5 rounded-xl border border-green-100">
                            <p className="font-semibold text-gray-900 mb-1 text-sm">{insight.finding}</p>
                            <p className="text-gray-600 text-sm flex items-center gap-2">
                              <span className="text-emerald-600 font-bold">→</span>
                              {insight.action}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-2xl text-center">
                    <div className="bg-yellow-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="font-bold text-lg text-yellow-900 mb-2">Insufficient Data</p>
                    <p className="text-yellow-800 text-sm">
                      This student needs at least 3 quiz attempts with emotion data to perform correlation analysis.
                      <br />
                      Current attempts: <span className="font-bold">{correlation.dataPoints}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Class Analytics Tab */}
        {activeTab === 'class' && classAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Students', value: classAnalytics.classStats.totalStudents, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Total Quizzes', value: classAnalytics.classStats.totalQuizzes, icon: '📝', color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Total Attempts', value: classAnalytics.classStats.totalAttempts, icon: '✍️', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Average Score', value: `${classAnalytics.classStats.averageScore}%`, icon: '⭐', color: 'text-emerald-600', bg: 'bg-emerald-50' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className={`${stat.bg} w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4`}>
                    {stat.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Class Emotion Distribution</h2>
              <div className="space-y-4">
                {Object.entries(classAnalytics.emotionDistribution).map(([emotion, count]) => {
                  const total = Object.values(classAnalytics.emotionDistribution).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={emotion}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="capitalize font-semibold text-gray-700 text-sm">{emotion}</span>
                        <span className="font-bold text-emerald-600 text-sm">{percentage}%</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Quiz Attempts</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-l-lg">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hints Used</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-r-lg">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classAnalytics.recentAttempts.map((attempt, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 text-sm">{attempt.studentName}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-sm">
                            {attempt.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{attempt.hintsUsed}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(attempt.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ FIX: Removed jsx prop from style tag (caused React warning) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );

  if (isAdminViewing && adminToken) {
    return (
      <AdminViewWrapper dashboardType="teacher">
        <CustomAnalyticsContent />
      </AdminViewWrapper>
    );
  }

  if (setParentMenuItem) {
    return <CustomAnalyticsContent />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header userName={userName} userRole="teacher" />
      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        menuItems={teacherMenuItems}
      />
      <div className="ml-64 pt-20">
        <CustomAnalyticsContent />
      </div>
    </div>
  );
};

export default TeacherCustomAnalytics;