// frontend/src/components/ExamReadinessTimeline.jsx
// Interactive timeline chart — shows predicted score, stress & confidence over time.
// Drop inside TeacherPredictions expanded card OR as a standalone page.

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RISK_COLOR = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const CLUSTER_COLOR = {
  'high-performer':    '#10b981',
  'average-performer': '#f59e0b',
  'at-risk':           '#ef4444',
  'insufficient-data': '#9ca3af'
};
const READINESS_COLOR = {
  'well-prepared':       '#10b981',
  'moderately-prepared': '#f59e0b',
  'needs-support':       '#ef4444'
};
const TREND_ICON = { improving: '↑', stable: '→', declining: '↓' };
const TREND_COLOR = { improving: '#10b981', stable: '#6b7280', declining: '#ef4444' };

// ── Mini stat pill ────────────────────────────────────────────────────────────
function Pill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#f9fafb', borderRadius: 10, padding: '8px 14px', minWidth: 72 }}>
      <span style={{ fontSize: 18, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{label}</span>
    </div>
  );
}

// ── SVG line chart ────────────────────────────────────────────────────────────
function TimelineChart({ history, activeIdx, onHover }) {
  const W = 600, H = 200, PAD = { t: 16, r: 20, b: 40, l: 44 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  if (!history || history.length < 2) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        Need at least 2 predictions to draw timeline
      </div>
    );
  }

  const n = history.length;
  const xOf  = i => PAD.l + (i / (n - 1)) * innerW;
  const yOf  = v => PAD.t + innerH - ((v ?? 0) / 100) * innerH;

  // Build polyline points for each series
  const predPts      = history.map((h, i) => `${xOf(i)},${yOf(h.predictedScore)}`).join(' ');
  const stressPts    = history.map((h, i) => `${xOf(i)},${yOf(h.stressIndex)}`).join(' ');
  const confidPts    = history.map((h, i) => `${xOf(i)},${yOf(h.confidenceIndex)}`).join(' ');

  // Fill polygon under predicted score line
  const fillPts = `${PAD.l},${PAD.t + innerH} ` + predPts + ` ${xOf(n - 1)},${PAD.t + innerH}`;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {/* Grid lines */}
      {yLabels.map(v => (
        <g key={v}>
          <line
            x1={PAD.l} y1={yOf(v)} x2={PAD.l + innerW} y2={yOf(v)}
            stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="3 3"
          />
          <text x={PAD.l - 6} y={yOf(v)} textAnchor="end" dominantBaseline="central"
            style={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'inherit' }}>
            {v}%
          </text>
        </g>
      ))}

      {/* Fill area under prediction line */}
      <polygon points={fillPts} fill="#6366f1" opacity={0.08}/>

      {/* Stress line */}
      <polyline points={stressPts} fill="none" stroke="#ef4444"
        strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6}/>

      {/* Confidence line */}
      <polyline points={confidPts} fill="none" stroke="#10b981"
        strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6}/>

      {/* Predicted score line */}
      <polyline points={predPts} fill="none" stroke="#6366f1" strokeWidth={2.5}/>

      {/* X-axis date labels */}
      {history.map((h, i) => {
        const x = xOf(i);
        const date = new Date(h.recordedAt);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        return (
          <text key={i} x={x} y={H - 8} textAnchor="middle"
            style={{ fontSize: 9, fill: '#9ca3af', fontFamily: 'inherit' }}>
            {label}
          </text>
        );
      })}

      {/* Hover dots + invisible hit areas */}
      {history.map((h, i) => {
        const x  = xOf(i);
        const y  = yOf(h.predictedScore);
        const isActive = activeIdx === i;
        return (
          <g key={i}>
            {/* Hit area */}
            <rect
              x={x - 16} y={PAD.t} width={32} height={innerH}
              fill="transparent" style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
            />
            {/* Dot */}
            <circle cx={x} cy={y} r={isActive ? 6 : 4}
              fill={isActive ? '#6366f1' : '#fff'}
              stroke="#6366f1" strokeWidth={2}
              style={{ transition: 'r 0.15s, fill 0.15s', pointerEvents: 'none' }}
            />
            {/* Vertical hover line */}
            {isActive && (
              <line x1={x} y1={PAD.t} x2={x} y2={PAD.t + innerH}
                stroke="#6366f1" strokeWidth={1} strokeDasharray="3 3" opacity={0.4}/>
            )}
          </g>
        );
      })}

      {/* Risk colour dots on x-axis */}
      {history.map((h, i) => (
        <circle key={`risk-${i}`}
          cx={xOf(i)} cy={H - 26} r={3}
          fill={RISK_COLOR[h.riskLevel] || '#9ca3af'}
        />
      ))}
    </svg>
  );
}

// ── Tooltip card for hovered data point ──────────────────────────────────────
function HoverCard({ entry }) {
  if (!entry) return (
    <div style={{ height: 130, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#d1d5db', fontSize: 12 }}>
      Hover a point on the chart to see details
    </div>
  );

  const date = new Date(entry.recordedAt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{date}</span>
          <span style={{ fontSize: 11, color: '#d1d5db', margin: '0 6px' }}>·</span>
          <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>
            v{entry.version} · {entry.trigger?.replace('_', ' ')}
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          background: RISK_COLOR[entry.riskLevel] + '20',
          color: RISK_COLOR[entry.riskLevel]
        }}>
          {entry.riskLevel} risk
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Pill label="Predicted"   value={`${entry.predictedScore ?? '—'}%`} color="#6366f1"/>
        <Pill label="Stress"      value={`${entry.stressIndex}%`}           color="#ef4444"/>
        <Pill label="Confidence"  value={`${entry.confidenceIndex}%`}       color="#10b981"/>
        <Pill label="Avg score"   value={`${entry.avgQuizScore}%`}          color="#f59e0b"/>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          Emotion: <strong style={{ color: '#374151', textTransform: 'capitalize' }}>
            {entry.dominantEmotion}
          </strong>
        </span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          Trend:{' '}
          <strong style={{ color: TREND_COLOR[entry.scoretrend] }}>
            {TREND_ICON[entry.scoretrend]} {entry.scoretrend}
          </strong>
        </span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          Cluster: <strong style={{ color: CLUSTER_COLOR[entry.clusterLabel] }}>
            {(entry.clusterLabel || '').replace(/-/g, ' ')}
          </strong>
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20,
          background: READINESS_COLOR[entry.readinessLabel] + '20',
          color: READINESS_COLOR[entry.readinessLabel]
        }}>
          {(entry.readinessLabel || '').replace(/-/g, ' ')}
        </span>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export default function ExamReadinessTimeline({ studentId, studentName }) {
  const [history,   setHistory]   = useState([]);
  const [current,   setCurrent]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const [series,    setSeries]    = useState({
    predicted: true, stress: true, confidence: true
  });

  const authHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    axios.get(`${API}/api/predictions/history/${studentId}`, { headers: authHeader })
      .then(res => {
        setHistory(res.data.history || []);
        setCurrent(res.data.current || null);
      })
      .catch(() => setError('Failed to load timeline'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const activeEntry = activeIdx !== null ? history[activeIdx] : null;

  // Summary stats
  const first = history[0];
  const last  = history[history.length - 1];
  const delta = (first && last && first.predictedScore != null && last.predictedScore != null)
    ? last.predictedScore - first.predictedScore : null;

  if (loading) return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
      Loading timeline…
    </div>
  );
  if (error) return (
    <div style={{ padding: '12px 0', color: '#ef4444', fontSize: 13 }}>{error}</div>
  );
  if (history.length === 0) return (
    <div style={{ padding: '16px', background: '#fafafa', borderRadius: 10,
      textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
      No history yet — timeline builds automatically after each quiz submission.
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            Exam readiness timeline
            {studentName && <span style={{ fontWeight: 400, color: '#6b7280' }}> — {studentName}</span>}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
            {history.length} snapshot{history.length !== 1 ? 's' : ''} recorded
          </div>
        </div>

        {/* Delta badge */}
        {delta !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: delta >= 0 ? '#d1fae5' : '#fee2e2',
            color: delta >= 0 ? '#065f46' : '#7f1d1d'
          }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
            </span>
            <span style={{ fontSize: 11 }}>overall change</span>
          </div>
        )}
      </div>

      {/* ── Summary pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {first && (
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 12px',
            fontSize: 11, color: '#6b7280' }}>
            Started: <strong style={{ color: '#374151' }}>{first.predictedScore}%</strong>
            <span style={{ margin: '0 4px', color: '#d1d5db' }}>·</span>
            {new Date(first.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {last && history.length > 1 && (
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 12px',
            fontSize: 11, color: '#6b7280' }}>
            Latest: <strong style={{ color: '#374151' }}>{last.predictedScore}%</strong>
            <span style={{ margin: '0 4px', color: '#d1d5db' }}>·</span>
            {new Date(last.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 12px',
          fontSize: 11, color: '#6b7280' }}>
          Quizzes: <strong style={{ color: '#374151' }}>{last?.totalQuizzesTaken ?? 0}</strong>
        </div>
      </div>

      {/* ── Legend / series toggles ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'predicted',  label: 'Predicted score', color: '#6366f1', dash: false },
          { key: 'stress',     label: 'Stress index',    color: '#ef4444', dash: true  },
          { key: 'confidence', label: 'Confidence',      color: '#10b981', dash: true  }
        ].map(s => (
          <button key={s.key} onClick={() => setSeries(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
              opacity: series[s.key] ? 1 : 0.35, transition: 'opacity 0.2s'
            }}>
            <svg width={24} height={10}>
              <line x1={0} y1={5} x2={24} y2={5}
                stroke={s.color} strokeWidth={2}
                strokeDasharray={s.dash ? '4 3' : 'none'}/>
              {!s.dash && <circle cx={12} cy={5} r={3} fill={s.color}/>}
            </svg>
            <span style={{ fontSize: 11, color: '#374151' }}>{s.label}</span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>risk dots:</span>
          {['low', 'medium', 'high'].map(r => (
            <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 10, color: '#9ca3af' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: RISK_COLOR[r], display: 'inline-block' }}/>
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ background: '#fafafa', borderRadius: 12, padding: '12px 8px 0',
        border: '1px solid #f3f4f6' }}>
        <TimelineChart
          history={history}
          activeIdx={activeIdx}
          onHover={setActiveIdx}
        />
      </div>

      {/* ── Hover detail card ── */}
      <div style={{ marginTop: 10, background: '#fff', borderRadius: 10,
        border: '1px solid #f3f4f6', minHeight: 130 }}>
        <HoverCard entry={activeEntry}/>
      </div>

      {/* ── History table ── */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          All snapshots
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Date', 'Predicted', 'Stress', 'Confidence', 'Avg quiz', 'Emotion', 'Trend', 'Risk', 'Trigger'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left',
                    fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb',
                    whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h, i) => (
                <tr key={i}
                  onMouseEnter={() => setActiveIdx(history.length - 1 - i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  style={{
                    background: activeIdx === (history.length - 1 - i) ? '#f0f0ff' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.1s'
                  }}>
                  <td style={{ padding: '7px 10px', color: '#374151', whiteSpace: 'nowrap',
                    borderBottom: '1px solid #f3f4f6' }}>
                    {new Date(h.recordedAt).toLocaleDateString('en-US',
                      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '7px 10px', fontWeight: 700,
                    color: '#6366f1', borderBottom: '1px solid #f3f4f6' }}>
                    {h.predictedScore != null ? `${h.predictedScore}%` : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#ef4444',
                    borderBottom: '1px solid #f3f4f6' }}>{h.stressIndex}%</td>
                  <td style={{ padding: '7px 10px', color: '#10b981',
                    borderBottom: '1px solid #f3f4f6' }}>{h.confidenceIndex}%</td>
                  <td style={{ padding: '7px 10px', color: '#374151',
                    borderBottom: '1px solid #f3f4f6' }}>{h.avgQuizScore}%</td>
                  <td style={{ padding: '7px 10px', color: '#374151',
                    textTransform: 'capitalize', borderBottom: '1px solid #f3f4f6' }}>
                    {h.dominantEmotion}
                  </td>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid #f3f4f6',
                    color: TREND_COLOR[h.scoretrend], fontWeight: 600 }}>
                    {TREND_ICON[h.scoretrend]} {h.scoretrend}
                  </td>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: RISK_COLOR[h.riskLevel] + '20',
                      color: RISK_COLOR[h.riskLevel]
                    }}>{h.riskLevel}</span>
                  </td>
                  <td style={{ padding: '7px 10px', color: '#9ca3af',
                    borderBottom: '1px solid #f3f4f6', textTransform: 'capitalize' }}>
                    {(h.trigger || '').replace(/_/g, ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}