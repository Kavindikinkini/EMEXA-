// frontend/src/pages/JournalPage.jsx
// Full self-reflection journal page accessible from sidebar

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/sidebarorigin';
import Header from '../components/headerorigin';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const emotionEmoji = {
  happy: '😊', sad: '😢', angry: '😠',
  confused: '😕', neutral: '😐', surprised: '😲', fear: '😨'
};

const emotionLabel = {
  happy: 'Happy', sad: 'Sad', angry: 'Frustrated',
  confused: 'Confused', neutral: 'Neutral', surprised: 'Surprised', fear: 'Anxious'
};

// ─── Awareness Score Ring ─────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 120 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'High' : score >= 40 ? 'Developing' : 'Needs Work';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round" />
      </svg>
      <div className="text-center -mt-[${size/2 + 12}px]" style={{ marginTop: -(size / 2 + 12) }}>
        <p className="text-3xl font-black" style={{ color }}>{score}</p>
        <p className="text-xs font-semibold" style={{ color }}>{label}</p>
      </div>
    </div>
  );
};

// ─── Single Journal Entry Card ────────────────────────────────────────────────
const JournalEntry = ({ r }) => {
  const [expanded, setExpanded] = useState(false);
  const gapColor = r.metacognitiveGapScore < 30 ? 'bg-emerald-400' : r.metacognitiveGapScore < 60 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${r.emotionMatch ? 'border-emerald-200' : 'border-gray-200'}`}>
      {/* Card Header */}
      <div className={`p-5 ${r.emotionMatch ? 'bg-emerald-50/40' : 'bg-white'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="font-bold text-gray-900">{r.quizTitle || 'Quiz'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${r.emotionMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {r.emotionMatch ? '✓ Match' : '≠ Gap'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${r.actualScore >= 70 ? 'bg-green-100 text-green-700' : r.actualScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {Math.round(r.actualScore)}%
            </span>
          </div>
        </div>

        {/* Emotion Comparison */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">{emotionEmoji[r.selfReportedEmotion] || '😐'}</span>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">You felt</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{emotionLabel[r.selfReportedEmotion] || r.selfReportedEmotion}</p>
            </div>
          </div>

          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${r.emotionMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
            {r.emotionMatch ? '=' : '≠'}
          </div>

          <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">{emotionEmoji[r.aiDetectedEmotion] || '😐'}</span>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">AI detected</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{emotionLabel[r.aiDetectedEmotion] || r.aiDetectedEmotion}</p>
            </div>
          </div>
        </div>

        {/* Ratings row */}
        <div className="flex gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Confidence:</span>
            {[1,2,3,4,5].map(i => (
              <span key={i} className={i <= r.confidenceRating ? 'text-emerald-500' : 'text-gray-200'}>●</span>
            ))}
          </span>
          <span className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Difficulty:</span>
            {[1,2,3,4,5].map(i => (
              <span key={i} className={i <= r.difficultyRating ? 'text-orange-400' : 'text-gray-200'}>●</span>
            ))}
          </span>
        </div>

        {/* Gap bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-28 shrink-0">Metacognitive Gap</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full ${gapColor}`} style={{ width: `${r.metacognitiveGapScore}%` }} />
          </div>
          <span className="text-xs font-bold text-gray-600 w-10 text-right">{r.metacognitiveGapScore}/100</span>
        </div>
      </div>

      {/* Expandable note */}
      {r.journalNote && (
        <div className="border-t border-gray-100">
          <button onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <span className="flex items-center gap-2">
              <span>📝</span> Journal Note
            </span>
            <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {expanded && (
            <div className="px-5 pb-4">
              <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                "{r.journalNote}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Journal Page ────────────────────────────────────────────────────────
const JournalPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('journal');
  const userName = localStorage.getItem('userName') || 'Student';

  useEffect(() => { fetchJournal(); }, []);

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/reflections/my-journal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Journal fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const studentMenuItems = [
    {
      id: 'dashboard', label: 'Dashboard',
      icon: <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'wellness', label: 'Wellness Centre',
      icon: <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
      onClick: () => navigate('/wellness-centre'),
    },
    {
      id: 'gamification', label: 'My Progress',
      icon: <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      onClick: () => navigate('/gamification'),
    },
    {
      id: 'journal', label: 'My Journal',
      icon: <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      onClick: () => navigate('/journal'),
    },
    {
      id: 'profile', label: 'Profile',
      icon: <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      onClick: () => navigate('/profile'),
    },
  ];

  const stats = data?.stats;
  const reflections = data?.reflections || [];

  return (
    <div className="min-h-screen bg-white">
      <Header userName={userName} userRole="student" />
      <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} menuItems={studentMenuItems} />

      <div className="ml-52 pt-14">
        <div className="p-6 max-w-5xl">

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-3xl">📖</span> My Self-Reflection Journal
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track how your feelings compare to what AI detects — and grow your metacognitive awareness.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-4 mb-6 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
            </div>
          ) : !stats || reflections.length === 0 ? (
            /* Empty State */
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📓</div>
              <h2 className="text-xl font-bold text-teal-900 mb-2">No Journal Entries Yet</h2>
              <p className="text-teal-700 text-sm max-w-sm mx-auto">
                After you complete a quiz, you'll be prompted to reflect on how you felt.
                Your entries will appear here with AI-powered insights.
              </p>
              <button onClick={() => navigate('/dashboard')}
                className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all">
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Awareness Score Ring */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">Metacognitive Awareness</p>
                  <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
                    <svg width={100} height={100} className="-rotate-90 absolute">
                      <circle cx={50} cy={50} r={40} fill="none" stroke="#e5e7eb" strokeWidth={8} />
                      <circle cx={50} cy={50} r={40} fill="none"
                        stroke={stats.awarenessScore >= 70 ? '#10b981' : stats.awarenessScore >= 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth={8}
                        strokeDasharray={`${(stats.awarenessScore / 100) * 251.3} 251.3`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="text-center z-10">
                      <p className={`text-2xl font-black ${stats.awarenessScore >= 70 ? 'text-emerald-600' : stats.awarenessScore >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {stats.awarenessScore}
                      </p>
                      <p className={`text-[9px] font-bold uppercase ${stats.awarenessScore >= 70 ? 'text-emerald-500' : stats.awarenessScore >= 40 ? 'text-yellow-500' : 'text-red-400'}`}>
                        {stats.awarenessScore >= 70 ? 'High' : stats.awarenessScore >= 40 ? 'Growing' : 'Needs Work'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Total Entries</p>
                  <p className="text-4xl font-black text-blue-600">{stats.totalEntries}</p>
                  <p className="text-xs text-blue-400 mt-1">reflections logged</p>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Emotion Match Rate</p>
                  <p className="text-4xl font-black text-purple-600">{stats.emotionMatchRate}%</p>
                  <p className="text-xs text-purple-400 mt-1">self vs AI aligned</p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Avg Confidence</p>
                  <p className="text-4xl font-black text-amber-600">{stats.avgConfidence}<span className="text-lg text-amber-400">/5</span></p>
                  <p className="text-xs text-amber-400 mt-1">self-reported</p>
                </div>
              </div>

              {/* What is metacognitive awareness? */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0">🧠</span>
                  <div>
                    <p className="font-bold text-indigo-900 mb-1">What is Metacognitive Awareness?</p>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      It's how accurately you understand your own emotions and confidence while learning.
                      A higher score means your self-perception aligns closely with what AI detects —
                      a key skill for self-regulated learning. Gaps are not failures; they're opportunities to grow.
                    </p>
                  </div>
                </div>
              </div>

              {/* Entries Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-lg">
                  Journal Entries <span className="text-gray-400 font-normal text-sm">({reflections.length})</span>
                </h2>
                <button onClick={fetchJournal}
                  className="text-sm text-teal-600 border border-teal-200 px-4 py-2 rounded-xl hover:bg-teal-50 font-medium transition-all">
                  ↻ Refresh
                </button>
              </div>

              {/* Entries list */}
              <div className="space-y-4">
                {reflections.map(r => <JournalEntry key={r._id} r={r} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalPage;