import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Donut gauge ───────────────────────────────────────────────────────────────
function Donut({ value, size = 90, stroke = 8, color = '#6366f1', label = '' }) {
  const r    = (size / 2) - stroke;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, value ?? 0));
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="#e5e7eb" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x={size/2} y={size/2 - 5} textAnchor="middle"
          style={{ fontSize: 18, fontWeight: 800, fill: color, fontFamily: 'inherit' }}>
          {value != null ? `${Math.round(value)}` : '—'}
        </text>
        <text x={size/2} y={size/2 + 12} textAnchor="middle"
          style={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'inherit' }}>%</text>
      </svg>
      {label && <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>{label}</span>}
    </div>
  );
}

// ── Bar ───────────────────────────────────────────────────────────────────────
function ReadinessBar({ label, value, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: '#6b7280', marginBottom: 3 }}>
        <span>{label}</span><span style={{ color, fontWeight: 600 }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: `${value}%`, transition: 'width 1s ease'
        }}/>
      </div>
    </div>
  );
}

// ── Risk pill ─────────────────────────────────────────────────────────────────
const RISK_CONFIG = {
  low:    { label: 'Low risk',    bg: '#d1fae5', text: '#065f46', icon: '▲' },
  medium: { label: 'Medium risk', bg: '#fef3c7', text: '#92400e', icon: '◆' },
  high:   { label: 'High risk',   bg: '#fee2e2', text: '#7f1d1d', icon: '▼' }
};
const CLUSTER_CONFIG = {
  'high-performer':    { label: 'High performer',   color: '#10b981' },
  'average-performer': { label: 'Average performer', color: '#f59e0b' },
  'at-risk':           { label: 'At risk',           color: '#ef4444' },
  'insufficient-data': { label: 'Building profile',  color: '#9ca3af' }
};
const READINESS_CONFIG = {
  'well-prepared':       { label: 'Well prepared',       color: '#10b981', bg: '#d1fae5' },
  'moderately-prepared': { label: 'Moderately prepared', color: '#f59e0b', bg: '#fef3c7' },
  'needs-support':       { label: 'Needs support',       color: '#ef4444', bg: '#fee2e2' }
};

// ── Main badge/widget ─────────────────────────────────────────────────────────
export default function PredictionBadge() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await axios.get(`${API}/api/predictions/student/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setPrediction(res.data.prediction || null);
      } catch {
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, []);

  if (loading) {
    return (
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        padding: '20px 22px', animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: '60%', marginBottom: 8 }}/>
        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, width: '40%' }}/>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div style={{
        background: '#fafafa', borderRadius: 16, border: '1.5px dashed #d1d5db',
        padding: '22px 22px', textAlign: 'center'
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
          No prediction yet
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
          Your teacher will generate and approve your final exam prediction
          based on your quiz performance and emotion data.
        </div>
      </div>
    );
  }

  const finalScore = prediction.finalScore ?? prediction.predictedScore;
  const psych  = prediction.psychologicalReadiness || {};
  const phys   = prediction.physicalReadiness || {};
  const risk   = RISK_CONFIG[prediction.riskLevel] || RISK_CONFIG.medium;
  const cluster = CLUSTER_CONFIG[prediction.clusterLabel] || CLUSTER_CONFIG['average-performer'];
  const rdns   = READINESS_CONFIG[psych.readinessLabel] || READINESS_CONFIG['moderately-prepared'];
  const teacher = prediction.teacherId;

  // Score colour
  const scoreColor = finalScore >= 65 ? '#10b981' : finalScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
      overflow: 'hidden', fontFamily: "'Inter', sans-serif",
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    }}>
      {/* ── Top accent bar ── */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${scoreColor}, #6366f1)` }}/>

      {/* ── Header ── */}
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

          {/* Score donut */}
          <Donut value={finalScore} size={80} stroke={7} color={scoreColor} label="Predicted score"/>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
              Final exam prediction
            </div>

            {/* Risk pill */}
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 20, marginBottom: 6,
              background: risk.bg, color: risk.text
            }}>
              {risk.icon} {risk.label}
            </span>

            {/* Cluster */}
            <div style={{ fontSize: 12, color: cluster.color, fontWeight: 600, marginBottom: 4 }}>
              {cluster.label}
            </div>

            {/* Readiness */}
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20,
              background: rdns.bg, color: rdns.color
            }}>
              {rdns.label}
            </span>
          </div>
        </div>

        {/* Teacher note */}
        {prediction.teacherNote && (
          <div style={{
            marginTop: 12, background: '#eff6ff', borderRadius: 8,
            padding: '10px 14px', fontSize: 12, color: '#1e40af', lineHeight: 1.5
          }}>
            <strong>Teacher's note:</strong> {prediction.teacherNote}
          </div>
        )}

        {/* Approved by */}
        <div style={{ marginTop: 10, fontSize: 11, color: '#9ca3af' }}>
          Approved by {teacher?.name || 'your teacher'}
          {prediction.approvedAt && ` · ${new Date(prediction.approvedAt).toLocaleDateString()}`}
        </div>
      </div>

      {/* ── Toggle button ── */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', padding: '10px 20px', background: '#fafafa',
        border: 'none', borderTop: '1px solid #f3f4f6',
        fontSize: 12, color: '#6b7280', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontFamily: 'inherit'
      }}>
        {expanded ? '▲ Hide details' : '▼ View full analysis'}
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #f3f4f6' }}>

          {/* Two gauges */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
            <Donut value={psych.confidenceIndex} size={70} stroke={6}
              color="#10b981" label="Confidence"/>
            <Donut value={psych.stressIndex} size={70} stroke={6}
              color="#ef4444" label="Stress"/>
            <Donut value={phys.avgScore} size={70} stroke={6}
              color="#6366f1" label="Quiz avg"/>
          </div>

          {/* Readiness bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <ReadinessBar label="Confidence" value={psych.confidenceIndex || 0} color="#10b981"/>
            <ReadinessBar label="Stress level" value={psych.stressIndex || 0} color="#ef4444"/>
            <ReadinessBar label="Quiz performance" value={phys.avgScore || 0} color="#6366f1"/>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Quizzes taken', value: phys.totalQuizzesTaken },
              { label: 'Score trend', value: phys.scoretrend, cap: true },
              { label: 'Dominant emotion', value: psych.dominantEmotion, cap: true },
              { label: 'Avg hints used', value: phys.hintsUsedAvg }
            ].map(item => (
              <div key={item.label} style={{
                background: '#fafafa', borderRadius: 8, padding: '10px 12px'
              }}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{item.label}</div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#111827',
                  textTransform: item.cap ? 'capitalize' : 'none'
                }}>
                  {item.value ?? '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Psychological summary */}
          {psych.summary && (
            <div style={{
              background: '#f0fdf4', borderRadius: 8, padding: '10px 14px',
              fontSize: 12, color: '#166534', lineHeight: 1.6, marginBottom: 10
            }}>
              <strong>Psychological insight:</strong> {psych.summary}
            </div>
          )}

          {/* Physical summary */}
          {phys.summary && (
            <div style={{
              background: '#eff6ff', borderRadius: 8, padding: '10px 14px',
              fontSize: 12, color: '#1e40af', lineHeight: 1.6
            }}>
              <strong>Academic insight:</strong> {phys.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}