import React from "react";

const STATUS_CONFIG = {
  needs_attention: {
    label: "Needs Attention",
    bg: "#FCEBEB",
    color: "#A32D2D",
    border: "#F09595",
    dot: "#E24B4A",
  },
  progressing: {
    label: "Progressing",
    bg: "#FAEEDA",
    color: "#633806",
    border: "#EF9F27",
    dot: "#BA7517",
  },
  strong: {
    label: "Strong",
    bg: "#EAF3DE",
    color: "#27500A",
    border: "#97C459",
    dot: "#639922",
  },
  not_started: {
    label: "Not Started",
    bg: "#F1EFE8",
    color: "#444441",
    border: "#B4B2A9",
    dot: "#888780",
  },
};

const TIME_ICONS = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌇",
  night: "🌙",
  unknown: "",
};

function MiniBar({ value, color, label }) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#888780",
          marginBottom: 3,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 500 }}>{value}%</span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 99,
          background: "#E8E6DF",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(value, 100)}%`,
            height: "100%",
            background: color,
            borderRadius: 99,
            transition: "width 0.7s ease",
          }}
        />
      </div>
    </div>
  );
}

function TopicCard({ topic, rank }) {
  const cfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG.not_started;

  const daysSince =
    topic.lastStudied
      ? Math.floor((Date.now() - new Date(topic.lastStudied)) / 86400000)
      : null;

  const lastStudiedLabel =
    daysSince === null
      ? "Never"
      : daysSince === 0
      ? "Today"
      : daysSince === 1
      ? "Yesterday"
      : `${daysSince}d ago`;

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 18px",
        background: "#fff",
        border: "1px solid #E8E6DF",
        borderLeft: `4px solid ${cfg.dot}`,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: "flex-start",
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          flexShrink: 0,
          background: rank <= 3 ? "#FAEEDA" : "#F1EFE8",
          color: rank <= 3 ? "#854F0B" : "#5F5E5A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        #{rank}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15, color: "#2C2C2A" }}>
            {topic.topic}
          </span>
          <span
            style={{
              fontSize: 11,
              padding: "2px 9px",
              borderRadius: 99,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              fontWeight: 500,
            }}
          >
            {cfg.label}
          </span>
          {topic.subject && topic.subject !== "General" && (
            <span style={{ fontSize: 11, color: "#888780" }}>{topic.subject}</span>
          )}
        </div>

        {/* Bars */}
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          <MiniBar value={topic.avgEngagement} color="#1D9E75" label="Engagement" />
          <MiniBar value={topic.avgFrustration} color="#E24B4A" label="Frustration" />
          <MiniBar value={topic.avgScore} color="#378ADD" label="Quiz avg" />
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            fontSize: 11,
            color: "#888780",
          }}
        >
          <span>{topic.sessionCount} session{topic.sessionCount !== 1 ? "s" : ""}</span>
          <span>Last studied: {lastStudiedLabel}</span>
          {topic.bestTimeOfDay && topic.bestTimeOfDay !== "unknown" && (
            <span>
              {TIME_ICONS[topic.bestTimeOfDay]} Best: {topic.bestTimeOfDay}
            </span>
          )}
        </div>
      </div>

      {/* Priority score */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: 52,
        }}
      >
        <span style={{ fontSize: 10, color: "#B4B2A9", marginBottom: 2 }}>
          priority
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color:
              topic.priorityScore >= 70
                ? "#A32D2D"
                : topic.priorityScore >= 40
                ? "#854F0B"
                : "#3B6D11",
          }}
        >
          {topic.priorityScore}
        </span>
      </div>
    </div>
  );
}

export default function PathTimeline({ topics = [], loading }) {
  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#888780",
          fontSize: 14,
        }}
      >
        Building your learning path...
      </div>
    );
  }

  if (!topics.length) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#888780",
          fontSize: 14,
          background: "#F1EFE8",
          borderRadius: 12,
        }}
      >
        No data yet. Complete a quiz to generate your personalized learning path.
      </div>
    );
  }

  return (
    <div>
      {topics.map((topic, i) => (
        <TopicCard key={topic.topic} topic={topic} rank={i + 1} />
      ))}
    </div>
  );
}