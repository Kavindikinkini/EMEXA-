// frontend/src/components/ReflectionJournal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';
const emotionEmoji = { happy:'😊', sad:'😢', angry:'😠', confused:'😕', neutral:'😐', surprised:'😲', fear:'😨' };

const ReflectionJournal = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJournal(); }, []);

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/reflections/my-journal`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (err) {
      console.error('Journal error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  if (!data || data.reflections.length === 0) return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-teal-50 p-3 rounded-xl">
          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Self-Reflection Journal</h2>
      </div>
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">📖</div>
        <p className="font-semibold text-teal-900 mb-2">No Journal Entries Yet</p>
        <p className="text-teal-700 text-sm">Complete a quiz and fill in the self-reflection form to start your journal!</p>
      </div>
    </div>
  );

  const { stats, reflections } = data;
  const awarenessColor = stats.awarenessScore >= 70 ? 'text-emerald-600' : stats.awarenessScore >= 40 ? 'text-yellow-600' : 'text-red-600';
  const awarenessLabel = stats.awarenessScore >= 70 ? 'High Awareness' : stats.awarenessScore >= 40 ? 'Developing' : 'Needs Work';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-3 rounded-xl">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Self-Reflection Journal</h2>
            <p className="text-sm text-gray-500">{stats.totalEntries} entries · Metacognitive awareness tracking</p>
          </div>
        </div>
        <button onClick={fetchJournal} className="text-sm text-teal-600 border border-teal-200 px-4 py-2 rounded-xl hover:bg-teal-50 font-medium">Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Metacognitive Awareness</p>
          <p className={`text-2xl font-black ${awarenessColor}`}>{stats.awarenessScore}</p>
          <p className={`text-xs font-semibold ${awarenessColor}`}>{awarenessLabel}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Emotion Match Rate</p>
          <p className="text-2xl font-black text-blue-600">{stats.emotionMatchRate}%</p>
          <p className="text-xs text-gray-400">Self vs AI</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Confidence</p>
          <p className="text-2xl font-black text-purple-600">{stats.avgConfidence}/5</p>
          <p className="text-xs text-gray-400">Self-rated</p>
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {reflections.map(r => (
          <div key={r._id} className={`border rounded-xl p-5 ${r.emotionMatch ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{r.quizTitle || 'Quiz'}</p>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${r.emotionMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                  {r.emotionMatch ? '✓ Match' : '≠ Gap'}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{Math.round(r.actualScore)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                <span className="text-xl">{emotionEmoji[r.selfReportedEmotion] || '😐'}</span>
                <div>
                  <p className="text-xs text-gray-400">You felt</p>
                  <p className="text-xs font-semibold text-gray-700 capitalize">{r.selfReportedEmotion}</p>
                </div>
              </div>
              <span className="text-gray-300 font-bold">vs</span>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                <span className="text-xl">{emotionEmoji[r.aiDetectedEmotion] || '😐'}</span>
                <div>
                  <p className="text-xs text-gray-400">AI detected</p>
                  <p className="text-xs font-semibold text-gray-700 capitalize">{r.aiDetectedEmotion}</p>
                </div>
              </div>
              <div className="ml-auto text-xs text-gray-500">
                Confidence: {r.confidenceRating}/5 · Difficulty: {r.difficultyRating}/5
              </div>
            </div>
            {r.journalNote && (
              <div className="bg-white/70 border border-gray-100 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 italic">"{r.journalNote}"</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Metacognitive Gap:</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${r.metacognitiveGapScore < 30 ? 'bg-emerald-400' : r.metacognitiveGapScore < 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${r.metacognitiveGapScore}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-600">{r.metacognitiveGapScore}/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReflectionJournal;