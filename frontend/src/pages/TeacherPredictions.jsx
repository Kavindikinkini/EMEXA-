import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ExamReadinessTimeline from "../components/ExamReadinessTimeline";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CLUSTER_META = {
  'high-performer':    { label: 'High performer',   bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  'average-performer': { label: 'Average performer', bg: '#fef9c3', text: '#713f12', dot: '#eab308' },
  'at-risk':           { label: 'At risk',           bg: '#fee2e2', text: '#7f1d1d', dot: '#ef4444' },
  'insufficient-data': { label: 'No data yet',       bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' }
};
const RISK_META = {
  low:    { label: 'Low risk',    color: '#10b981' },
  medium: { label: 'Medium risk', color: '#f59e0b' },
  high:   { label: 'High risk',   color: '#ef4444' }
};
const READINESS_META = {
  'well-prepared':       { icon: '✦', color: '#10b981' },
  'moderately-prepared': { icon: '◈', color: '#f59e0b' },
  'needs-support':       { icon: '◉', color: '#ef4444' }
};

function ScoreGauge({ value, size = 64, color = '#6366f1' }) {
  const r    = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, value ?? 0));
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: color, fontFamily: 'inherit' }}>
        {value != null ? `${Math.round(value)}%` : '—'}
      </text>
    </svg>
  );
}

function EmotionBar({ label, ratio, color }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
        <span style={{ textTransform: 'capitalize' }}>{label}</span>
        <span>{Math.round((ratio || 0) * 100)}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color,
          width: `${(ratio || 0) * 100}%`, transition: 'width 0.6s ease' }}/>
      </div>
    </div>
  );
}

