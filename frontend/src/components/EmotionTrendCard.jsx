import React, { useMemo } from "react";
import { useEmotionHistory } from "../hooks/useLearningPath";

function Sparkline({ data, color, height = 44, width = 130 }) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height}>
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#E8E6DF"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pad = 4;

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 14px",
        background: "#F9F8F5",
        borderRadius: 8,
        border: "1px solid #E8E6DF",
        minWidth: 72,
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: color || "#2C2C2A",
          lineHeight: 1.2,
        }}
      >
        {typeof value === "number" ? Math.round(value) : value}%
      </span>
      <span style={{ fontSize: 10, color: "#B4B2A9", marginTop: 2 }}>{label}</span>
    </div>
  );
}

export default function EmotionTrendCard({ topic, days = 14 }) {
  const { history, loading } = useEmotionHistory(topic, days);

  const { engagementSeries, frustrationSeries, scoreSeries, avgEngagement, avgFrustration, avgScore } =
    useMemo(() => {
      if (!history.length) {
        return {
          engagementSeries: [],
          frustrationSeries: [],
          scoreSeries: [],
          avgEngagement: 0,
          avgFrustration: 0,
          avgScore: 0,
        };
      }
      return {
        engagementSeries: history.map((s) => s.engagementScore),
        frustrationSeries: history.map((s) => s.frustrationScore),
        scoreSeries: history.map((s) => s.scorePercent),
        avgEngagement:
          history.reduce((s, h) => s + h.engagementScore, 0) / history.length,
        avgFrustration:
          history.reduce((s, h) => s + h.frustrationScore, 0) / history.length,
        avgScore:
          history.reduce((s, h) => s + h.scorePercent, 0) / history.length,
      };
    }, [history]);

  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          background: "#fff",
          border: "1px solid #E8E6DF",
          borderRadius: 12,
          color: "#B4B2A9",
          fontSize: 13,
        }}
      >
        Loading trend data...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        background: "#fff",
        border: "1px solid #E8E6DF",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#2C2C2A" }}>
            {topic}
          </h3>
          <span style={{ fontSize: 12, color: "#B4B2A9" }}>
            Last {days} days · {history.length} session{history.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatBadge label="Engagement" value={avgEngagement} color="#1D9E75" />
          <StatBadge label="Frustration" value={avgFrustration} color="#E24B4A" />
          <StatBadge label="Quiz avg" value={avgScore} color="#378ADD" />
        </div>
      </div>

      {/* Sparklines */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Engagement", data: engagementSeries, color: "#1D9E75" },
          { label: "Frustration", data: frustrationSeries, color: "#E24B4A" },
          { label: "Quiz score", data: scoreSeries, color: "#378ADD" },
        ].map(({ label, data, color }) => (
          <div key={label} style={{ flex: 1, minWidth: 130 }}>
            <div
              style={{
                fontSize: 11,
                color: "#888780",
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              {label}
            </div>
            <Sparkline data={data} color={color} />
          </div>
        ))}
      </div>

      {!history.length && (
        <p style={{ fontSize: 12, color: "#B4B2A9", margin: "12px 0 0" }}>
          No sessions recorded for this topic yet.
        </p>
      )}
    </div>
  );
}