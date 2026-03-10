// frontend/src/pages/JournalPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/sidebarorigin';
import Header from '../components/headerorigin';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

// ── Matches model enum values ─────────────────────────────────────
const EMOTION_EMOJI = {
  happy:'😊', confident:'💪', neutral:'😐', confused:'😕',
  anxious:'😰', frustrated:'😤', sad:'😢', angry:'😠', fear:'😨'
};

// ── emotionGap values from model: aligned | underestimated | overestimated | mismatched
const GAP_CONFIG = {
  aligned:        { label:'✅ Aligned',        color:'text-emerald-700', bg:'bg-emerald-50',  border:'border-emerald-200' },
  underestimated: { label:'🔍 Underestimated', color:'text-blue-700',    bg:'bg-blue-50',     border:'border-blue-200'    },
  overestimated:  { label:'💜 Overestimated',  color:'text-purple-700',  bg:'bg-purple-50',   border:'border-purple-200'  },
  mismatched:     { label:'🔄 Mismatched',     color:'text-orange-700',  bg:'bg-orange-50',   border:'border-orange-200'  },
};

// ── Single entry card ─────────────────────────────────────────────
const EntryCard = ({ r }) => {
  const [open, setOpen] = useState(false);
  const gap      = GAP_CONFIG[r.emotionGap] || GAP_CONFIG.aligned;
  // ✅ model field: awarenessScore (NOT metacognitiveGapScore)
  const barPct   = r.awarenessScore ?? 50;
  const barColor = barPct >= 70 ? 'bg-emerald-400' : barPct >= 50 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${gap.border}`}>
      <div className={`p-5 ${gap.bg}`}>

        {/* Title + date + gap badge */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-bold text-gray-900">{r.quizTitle || 'Quiz'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(r.createdAt).toLocaleDateString('en-US',
                { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold border ${gap.color} ${gap.bg} ${gap.border}`}>
            {gap.label}
          </span>
        </div>

        {/* Emotion comparison */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">{EMOTION_EMOJI[r.selfReportedEmotion] || '😐'}</span>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">You felt</p>
              {/* ✅ model field: selfReportedEmotion */}
              <p className="text-sm font-bold text-gray-800 capitalize">{r.selfReportedEmotion}</p>
            </div>
          </div>
          <span className="text-gray-300 font-black text-lg">vs</span>
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">{EMOTION_EMOJI[r.aiDetectedEmotion] || '😐'}</span>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">AI detected</p>
              {/* ✅ model field: aiDetectedEmotion */}
              <p className="text-sm font-bold text-gray-800 capitalize">{r.aiDetectedEmotion}</p>
            </div>
          </div>
        </div>

        {/* Ratings */}
        <div className="flex gap-6 mb-4 text-xs">
          {/* ✅ model field: confidenceRating */}
          <span className="flex items-center gap-1 text-gray-600">
            <span className="font-semibold">Confidence:</span>
            {[1,2,3,4,5].map(i => <span key={i} className={i <= r.confidenceRating ? 'text-emerald-500' : 'text-gray-200'}>●</span>)}
          </span>
          {/* ✅ model field: effortRating (NOT difficultyRating) */}
          <span className="flex items-center gap-1 text-gray-600">
            <span className="font-semibold">Effort:</span>
            {[1,2,3,4,5].map(i => <span key={i} className={i <= r.effortRating ? 'text-orange-400' : 'text-gray-200'}>●</span>)}
          </span>
        </div>

        {/* Awareness bar — model field: awarenessScore */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-32 shrink-0">Awareness Score</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
          </div>
          <span className="text-xs font-bold text-gray-700 w-10 text-right">{barPct}/100</span>
        </div>
      </div>

      {/* Expandable insight + note */}
      {(r.insight || r.reflectionText) && (
        <div className="border-t border-gray-100 bg-white">
          <button onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <span>📝 {r.reflectionText ? 'Insight & Note' : 'AI Insight'}</span>
            <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {open && (
            <div className="px-5 pb-5 space-y-3">
              {r.insight && (
                <p className="text-sm text-gray-700 italic bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                  🧠 {r.insight}
                </p>
              )}
              {/* ✅ model field: reflectionText (NOT journalNote) */}
              {r.reflectionText && (
                <p className="text-sm text-gray-600 italic bg-gray-50 border border-gray-100 p-3 rounded-lg">
                  💬 "{r.reflectionText}"
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────
const JournalPage = () => {
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
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
      console.error('Journal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id:'dashboard',    label:'Dashboard',      onClick: () => navigate('/dashboard'),
      icon:<svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id:'wellness',     label:'Wellness Centre', onClick: () => navigate('/wellness-centre'),
      icon:<svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
    { id:'gamification', label:'My Progress',     onClick: () => navigate('/gamification'),
      icon:<svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
     { id:'peer-comparison', label:'Peer Comparison', onClick: () => navigate('/peer-comparison'),
      icon:<svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
      { id:'journal',      label:'My Journal',      onClick: () => navigate('/journal'),
      icon:<svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { id:'profile',      label:'Profile',         onClick: () => navigate('/profile'),
      icon:<svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ];

  // ✅ Stats field names match controller output exactly
  const stats       = data?.stats;   // { awarenessScore, totalEntries, emotionMatchRate, avgConfidence }
  const reflections = data?.reflections || [];

  return (
    <div className="min-h-screen bg-white">
      <Header userName={userName} userRole="student" />
      <Sidebar activeMenuItem={activeMenuItem} setActiveMenuItem={setActiveMenuItem} menuItems={menuItems} />

      <div className="ml-52 pt-14">
        <div className="p-6 max-w-4xl">

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-3xl">📖</span> My Self-Reflection Journal
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Compare how you felt vs what AI detected — track your metacognitive awareness over time.
            </p>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
              </div>
              <div className="h-40 bg-gray-100 rounded-2xl" />
            </div>
          )}

          {/* Empty state */}
          {!loading && reflections.length === 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📓</div>
              <h2 className="text-xl font-bold text-teal-900 mb-2">No Journal Entries Yet</h2>
              <p className="text-teal-700 text-sm max-w-sm mx-auto mb-6">
                After you complete a quiz, a green <strong>"Write Your Self-Reflection"</strong> button
                will appear on the results screen. Click it to add your first entry!
              </p>
              <button onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all">
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Data view */}
          {!loading && reflections.length > 0 && stats && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4 mb-6">

                {/* Awareness ring */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">Awareness Score</p>
                  <div className="relative" style={{ width:90, height:90 }}>
                    <svg width={90} height={90} className="-rotate-90 absolute inset-0">
                      <circle cx={45} cy={45} r={35} fill="none" stroke="#e5e7eb" strokeWidth={8} />
                      <circle cx={45} cy={45} r={35} fill="none"
                        stroke={stats.awarenessScore >= 70 ? '#10b981' : stats.awarenessScore >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth={8}
                        strokeDasharray={`${(stats.awarenessScore / 100) * 219.9} 219.9`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className={`text-xl font-black ${stats.awarenessScore >= 70 ? 'text-emerald-600' : stats.awarenessScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {stats.awarenessScore}
                      </p>
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold uppercase mt-2 ${stats.awarenessScore >= 70 ? 'text-emerald-500' : stats.awarenessScore >= 50 ? 'text-yellow-500' : 'text-red-400'}`}>
                    {stats.awarenessScore >= 70 ? 'High' : stats.awarenessScore >= 50 ? 'Growing' : 'Needs Work'}
                  </p>
                </div>

                {/* ✅ stats.totalEntries */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Entries</p>
                  <p className="text-4xl font-black text-blue-600">{stats.totalEntries}</p>
                  <p className="text-xs text-blue-400 mt-1">reflections</p>
                </div>

                {/* ✅ stats.emotionMatchRate */}
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Emotion Match</p>
                  <p className="text-4xl font-black text-purple-600">{stats.emotionMatchRate}%</p>
                  <p className="text-xs text-purple-400 mt-1">self vs AI</p>
                </div>

                {/* ✅ stats.avgConfidence */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Avg Confidence</p>
                  <p className="text-4xl font-black text-amber-600">
                    {stats.avgConfidence}<span className="text-lg text-amber-400">/5</span>
                  </p>
                </div>
              </div>

              {/* Info banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex gap-3">
                <span className="text-xl shrink-0">🧠</span>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  <strong>Metacognitive awareness</strong> is how accurately you understand your own emotions
                  while learning. Higher score = your self-perception matches what AI detects — a key skill
                  for self-regulated learning.
                </p>
              </div>

              {/* Entries list */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-lg">
                  Journal Entries <span className="text-gray-400 font-normal text-sm">({reflections.length})</span>
                </h2>
                <button onClick={fetchJournal}
                  className="text-sm text-teal-600 border border-teal-200 px-4 py-2 rounded-xl hover:bg-teal-50 font-medium">
                  ↻ Refresh
                </button>
              </div>

              <div className="space-y-4 pb-10">
                {reflections.map(r => <EntryCard key={r._id} r={r} />)}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default JournalPage;