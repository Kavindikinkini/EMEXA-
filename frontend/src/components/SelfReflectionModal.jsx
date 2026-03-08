// frontend/src/components/SelfReflectionModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const EMOTIONS = [
  { id: 'happy',      emoji: '😊', label: 'Happy'      },
  { id: 'confident',  emoji: '💪', label: 'Confident'  },
  { id: 'neutral',    emoji: '😐', label: 'Neutral'    },
  { id: 'confused',   emoji: '😕', label: 'Confused'   },
  { id: 'anxious',    emoji: '😰', label: 'Anxious'    },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated' },
  { id: 'sad',        emoji: '😢', label: 'Sad'        },
  { id: 'angry',      emoji: '😠', label: 'Angry'      },
];

const GAP_COLORS = {
  aligned:        { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', icon: '✅' },
  underestimated: { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-800',    icon: '🔍' },
  overestimated:  { bg: 'bg-purple-50',  border: 'border-purple-300',  text: 'text-purple-800',  icon: '💜' },
  mismatched:     { bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-800',  icon: '🔄' },
};

const StarRating = ({ value, onChange, label }) => (
  <div>
    <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
    <div className="flex gap-2 items-center">
      {[1,2,3,4,5].map(star => (
        <button key={star} onClick={() => onChange(star)}
          className={`text-2xl transition-transform hover:scale-110 ${star <= value ? 'opacity-100' : 'opacity-30'}`}>
          ⭐
        </button>
      ))}
      <span className="text-sm text-gray-500 ml-1">{value}/5</span>
    </div>
  </div>
);

// Props: attemptId, quizId, aiDetectedEmotion, onClose, onSubmitted
const SelfReflectionModal = ({ attemptId, quizId, aiDetectedEmotion, onClose, onSubmitted }) => {
  const [step, setStep]                         = useState(1);
  const [selectedEmotion, setSelectedEmotion]   = useState('');
  const [confidence, setConfidence]             = useState(3);
  const [effort, setEffort]                     = useState(3);
  const [reflectionText, setReflectionText]     = useState('');
  const [result, setResult]                     = useState(null);
  const [submitting, setSubmitting]             = useState(false);
  const [alreadyReflected, setAlreadyReflected] = useState(false);

  useEffect(() => { if (attemptId) checkExisting(); }, []);

  const checkExisting = async () => {
    try {
      const token = localStorage.getItem('token');
      // ✅ FIXED: /api/reflections (matches server.js mount)
      const res = await axios.get(`${API_BASE}/api/reflections/check/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.hasReflected) setAlreadyReflected(true);
    } catch (e) {
      console.error('Check reflection error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmotion) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      // ✅ FIXED: /api/reflections (matches server.js mount)
      const res = await axios.post(`${API_BASE}/api/reflections`, {
        attemptId,
        quizId,
        selfReportedEmotion: selectedEmotion,
        confidenceRating: confidence,
        effortRating: effort,
        reflectionText
      }, { headers: { Authorization: `Bearer ${token}` } });

      setResult(res.data);
      setStep(3);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error('Reflection submit error:', err);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Already reflected ────────────────────────────────────────────
  if (alreadyReflected) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Already Reflected!</h3>
        <p className="text-gray-600 mb-6">You've already submitted a reflection for this quiz. Check your journal to see the insight.</p>
        <button onClick={onClose} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600">
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">🪞 Self-Reflection Journal</h2>
              <p className="text-emerald-100 text-sm mt-1">How did you feel during this quiz?</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-3xl leading-none">×</button>
          </div>
          <div className="flex gap-2 mt-4">
            {[1,2,3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${step >= s ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        <div className="p-6">

          {/* ── STEP 1: Emotion picker ── */}
          {step === 1 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-1">How did you feel during the quiz?</h3>
              <p className="text-sm text-gray-500 mb-4">Be honest — this is just for your personal growth 🌱</p>

              <div className="grid grid-cols-4 gap-3 mb-5">
                {EMOTIONS.map(em => (
                  <button key={em.id} onClick={() => setSelectedEmotion(em.id)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                      selectedEmotion === em.id
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}>
                    <span className="text-2xl mb-1">{em.emoji}</span>
                    <span className="text-xs font-medium text-gray-700">{em.label}</span>
                  </button>
                ))}
              </div>

              {aiDetectedEmotion && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-blue-700">
                    <span className="font-bold">🤖 AI detected:</span> The system observed you feeling{' '}
                    <span className="font-semibold capitalize">{aiDetectedEmotion}</span> during the quiz. Does that match?
                  </p>
                </div>
              )}

              <button onClick={() => setStep(2)} disabled={!selectedEmotion}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Next →
              </button>
            </div>
          )}

          {/* ── STEP 2: Ratings + note ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-bold text-gray-900">Rate your experience</h3>
              <StarRating value={confidence} onChange={setConfidence} label="How confident did you feel? ⭐" />
              <StarRating value={effort}     onChange={setEffort}     label="How much effort did you put in? 💪" />
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Any thoughts? (optional) 💭</p>
                <textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)}
                  placeholder="What was challenging? What went well? What will you do differently?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                  rows={3} maxLength={500} />
                <p className="text-xs text-gray-400 text-right">{reflectionText.length}/500</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
                  {submitting ? '⏳ Saving...' : '✅ Submit'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Result ── */}
          {step === 3 && result && (
            <div>
              <div className="text-center mb-5">
                <div className="text-5xl mb-3">🧠</div>
                <h3 className="text-xl font-bold text-gray-900">Reflection Saved!</h3>
                <p className="text-gray-500 text-sm mt-1">Your metacognitive insight</p>
              </div>

              {/* Awareness score ring */}
              <div className="flex items-center justify-center mb-3">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none"
                      stroke={result.reflection.awarenessScore >= 70 ? '#10b981' : result.reflection.awarenessScore >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 40 * result.reflection.awarenessScore / 100} ${2 * Math.PI * 40}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900">{result.reflection.awarenessScore}</span>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm font-semibold text-gray-600 mb-4">Metacognitive Awareness Score</p>

              {/* Insight card */}
              {result.insight && (() => {
                const gc = GAP_COLORS[result.reflection.emotionGap] || GAP_COLORS.aligned;
                return (
                  <div className={`${gc.bg} ${gc.border} border rounded-xl p-4 mb-4`}>
                    <p className="text-sm font-bold mb-1">{gc.icon} Emotion Alignment</p>
                    <p className={`text-sm ${gc.text} leading-relaxed`}>{result.insight}</p>
                  </div>
                );
              })()}

              {/* You vs AI */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">You felt</p>
                  <p className="font-bold text-gray-800 capitalize">
                    {EMOTIONS.find(e => e.id === result.reflection.selfReportedEmotion)?.emoji}{' '}
                    {result.reflection.selfReportedEmotion}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">AI detected</p>
                  <p className="font-bold text-blue-800 capitalize">🤖 {result.reflection.aiDetectedEmotion}</p>
                </div>
              </div>

              <p className="text-center text-xs text-teal-600 mb-4 font-medium">
                View all entries in <strong>My Journal</strong> from the sidebar 📖
              </p>

              <button onClick={onClose}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all">
                Done 🎉
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SelfReflectionModal;