function ApproveModal({ prediction, onClose, onDone, authHeader }) {
  const [adjustedScore, setAdjustedScore] = useState(
    prediction.adjustedScore ?? prediction.predictedScore ?? ''
  );
  const [note, setNote] = useState(prediction.teacherNote || '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await axios.patch(
        `${API}/api/predictions/${prediction._id}/approve`,
        { adjustedScore: adjustedScore !== '' ? Number(adjustedScore) : undefined, teacherNote: note },
        { headers: authHeader }
      );
      onDone();
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          Approve prediction
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
          Optionally adjust the predicted score before sending to student.
        </p>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Final predicted score (%)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <input type="number" min={0} max={100} value={adjustedScore}
            onChange={e => setAdjustedScore(e.target.value)}
            style={{ width: 90, padding: '8px 12px', borderRadius: 8,
              border: '1.5px solid #d1d5db', fontSize: 16, fontWeight: 700,
              textAlign: 'center', outline: 'none' }}
          />
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            Predicted: <strong style={{ color: '#0d9488' }}>
              {prediction.predictedScore != null ? `${prediction.predictedScore}%` : '—'}
            </strong>
          </span>
        </div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Teacher note (optional)
        </label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Add a note for the student..."
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8,
            border: '1.5px solid #d1d5db', fontSize: 13, resize: 'vertical',
            boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={submit} disabled={loading} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            background: '#0d9488', color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Approving…' : 'Approve & send to student'}
          </button>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8,
            border: '1.5px solid #e5e7eb', background: '#fff', fontWeight: 600,
            fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function StudentPredictionCard({ prediction, authHeader, onApprove, onReject, onRefresh }) {
  const [expanded,  setExpanded]  = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const s       = prediction.studentId || {};
  const cluster = CLUSTER_META[prediction.clusterLabel] || CLUSTER_META['insufficient-data'];
  const risk    = RISK_META[prediction.riskLevel]        || RISK_META.medium;
  const psych   = prediction.psychologicalReadiness      || {};
  const phys    = prediction.physicalReadiness           || {};
  const snap    = prediction.dataSnapshot                || {};
  const rdns    = READINESS_META[psych.readinessLabel]   || READINESS_META['moderately-prepared'];
  const finalScore = prediction.adjustedScore ?? prediction.predictedScore;

  const statusColors = {
    pending:  { bg: '#fef3c7', text: '#92400e' },
    approved: { bg: '#d1fae5', text: '#065f46' },
    rejected: { bg: '#fee2e2', text: '#7f1d1d' }
  };
  const sc = statusColors[prediction.status] || statusColors.pending;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
      overflow: 'hidden', boxShadow: expanded ? '0 8px 30px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Header */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 700, color: '#0d9488', overflow: 'hidden' }}>
          {s.profileImage
            ? <img src={s.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : (s.name || '?')[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{s.name || 'Unknown'}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{s.studentId}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: sc.bg, color: sc.text, textTransform: 'capitalize' }}>
              {prediction.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
              background: cluster.bg, color: cluster.text }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: cluster.dot, display: 'inline-block' }}/>
              {cluster.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: risk.color }}>{risk.label}</span>
            <span style={{ fontSize: 11, color: rdns.color }}>
              {rdns.icon} {(psych.readinessLabel || '').replace(/-/g, ' ')}
            </span>
          </div>
        </div>

        <ScoreGauge value={finalScore} size={58}
          color={prediction.riskLevel === 'high' ? '#ef4444'
               : prediction.riskLevel === 'low'  ? '#10b981' : '#f59e0b'} />

        <button onClick={() => setExpanded(e => !e)} style={{
          background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#6b7280', flexShrink: 0
        }}>{expanded ? '▲' : '▼'}</button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 20px' }}>
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'timeline', label: 'Readiness timeline' }
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '12px 18px', background: 'none', border: 'none',
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? '#0d9488' : '#6b7280',
                borderBottom: activeTab === tab.key ? '2px solid #0d9488' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s'
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* Psychological readiness */}
                <div style={{ background: '#fafafa', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Psychological readiness
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                    <div style={{ textAlign: 'center' }}>
                      <ScoreGauge value={psych.stressIndex}     size={52} color="#ef4444"/>
                      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Stress</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <ScoreGauge value={psych.confidenceIndex} size={52} color="#10b981"/>
                      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Confidence</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                    Dominant emotion:{' '}
                    <strong style={{ color: '#374151', textTransform: 'capitalize' }}>
                      {psych.dominantEmotion || '—'}
                    </strong>
                  </div>
                  <EmotionBar label="happy"    ratio={snap.happyRatio}    color="#10b981"/>
                  <EmotionBar label="neutral"  ratio={snap.neutralRatio}  color="#6b7280"/>
                  <EmotionBar label="confused" ratio={snap.confusedRatio} color="#f59e0b"/>
                  <EmotionBar label="anxious"  ratio={snap.anxiousRatio}  color="#f97316"/>
                  <EmotionBar label="angry"    ratio={snap.angryRatio}    color="#ef4444"/>
                  {psych.summary && (
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '10px 0 0',
                      lineHeight: 1.5, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                      {psych.summary}
                    </p>
                  )}
                </div>

                {/* Academic readiness */}
                <div style={{ background: '#fafafa', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Academic readiness
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <ScoreGauge value={phys.avgScore} size={58} color="#0d9488"/>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Avg quiz score</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div>Quizzes <strong style={{ color: '#111827' }}>{phys.totalQuizzesTaken}</strong></div>
                    <div>Trend <strong style={{ color: '#111827', textTransform: 'capitalize' }}>{phys.scoretrend}</strong></div>
                    <div>Avg hints <strong style={{ color: '#111827' }}>{phys.hintsUsedAvg}</strong></div>
                    <div>Version <strong style={{ color: '#111827' }}>v{prediction.version}</strong></div>
                  </div>
                  {phys.summary && (
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '10px 0 0',
                      lineHeight: 1.5, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                      {phys.summary}
                    </p>
                  )}
                </div>
              </div>

              {prediction.teacherNote && (
                <div style={{ background: '#f0fdfa', borderRadius: 8, padding: '10px 14px',
                  fontSize: 12, color: '#0d9488', marginBottom: 14 }}>
                  <strong>Your note:</strong> {prediction.teacherNote}
                </div>
              )}

              {prediction.status !== 'approved' && prediction.clusterLabel !== 'insufficient-data' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setApproving(true)} style={{
                    padding: '9px 18px', borderRadius: 8, border: 'none',
                    background: '#0d9488', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}>Review & approve</button>
                  {prediction.status !== 'rejected' && (
                    <button onClick={async () => { setRejecting(true); await onReject(prediction._id); setRejecting(false); }}
                      disabled={rejecting} style={{
                        padding: '9px 18px', borderRadius: 8, border: '1px solid #fee2e2',
                        background: '#fff', color: '#ef4444', fontWeight: 600, fontSize: 13,
                        cursor: rejecting ? 'not-allowed' : 'pointer'
                      }}>{rejecting ? 'Rejecting…' : 'Reject'}</button>
                  )}
                  <button onClick={() => onRefresh(prediction.studentId?._id || prediction.studentId)} style={{
                    padding: '9px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                    background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer'
                  }}>↻ Regenerate</button>
                </div>
              )}
              {prediction.status === 'approved' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                    ✓ Approved — visible to student
                  </span>
                  <button onClick={() => onRefresh(prediction.studentId?._id || prediction.studentId)} style={{
                    padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
                    background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer'
                  }}>↻ Regenerate</button>
                </div>
              )}
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <div style={{ padding: '18px 20px' }}>
              <ExamReadinessTimeline
                studentId={s._id || (typeof prediction.studentId === 'object'
                  ? prediction.studentId._id : prediction.studentId)}
                studentName={s.name}
              />
            </div>
          )}

        </div>
      )}

      {approving && (
        <ApproveModal prediction={prediction} authHeader={authHeader}
          onClose={() => setApproving(false)}
          onDone={() => { setApproving(false); onApprove(); }} />
      )}
    </div>
  );
}

function OverviewBar({ overview }) {
  if (!overview) return null;
  const cards = [
    { label: 'Total students', value: overview.total,                    color: '#0d9488' },
    { label: 'Approved',       value: overview.approved,                 color: '#10b981' },
    { label: 'Pending review', value: overview.pending,                  color: '#f59e0b' },
    { label: 'High risk',      value: overview.riskBreakdown?.high || 0, color: '#ef4444' },
    { label: 'Avg predicted',  value: `${overview.avgPredictedScore}%`,  color: '#374151' }
  ];
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ flex: '1 1 120px', background: '#fff', borderRadius: 12,
          border: '1px solid #e5e7eb', padding: '14px 18px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function TeacherPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [overview,    setOverview]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [seeding,     setSeeding]     = useState(false);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState(null);

  const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [predsRes, overviewRes] = await Promise.all([
        axios.get(`${API}/api/predictions/teacher/all`,        { headers: getAuthHeader() }),
        axios.get(`${API}/api/predictions/classroom-overview`, { headers: getAuthHeader() })
      ]);
      setPredictions(predsRes.data.predictions || []);
      setOverview(overviewRes.data.overview    || null);
    } catch { showToast('Failed to load predictions', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeedAll = async () => {
    setSeeding(true);
    try {
      const res = await axios.post(`${API}/api/predictions/seed-all`, {}, { headers: getAuthHeader() });
      const { seeded, total, message } = res.data;
      if (seeded === 0) {
        showToast(message || 'No matching students found. Make sure students have year & semester set.', 'error');
      } else {
        showToast(`✓ Generated predictions for ${seeded} of ${total} students`);
        await fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate predictions', 'error');
    } finally { setSeeding(false); }
  };

  const handleReject = async (predictionId) => {
    try {
      await axios.patch(`${API}/api/predictions/${predictionId}/reject`, {}, { headers: getAuthHeader() });
      showToast('Prediction rejected');
      fetchData();
    } catch { showToast('Failed to reject', 'error'); }
  };

  const handleRefresh = async (studentId) => {
    const sid = typeof studentId === 'object' ? studentId._id : studentId;
    try {
      await axios.post(`${API}/api/predictions/generate/${sid}`, {}, { headers: getAuthHeader() });
      showToast('Prediction regenerated');
      fetchData();
    } catch { showToast('Failed to regenerate', 'error'); }
  };

  const filtered = predictions.filter(p => {
    const name = (p.studentId?.name || '').toLowerCase();
    const sid  = (p.studentId?.studentId || '').toLowerCase();
    if (!name.includes(search.toLowerCase()) && !sid.includes(search.toLowerCase())) return false;
    if (filter === 'pending')  return p.status === 'pending';
    if (filter === 'approved') return p.status === 'approved';
    if (filter === 'at-risk')  return p.clusterLabel === 'at-risk';
    return true;
  });

  return (
    <div style={{ padding: '5px 0px', maxWidth: 960, margin: '0 auto',
      fontFamily: "'Inter', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#7f1d1d' : '#065f46',
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827' }}>
            Final exam predictions
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
            AI-generated predictions based on quiz scores and emotional data.
            Approve each prediction to make it visible to the student.
          </p>
        </div>

        {/* Generate All button — your teal colour */}
        <button onClick={handleSeedAll} disabled={seeding} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: seeding ? '#ccfbf1' : '#0d9488', color: '#fff',
          fontWeight: 700, fontSize: 14, cursor: seeding ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(13,148,136,0.25)', whiteSpace: 'nowrap'
        }}>
          {seeding ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14,
                border: '2px solid #fff', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              Generating…
            </>
          ) : (
            <> ⚡ Generate all predictions </>
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <OverviewBar overview={overview} />

      {/* Empty state */}
      {!loading && predictions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px',
          background: '#fafafa', borderRadius: 16, border: '1.5px dashed #d1d5db',
          marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
            No predictions yet
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 400,
            margin: '0 auto 20px', lineHeight: 1.6 }}>
            Click <strong>⚡ Generate all predictions</strong> to create predictions for all
            existing students in your class based on their quiz scores and emotional data.
            Predictions also auto-generate whenever a student completes a new quiz.
          </p>
          <button onClick={handleSeedAll} disabled={seeding} style={{
            padding: '11px 28px', borderRadius: 10, border: 'none',
            background: '#0d9488', color: '#fff', fontWeight: 700,
            fontSize: 14, cursor: seeding ? 'not-allowed' : 'pointer'
          }}>
            {seeding ? 'Generating…' : '⚡ Generate all predictions'}
          </button>
        </div>
      )}

      {/* Search + filter — your teal active colour */}
      {predictions.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <input placeholder="Search student name or ID…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 200px', padding: '9px 14px', borderRadius: 8,
              border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none' }}
          />
          {['all', 'pending', 'approved', 'at-risk'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${filter === f ? '#0d9488' : '#e5e7eb'}`,
              background: filter === f ? '#ccfbf1' : '#fff',
              color: filter === f ? '#0d9488' : '#374151',
              cursor: 'pointer', textTransform: 'capitalize'
            }}>
              {f === 'all' ? `All (${predictions.length})` : f}
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: 14 }}>
          Loading predictions…
        </div>
      ) : filtered.length === 0 && predictions.length > 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>
          No students match your search.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(p => (
            <StudentPredictionCard key={p._id} prediction={p} authHeader={getAuthHeader()}
              onApprove={fetchData} onReject={handleReject} onRefresh={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}