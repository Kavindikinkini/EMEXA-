// frontend/src/components/CustomAnalytics.jsx
// FIXED VERSION - Properly fetches students from correct endpoint

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/headerorigin.jsx';
import Sidebar from '../components/sidebarorigin.jsx';

const CustomAnalytics = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  // Admin menu items
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
    fetchStudents();
  }, []);

  // ⭐ FIXED: Fetch students from correct endpoint with proper error handling
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      console.log('🔍 Fetching students for dropdown...');
      
      // Try multiple endpoints to find students
      let studentList = [];
      
      // Method 1: Try /api/users endpoint (your getUsers service)
      try {
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Students fetched from /api/users:', res.data);
        // Filter only students
        studentList = res.data.filter(u => u.role?.toLowerCase() === 'student');
      } catch (err) {
        console.warn('Method 1 failed, trying method 2...');
        
        // Method 2: Try direct students endpoint
        try {
          const res = await axios.get('http://localhost:5000/api/students', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Students fetched from /api/students:', res.data);
          studentList = res.data;
        } catch (err2) {
          console.error('Both methods failed:', err2);
        }
      }
      
      console.log(`📊 Total students found: ${studentList.length}`);
      
      if (studentList.length === 0) {
        console.warn('⚠️ No students found in database!');
      }
      
      setStudents(studentList);
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      alert('Failed to load students. Please check console for details.');
    } finally {
      setLoadingStudents(false);
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
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/analytics/custom/emotion-patterns?studentId=${studentId}&days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatterns(res.data);
    } catch (error) {
      console.error('Pattern analysis error:', error);
      alert('Error analyzing patterns. This student may not have enough emotion data yet.');
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
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/analytics/custom/correlation?studentId=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCorrelation(res.data);
    } catch (error) {
      console.error('Correlation analysis error:', error);
      alert('Error analyzing correlation. This student may not have taken any quizzes yet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={adminUser?.name || "Admin"} userRole="admin" />

      <div className="flex">
        <Sidebar activeMenuItem="customAnalytics" menuItems={adminMenuItems} />

        <main className="flex-1 ml-64 pt-20 px-8">
          <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">🔬 Custom Emotion Analysis</h1>
            <p className="text-gray-600 mb-8">Using proprietary EMEXA algorithms (not external libraries)</p>

            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <label className="text-sm font-semibold text-gray-800">
                  Select Student for Analysis
                </label>
                <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {students.length} students available
                </span>
              </div>
              
              {/* Student Dropdown */}
              <div className="flex gap-4">
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={loadingStudents}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 disabled:opacity-50 text-sm font-medium bg-white shadow-sm transition-all"
                >
                  <option value="">
                    {loadingStudents ? '⏳ Loading students...' :
                     students.length === 0 ? 'No students found' :
                     '👤 Search and select a student...'}
                  </option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name}  |  ID: {student.studentId || student._id.slice(-6).toUpperCase()}  |  {student.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={analyzePatterns}
                  disabled={!studentId || loading || loadingStudents}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'Detect Patterns'}
                </button>
                <button
                  onClick={analyzeCorrelation}
                  disabled={!studentId || loading || loadingStudents}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze Correlation
                </button>
              </div>
              
              {/* Helper text */}
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Select a student from the dropdown to analyze their emotion patterns and performance correlation
              </p>
              
              {/* Debug info */}
              {!loadingStudents && students.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">⚠️ No students found in database</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please ensure students have registered and been approved by admin. 
                    Check the "User Management" page to see if any students exist.
                  </p>
                </div>
              )}
              
              {loadingStudents && (
                <div className="mt-4 flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Loading students...</span>
                </div>
              )}
            </div>

            {/* Pattern Results */}
            {patterns && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">🔍 Emotion Pattern Detection</h2>
                <p className="text-sm text-gray-600 mb-4">Algorithm: {patterns.algorithm}</p>
                
                {/* Stress Score */}
                {patterns.stressScore && (
                  <div className={`p-4 rounded-lg mb-6 ${
                    patterns.stressScore.level === 'Low' ? 'bg-green-50 border border-green-200' :
                    patterns.stressScore.level === 'Moderate' ? 'bg-yellow-50 border border-yellow-200' :
                    patterns.stressScore.level === 'High' ? 'bg-orange-50 border border-orange-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">Stress Score</h3>
                        <p className="text-sm text-gray-600">{patterns.stressScore.algorithm}</p>
                      </div>
                      <div className="text-4xl font-bold">{patterns.stressScore.score}/100</div>
                    </div>
                    <p className="mt-2 font-medium">Level: {patterns.stressScore.level}</p>
                    <p className="mt-1 text-sm">{patterns.stressScore.recommendation}</p>
                  </div>
                )}

                {/* Detected Patterns */}
                <h3 className="font-bold text-lg mb-3">Detected Emotion Sequences:</h3>
                {patterns.patterns?.sequences?.length > 0 ? (
                  patterns.patterns.sequences.map((seq, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg mb-2">
                      <div className="flex justify-between">
                        <span className="font-mono">{seq.pattern}</span>
                        <span className="text-blue-600 font-bold">{seq.frequency}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Occurred {seq.occurrences} times</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No significant patterns detected yet. Student needs more quiz activity with emotion data.</p>
                )}

                {/* Recommendations */}
                {patterns.recommendations && patterns.recommendations.length > 0 && (
                  <>
                    <h3 className="font-bold text-lg mt-6 mb-3">Personalized Recommendations:</h3>
                    {patterns.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold">{rec.title}</h4>
                            <p className="text-sm mt-1">{rec.suggestion}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-bold ${
                            rec.priority === 'Critical' ? 'bg-red-200 text-red-800' :
                            rec.priority === 'High' ? 'bg-orange-200 text-orange-800' :
                            rec.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Correlation Results */}
            {correlation && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">📊 Performance-Emotion Correlation</h2>
                <p className="text-sm text-gray-600 mb-4">Algorithm: {correlation.algorithm}</p>
                
                {correlation.dataPoints >= 3 ? (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Correlation Coefficient</p>
                        <p className="text-3xl font-bold text-blue-600">{correlation.correlation.coefficient}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Strength</p>
                        <p className="text-2xl font-bold">{correlation.correlation.strength}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Data Points</p>
                        <p className="text-2xl font-bold">{correlation.dataPoints}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">Interpretation:</h4>
                      <p>{correlation.correlation.interpretation}</p>
                    </div>

                    {correlation.insights && correlation.insights.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-bold mb-2">Insights:</h4>
                        {correlation.insights.map((insight, idx) => (
                          <div key={idx} className="bg-green-50 p-3 rounded mb-2">
                            <p className="font-medium">{insight.finding}</p>
                            <p className="text-sm text-gray-600 mt-1">→ {insight.action}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="font-medium text-yellow-800">Insufficient data for correlation analysis</p>
                    <p className="text-sm text-yellow-700 mt-2">
                      This student needs at least 3 quiz attempts with emotion data to perform correlation analysis.
                      Current data points: {correlation.dataPoints}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomAnalytics;