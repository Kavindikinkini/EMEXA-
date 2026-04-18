import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLearningPath, useBestStudyTime } from "../hooks/useLearningPath";
import PathTimeline from "../components/PathTimeline";
import EmotionTrendCard from "../components/EmotionTrendCard";
import Sidebar from "../components/sidebarorigin";
import Header from "../components/headerorigin";

const BURNOUT_CONFIG = {
  low:      { label: "Low",      color: "#3B6D11", bg: "#EAF3DE", border: "#97C459" },
  moderate: { label: "Moderate", color: "#633806", bg: "#FAEEDA", border: "#EF9F27" },
  high:     { label: "High",     color: "#791F1F", bg: "#FCEBEB", border: "#F09595" },
};

function StatCard({ title, value, sub, color }) {
  return (
    <div style={{ flex: 1, minWidth: 140, padding: "18px 20px", background: "#fff",
      border: "1px solid #E8E6DF", borderRadius: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: "#888780", marginBottom: 6 }}>{title}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: color || "#2C2C2A", lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#B4B2A9" }}>{sub}</p>}
    </div>
  );
}

function BurnoutBadge({ level }) {
  const cfg = BURNOUT_CONFIG[level] || BURNOUT_CONFIG.low;
  return (
    <span style={{ padding: "4px 12px", borderRadius: 99, background: cfg.bg,
      color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 12, fontWeight: 600 }}>
      Burnout risk: {cfg.label}
    </span>
  );
}

export default function LearningPathPage() {
  const navigate = useNavigate();
  const { path, loading, error, rebuild } = useLearningPath();
  const bestTime = useBestStudyTime();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("learning-path");

  const handleRebuild = async () => {
    setRebuilding(true);
    await rebuild();
    setRebuilding(false);
  };

  const topicsForTrend = path?.topics?.slice(0, 5) || [];

  // Get user info for Header
  const userName = localStorage.getItem("userName") || "Student";

  return (
    <div className="min-h-screen bg-white">
      <Header userName={userName} userRole="student" />
      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
      />

      {/* Main content — offset for sidebar and header */}
      <div className="ml-52 pt-14">
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>

          {/* ── Page header ── */}
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#2C2C2A" }}>
                Adaptive Learning Path
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#888780" }}>
                Personalized study order based on your emotional patterns
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {path && <BurnoutBadge level={path.burnoutRisk} />}
              <button
                onClick={handleRebuild}
                disabled={rebuilding}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E8E6DF",
                  background: rebuilding ? "#F1EFE8" : "#fff", color: "#444441",
                  fontSize: 13, cursor: rebuilding ? "not-allowed" : "pointer", fontWeight: 500 }}
              >
                {rebuilding ? "Rebuilding..." : "Refresh Path"}
              </button>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div style={{ padding: 16, background: "#FCEBEB", border: "1px solid #F09595",
              borderRadius: 10, color: "#791F1F", marginBottom: 20, fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* ── Loading state ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: 60, color: "#888780", fontSize: 14 }}>
              Building your learning path...
            </div>
          )}

          {/* ── No data yet ── */}
          {!loading && !path?.topics?.length && !error && (
            <div style={{ textAlign: "center", padding: 60, background: "#F1EFE8",
              borderRadius: 12, color: "#888780", fontSize: 14 }}>
              Complete a quiz to generate your personalized learning path.
            </div>
          )}

          {/* ── Summary stat cards ── */}
          {path && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
              <StatCard title="Overall engagement" value={`${path.overallEngagement}%`} color="#1D9E75" />
              <StatCard
                title="Overall frustration"
                value={`${path.overallFrustration}%`}
                color={path.overallFrustration > 60 ? "#A32D2D" : "#888780"}
              />
              <StatCard
                title="Study streak"
                value={path.currentStreak}
                sub={`Best: ${path.longestStreak} days`}
                color="#534AB7"
              />
              <StatCard
                title="Recommended daily"
                value={`${path.recommendedDailyMinutes} min`}
                sub={path.burnoutRisk === "high" ? "Take it easy today"
                  : path.burnoutRisk === "moderate" ? "Steady pace"
                  : "You're doing great"}
              />
              {bestTime && (
                <StatCard
                  title="Best study time"
                  value={bestTime.bestTimeOfDay}
                  sub={`Avg engagement: ${Math.round(bestTime.avgEngagement)}%`}
                  color="#185FA5"
                />
              )}
            </div>
          )}

          {/* ── Two-column layout ── */}
          {path?.topics?.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px",
              gap: 20, alignItems: "flex-start" }}>

              {/* Left: topic priority list */}
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#2C2C2A", margin: "0 0 14px" }}>
                  Study Order
                </h2>
                <PathTimeline topics={path.topics} loading={false} />
              </div>

              {/* Right: emotion trend charts */}
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#2C2C2A", margin: "0 0 14px" }}>
                  Emotion Trend
                </h2>

                {/* Topic filter pills */}
                {topicsForTrend.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {topicsForTrend.map((t) => (
                      <button
                        key={t.topic}
                        onClick={() => setSelectedTopic(selectedTopic === t.topic ? null : t.topic)}
                        style={{
                          padding: "4px 10px", borderRadius: 99, fontSize: 12,
                          fontWeight: 500, cursor: "pointer", border: "1px solid",
                          borderColor: selectedTopic === t.topic ? "#534AB7" : "#E8E6DF",
                          background: selectedTopic === t.topic ? "#EEEDFE" : "#fff",
                          color: selectedTopic === t.topic ? "#3C3489" : "#5F5E5A",
                          transition: "all 0.15s",
                        }}
                      >
                        {t.topic}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(selectedTopic
                    ? topicsForTrend.filter((t) => t.topic === selectedTopic)
                    : topicsForTrend.slice(0, 3)
                  ).map((t) => (
                    <EmotionTrendCard key={t.topic} topic={t.topic} days={14} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── High burnout warning banner ── */}
          {path?.burnoutRisk === "high" && (
            <div style={{ marginTop: 28, padding: "16px 20px", background: "#FAEEDA",
              border: "1px solid #EF9F27", borderRadius: 12, display: "flex",
              gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#633806" }}>
                  High frustration detected across your topics
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#854F0B" }}>
                  Limit study to {path.recommendedDailyMinutes} minutes today and take
                  regular 5-minute breaks.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}