// frontend/src/components/GamificationDashboard.jsx
// 🔍 DEBUG VERSION - This version has extensive logging to find the issue
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from "../components/headerorigin";
import Sidebar from "../components/sidebarorigin";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const GamificationDashboard = () => {
  console.log('🎮 GamificationDashboard - Component mounting');
  console.log('🔧 API_BASE:', API_BASE);
  
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [], progress: {} });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('gamification');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);

  // Get student ID from localStorage
  useEffect(() => {
    console.log('🔍 Checking for student ID...');
    const userStr = localStorage.getItem('user');
    console.log('📦 User string:', userStr);
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ Parsed user:', user);
        const id = user._id || user.id;
        console.log('🆔 Student ID:', id);
        setStudentId(id);
        setUserName(user.name || user.userName || '');
      } catch (e) {
        console.error('❌ Error parsing user:', e);
        navigate('/login');
      }
    } else {
      console.log('❌ No user found, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch data when studentId is available
  useEffect(() => {
    if (studentId) {
      console.log('🚀 Student ID is set, fetching data for:', studentId);
      fetchAllData();
    } else {
      console.log('⏳ Waiting for student ID...');
    }
  }, [studentId]);

  const fetchAllData = async () => {
    console.log('📊 Starting data fetch...');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.error('❌ No token found!');
        setError('No authentication token');
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      console.log('🌐 Making API calls...');
      console.log('📍 Stats URL:', `${API_BASE}/api/gamification/stats/${studentId}`);
      console.log('📍 Achievements URL:', `${API_BASE}/api/gamification/achievements/${studentId}`);
      console.log('📍 Leaderboard URL:', `${API_BASE}/api/gamification/leaderboard?limit=10`);

      const [statsRes, achievementsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API_BASE}/api/gamification/stats/${studentId}`, { headers })
          .then(res => {
            console.log('✅ Stats response:', res.data);
            return res;
          })
          .catch(err => {
            console.error('❌ Stats error:', err.response?.status, err.response?.data || err.message);
            throw err;
          }),
        axios.get(`${API_BASE}/api/gamification/achievements/${studentId}`, { headers })
          .then(res => {
            console.log('✅ Achievements response:', res.data);
            return res;
          })
          .catch(err => {
            console.error('❌ Achievements error:', err.response?.status, err.response?.data || err.message);
            throw err;
          }),
        axios.get(`${API_BASE}/api/gamification/leaderboard?limit=10`, { headers })
          .then(res => {
            console.log('✅ Leaderboard response:', res.data);
            return res;
          })
          .catch(err => {
            console.error('❌ Leaderboard error:', err.response?.status, err.response?.data || err.message);
            throw err;
          })
      ]);

      console.log('✅ All data fetched successfully');
      setStats(statsRes.data);
      setAchievements(achievementsRes.data);
      setLeaderboard(leaderboardRes.data);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching gamification data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setError(error.response?.data?.message || error.message || 'Failed to load data');
      
      // Set default data on error
      console.log('📝 Setting default data');
      setStats({
        points: { total: 0, weekly: 0, monthly: 0 },
        level: 1,
        achievements: 0,
        streak: 0,
        recentPoints: []
      });
      setAchievements({ unlocked: [], locked: [], progress: { unlocked: 0, total: 17, percentage: 0 } });
      setLeaderboard([]);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  console.log('🔄 Render - Loading:', loading, 'StudentID:', studentId, 'Error:', error);

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userName={userName} userRole="student" />
        <Sidebar 
          activeMenuItem={activeMenuItem}
          setActiveMenuItem={setActiveMenuItem}
        />
        <div className="ml-52 pt-14">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-700 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your progress...</p>
              {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  <p className="font-semibold">Error:</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering main content');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={userName} userRole="student" />
      <Sidebar 
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
      />
      
      <div className="ml-52 pt-14 p-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
              <p className="font-semibold">⚠️ Warning:</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2">Showing default data. Check console for details.</p>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">🎮 My Progress</h1>
            <button
              onClick={() => navigate('/educational-games')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
            >
              🎯 Play Games & Earn Points
            </button>
          </div>
          
          {/* Rest of your component stays the same... */}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Points</p>
                  <p className="text-4xl font-black">{stats?.points?.total || 0}</p>
                </div>
                <div className="text-5xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Level</p>
                  <p className="text-4xl font-black">{stats?.level || 1}</p>
                </div>
                <div className="text-5xl">⭐</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Achievements</p>
                  <p className="text-4xl font-black">{stats?.achievements || 0}</p>
                </div>
                <div className="text-5xl">🏆</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Streak</p>
                  <p className="text-4xl font-black">{stats?.streak || 0}</p>
                </div>
                <div className="text-5xl">🔥</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex border-b">
              {['overview', 'achievements', 'leaderboard'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-4">Recent Points</h3>
                  {stats?.recentPoints && stats.recentPoints.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentPoints.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition">
                          <div>
                            <p className="font-semibold text-gray-800">{entry.reason}</p>
                            <p className="text-sm text-gray-600">{new Date(entry.earnedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-2xl font-bold text-green-600">+{entry.points}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="text-6xl mb-4">🎯</div>
                      <p className="text-gray-600 text-lg mb-2">No points earned yet!</p>
                      <p className="text-gray-500 mb-4">Complete quizzes or play games to start earning points</p>
                      <button
                        onClick={() => navigate('/educational-games')}
                        className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
                      >
                        Play Games Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <div>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold">Progress</h3>
                      <span className="text-lg font-semibold">{achievements.progress?.percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all"
                        style={{ width: `${achievements.progress?.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4">Unlocked ({achievements.unlocked?.length || 0})</h3>
                  {achievements.unlocked && achievements.unlocked.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {achievements.unlocked.map((achievement, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="text-5xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{achievement.title}</h4>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              <p className="text-sm font-semibold text-green-600 mt-1">+{achievement.points} points</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl mb-8">
                      <p className="text-gray-500">Complete quizzes to unlock achievements!</p>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-4 text-gray-500">Locked ({achievements.locked?.length || 0})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.locked?.map((achievement, idx) => (
                      <div key={idx} className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 opacity-60">
                        <div className="flex items-center gap-4">
                          <div className="text-5xl grayscale">🔒</div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            <p className="text-sm font-semibold text-gray-500 mt-1">+{achievement.points} points</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Top Students</h3>
                  {leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-4 p-4 rounded-xl ${
                            idx < 3
                              ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className={`text-3xl font-black ${
                            idx === 0 ? 'text-yellow-500' :
                            idx === 1 ? 'text-gray-400' :
                            idx === 2 ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            #{entry.rank}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{entry.student?.name || 'Student'}</p>
                            <p className="text-sm text-gray-600">Level {entry.level}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-green-600">{entry.totalPoints}</p>
                            <p className="text-xs text-gray-600">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="text-6xl mb-4">🏆</div>
                      <p className="text-gray-600">No leaderboard data yet</p>
                      <p className="text-gray-500 text-sm">Complete quizzes to appear on the leaderboard!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDashboard;