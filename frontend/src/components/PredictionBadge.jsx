import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Donut gauge ───────────────────────────────────────────────────────────────
function Donut({ value, size = 90, stroke = 8, color = '#0d9488', label = '' }) {
  const r    = (size / 2) - stroke;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, value ?? 0));
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
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

// ── Readiness bar ─────────────────────────────────────────────────────────────
function ReadinessBar({ label, value, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: '#6b7280', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color,
          width: `${value}%`, transition: 'width 1s ease' }}/>
      </div>
    </div>
  );
}

// ── Mini SVG timeline chart ───────────────────────────────────────────────────
function MiniTimelineChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 12 }}>
        Not enough data yet — complete more quizzes to see your progress chart.
      </div>
    );
  }

  const W = 500, H = 160;
  const PAD = { t: 12, r: 16, b: 36, l: 40 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const n = history.length;

  const xOf = i  => PAD.l + (i / (n - 1)) * innerW;
  const yOf = v  => PAD.t + innerH - ((v ?? 0) / 100) * innerH;

  const predPts   = history.map((h, i) => `${xOf(i)},${yOf(h.predictedScore)}`).join(' ');
  const stressPts = history.map((h, i) => `${xOf(i)},${yOf(h.stressIndex)}`).join(' ');
  const confPts   = history.map((h, i) => `${xOf(i)},${yOf(h.confidenceIndex)}`).join(' ');
  const fillPts   = `${PAD.l},${PAD.t + innerH} ${predPts} ${xOf(n-1)},${PAD.t + innerH}`;

  const yLabels = [0, 25, 50, 75, 100];
  const RISK_COLOR = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {/* Grid */}
      {yLabels.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={yOf(v)} x2={PAD.l + innerW} y2={yOf(v)}
            stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="3 3"/>
          <text x={PAD.l - 6} y={yOf(v)} textAnchor="end" dominantBaseline="central"
            style={{ fontSize: 9, fill: '#9ca3af', fontFamily: 'inherit' }}>
            {v}%
          </text>
        </g>
      ))}

      {/* Fill area */}
      <polygon points={fillPts} fill="#0d9488" opacity={0.07}/>

      {/* Stress line */}
      <polyline points={stressPts} fill="none" stroke="#ef4444"
        strokeWidth={1.5} strokeDasharray="4 3" opacity={0.55}/>

      {/* Confidence line */}
      <polyline points={confPts} fill="none" stroke="#10b981"
        strokeWidth={1.5} strokeDasharray="4 3" opacity={0.55}/>

      {/* Predicted score line */}
      <polyline points={predPts} fill="none" stroke="#0d9488" strokeWidth={2.5}/>

      {/* Dots + risk indicator */}
      {history.map((h, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(h.predictedScore)} r={4}
            fill="#fff" stroke="#0d9488" strokeWidth={2}/>
          <circle cx={xOf(i)} cy={H - 10} r={3}
            fill={RISK_COLOR[h.riskLevel] || '#9ca3af'}/>
          <text x={xOf(i)} y={H - 1} textAnchor="middle"
            style={{ fontSize: 8, fill: '#9ca3af', fontFamily: 'inherit' }}>
            {new Date(h.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Timeline snapshot row ─────────────────────────────────────────────────────
function SnapshotRow({ h, index }) {
  const TREND_ICON  = { improving: '↑', stable: '→', declining: '↓' };
  const TREND_COLOR = { improving: '#10b981', stable: '#6b7280', declining: '#ef4444' };
  const RISK_COLOR  = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
  const RISK_BG     = { low: '#d1fae5', medium: '#fef3c7', high: '#fee2e2' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 8,
      background: index % 2 === 0 ? '#fafafa' : '#fff',
      fontSize: 12 }}>
      {/* Date */}
      <span style={{ color: '#9ca3af', minWidth: 60, fontSize: 11 }}>
        {new Date(h.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
      {/* Predicted score */}
      <span style={{ fontWeight: 800, color: '#0d9488', minWidth: 38 }}>
        {h.predictedScore != null ? `${h.predictedScore}%` : '—'}
      </span>
      {/* Stress */}
      <span style={{ color: '#ef4444', minWidth: 34, fontSize: 11 }}>
        🔴 {h.stressIndex}%
      </span>
      {/* Confidence */}
      <span style={{ color: '#10b981', minWidth: 34, fontSize: 11 }}>
        🟢 {h.confidenceIndex}%
      </span>
      {/* Trend */}
      <span style={{ color: TREND_COLOR[h.scoretrend], fontWeight: 700, minWidth: 28 }}>
        {TREND_ICON[h.scoretrend]}
      </span>
      {/* Risk pill */}
      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
        background: RISK_BG[h.riskLevel], color: RISK_COLOR[h.riskLevel] }}>
        {h.riskLevel}
      </span>
    </div>
  );
}

// ── Configs ───────────────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export default function PredictionBadge() {
  const [prediction,  setPrediction]  = useState(null);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [activeTab,   setActiveTab]   = useState('analysis');
  const [expanded,    setExpanded]    = useState(false);

  const authHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  // Fetch approved prediction
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await axios.get(`${API}/api/predictions/student/me`, { headers: authHeader });
        setPrediction(res.data.prediction || null);
      } catch {
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, []);

  // Fetch timeline history when tab is opened
  useEffect(() => {
    if (activeTab !== 'timeline' || !expanded || history.length > 0) return;
    const fetchHistory = async () => {
      setHistLoading(true);
      try {
        const res = await axios.get(`${API}/api/predictions/student/me/timeline`, { headers: authHeader });
        setHistory(res.data.history || []);
      } catch {
        setHistory([]);
      } finally {
        setHistLoading(false);
      }
    };
    fetchHistory();
  }, [activeTab, expanded]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px 22px' }}>
        <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: '60%', marginBottom: 8 }}/>
        <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, width: '40%' }}/>
      </div>
    );
  }

  // ── No prediction yet ────────────────────────────────────────────────────────
  if (!prediction) {
    return (
      <div style={{ background: '#fafafa', borderRadius: 16,
        border: '1.5px dashed #d1d5db', padding: '22px 22px', textAlign: 'center' }}>
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

  const finalScore  = prediction.finalScore ?? prediction.predictedScore;
  const psych       = prediction.psychologicalReadiness || {};
  const phys        = prediction.physicalReadiness      || {};
  const risk        = RISK_CONFIG[prediction.riskLevel]        || RISK_CONFIG.medium;
  const cluster     = CLUSTER_CONFIG[prediction.clusterLabel]  || CLUSTER_CONFIG['average-performer'];
  const rdns        = READINESS_CONFIG[psych.readinessLabel]   || READINESS_CONFIG['moderately-prepared'];
  const teacher     = prediction.teacherId;
  const scoreColor  = finalScore >= 65 ? '#10b981' : finalScore >= 40 ? '#f59e0b' : '#ef4444';

  // Delta: compare first and last history point
  const first = history[0];
  const last  = history[history.length - 1];
  const delta = first && last && first.predictedScore != null && last.predictedScore != null
    ? last.predictedScore - first.predictedScore : null;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
      overflow: 'hidden', fontFamily: "'Inter', sans-serif",
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Top accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${scoreColor}, #0d9488)` }}/>

      {/* Header */}
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Donut value={finalScore} size={80} stroke={7} color={scoreColor} label="Predicted score"/>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
              Final exam prediction
            </div>
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 20, marginBottom: 6,
              background: risk.bg, color: risk.text }}>
              {risk.icon} {risk.label}
            </span>
            <div style={{ fontSize: 12, color: cluster.color, fontWeight: 600, marginBottom: 4 }}>
              {cluster.label}
            </div>
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20, background: rdns.bg, color: rdns.color }}>
              {rdns.label}
            </span>
          </div>
        </div>

        {/* Teacher note */}
        {prediction.teacherNote && (
          <div style={{ marginTop: 12, background: '#f0fdfa', borderRadius: 8,
            padding: '10px 14px', fontSize: 12, color: '#0d9488', lineHeight: 1.5 }}>
            <strong>Teacher's note:</strong> {prediction.teacherNote}
          </div>
        )}

        {/* Approved by */}
        <div style={{ marginTop: 10, fontSize: 11, color: '#9ca3af' }}>
          Approved by {teacher?.name || 'your teacher'}
          {prediction.approvedAt && ` · ${new Date(prediction.approvedAt).toLocaleDateString()}`}
        </div>
      </div>

      {/* Toggle expand */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', padding: '10px 20px', background: '#fafafa',
        border: 'none', borderTop: '1px solid #f3f4f6',
        fontSize: 12, color: '#0d9488', fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontFamily: 'inherit'
      }}>
        {expanded ? '▲ Hide details' : '▼ View full analysis & progress'}
      </button>

      {/* Expanded area */}
      {expanded && (
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 20px' }}>
            {[
              { key: 'analysis', label: 'My analysis' },
              { key: 'timeline', label: 'My progress timeline' }
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '11px 16px', background: 'none', border: 'none',
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? '#0d9488' : '#6b7280',
                borderBottom: activeTab === tab.key ? '2px solid #0d9488' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s',
                fontFamily: 'inherit'
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Analysis tab ── */}
          {activeTab === 'analysis' && (
            <div style={{ padding: '16px 20px 20px' }}>
              {/* Three donuts */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
                <Donut value={psych.confidenceIndex} size={70} stroke={6} color="#10b981" label="Confidence"/>
                <Donut value={psych.stressIndex}     size={70} stroke={6} color="#ef4444" label="Stress"/>
                <Donut value={phys.avgScore}         size={70} stroke={6} color="#0d9488" label="Quiz avg"/>
              </div>

              {/* Readiness bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <ReadinessBar label="Confidence"       value={psych.confidenceIndex || 0} color="#10b981"/>
                <ReadinessBar label="Stress level"     value={psych.stressIndex     || 0} color="#ef4444"/>
                <ReadinessBar label="Quiz performance" value={phys.avgScore         || 0} color="#0d9488"/>
              </div>

              {/* Stat grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Quizzes taken',    value: phys.totalQuizzesTaken },
                  { label: 'Score trend',      value: phys.scoretrend, cap: true },
                  { label: 'Dominant emotion', value: psych.dominantEmotion, cap: true },
                  { label: 'Avg hints used',   value: phys.hintsUsedAvg }
                ].map(item => (
                  <div key={item.label} style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827',
                      textTransform: item.cap ? 'capitalize' : 'none' }}>
                      {item.value ?? '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights */}
              {psych.summary && (
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px',
                  fontSize: 12, color: '#166534', lineHeight: 1.6, marginBottom: 10 }}>
                  <strong>Psychological insight:</strong> {psych.summary}
                </div>
              )}
              {phys.summary && (
                <div style={{ background: '#f0fdfa', borderRadius: 8, padding: '10px 14px',
                  fontSize: 12, color: '#0d9488', lineHeight: 1.6 }}>
                  <strong>Academic insight:</strong> {phys.summary}
                </div>
              )}
            </div>
          )}

          {/* ── Timeline tab ── */}
          {activeTab === 'timeline' && (
            <div style={{ padding: '16px 20px 20px' }}>

              {histLoading ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 13 }}>
                  Loading your progress…
                </div>
              ) : (
                <>
                  {/* Delta badge + header */}
                  <div style={{ display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                        My readiness over time
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {history.length} snapshot{history.length !== 1 ? 's' : ''} recorded
                      </div>
                    </div>
                    {delta !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 20,
                        background: delta >= 0 ? '#d1fae5' : '#fee2e2',
                        color: delta >= 0 ? '#065f46' : '#7f1d1d' }}>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>
                          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
                        </span>
                        <span style={{ fontSize: 11 }}>overall change</span>
                      </div>
                    )}
                  </div>

                  {/* Chart */}
                  <div style={{ background: '#fafafa', borderRadius: 10,
                    padding: '10px 6px 4px', border: '1px solid #f3f4f6', marginBottom: 14 }}>
                    <MiniTimelineChart history={history}/>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                    {[
                      { color: '#0d9488', dash: false, label: 'Predicted score' },
                      { color: '#ef4444', dash: true,  label: 'Stress' },
                      { color: '#10b981', dash: true,  label: 'Confidence' }
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={22} height={10}>
                          <line x1={0} y1={5} x2={22} y2={5}
                            stroke={s.color} strokeWidth={2}
                            strokeDasharray={s.dash ? '4 3' : 'none'}/>
                          {!s.dash && <circle cx={11} cy={5} r={3} fill={s.color}/>}
                        </svg>
                        <span style={{ fontSize: 11, color: '#374151' }}>{s.label}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {['low','medium','high'].map(r => (
                        <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 3,
                          fontSize: 10, color: '#9ca3af' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                            background: r === 'low' ? '#10b981' : r === 'medium' ? '#f59e0b' : '#ef4444' }}/>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Snapshot rows */}
                  {history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Column headers */}
                      <div style={{ display: 'flex', gap: 10, padding: '4px 10px',
                        fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
                        <span style={{ minWidth: 60 }}>Date</span>
                        <span style={{ minWidth: 38 }}>Score</span>
                        <span style={{ minWidth: 34 }}>Stress</span>
                        <span style={{ minWidth: 34 }}>Conf.</span>
                        <span style={{ minWidth: 28 }}>Trend</span>
                        <span>Risk</span>
                      </div>
                      {[...history].reverse().map((h, i) => (
                        <SnapshotRow key={i} h={h} index={i}/>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0',
                      color: '#9ca3af', fontSize: 12 }}>
                      Complete more quizzes to build your progress history.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}