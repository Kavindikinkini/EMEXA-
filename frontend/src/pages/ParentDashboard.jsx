import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/auth-pages-images/EMEXA Logo.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const EMOTION_EMOJI = {
  happy: "😊", neutral: "😐", confused: "😕",
  sad: "😢", angry: "😤", fear: "😰", surprised: "😲"
};
const EMOTION_COLOR = {
  happy:    "text-green-700 bg-green-50 border border-green-200",
  neutral:  "text-gray-600  bg-gray-50  border border-gray-200",
  confused: "text-amber-700 bg-amber-50 border border-amber-200",
  sad:      "text-blue-700  bg-blue-50  border border-blue-200",
  angry:    "text-red-700   bg-red-50   border border-red-200",
  fear:     "text-purple-700 bg-purple-50 border border-purple-200",
};
const BURNOUT_COLOR = {
  Low:      "text-emerald-700 bg-emerald-50 border-emerald-200",
  Moderate: "text-amber-700  bg-amber-50  border-amber-200",
  High:     "text-orange-700 bg-orange-50 border-orange-200",
  Critical: "text-red-700    bg-red-50    border-red-200",
};
const TRAFFIC = {
  green:  { dot: "bg-emerald-500", ring: "ring-emerald-200", label: "All Good",       msg: "Your child is doing well this week.", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  yellow: { dot: "bg-amber-400",   ring: "ring-amber-200",   label: "Check In",       msg: "Some stress signals detected. A gentle chat at home would help.", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  red:    { dot: "bg-red-500",     ring: "ring-red-200",     label: "Needs Attention", msg: "High stress detected. Please reach out to the teacher.", badge: "bg-red-50 text-red-700 border-red-200" },
};

const TABS = ["overview", "emotions", "academic", "weekly"];

// ── Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, gradient }) => (
  <div className={`rounded-2xl p-5 ${gradient} relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
    <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300" />
    <div className="absolute -right-1 -bottom-4 w-10 h-10 rounded-full bg-white/10" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-white text-3xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

// ── Avatar ─────────────────────────────────────────────────────────
const Avatar = ({ name, image, size = "md" }) => {
  const sizes = { sm: "w-9 h-9 text-sm", md: "w-12 h-12 text-base", lg: "w-16 h-16 text-xl" };
  return image ? (
    <img src={image} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow`} />
  ) : (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold shadow ring-2 ring-white`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────
const ParentDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [children,      setChildren]      = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [dashboard,     setDashboard]     = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [loadingDash,   setLoadingDash]   = useState(false);
  const [parentName,    setParentName]    = useState("");
  const [activeTab,     setActiveTab]     = useState("overview");
  const [profileImage,  setProfileImage]  = useState(null);
  const [uploadingImg,  setUploadingImg]  = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setParentName(name);
    const savedImg = localStorage.getItem("parentProfileImage");
    if (savedImg) setProfileImage(savedImg);

    if (!token) { navigate("/parent/login"); return; }

    axios.get(`${API_BASE}/api/parent/my-children`, { headers })
      .then(res => {
        setChildren(res.data.children || []);
        if (res.data.children?.length > 0) setSelectedChild(res.data.children[0]);
      })
      .catch(() => navigate("/parent/login"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setLoadingDash(true);
    setDashboard(null);
    setWeeklySummary(null);
    const childId = selectedChild.studentId;
    Promise.all([
      axios.get(`${API_BASE}/api/parent/child/${childId}/dashboard`,     { headers }),
      axios.get(`${API_BASE}/api/parent/child/${childId}/weekly-summary`, { headers }),
    ]).then(([d, w]) => { setDashboard(d.data); setWeeklySummary(w.data); })
      .catch(err => console.error(err))
      .finally(() => setLoadingDash(false));
  }, [selectedChild]);

  const handleLogout = () => {
    ["token","user","userName","userRole","parentProfileImage"].forEach(k => localStorage.removeItem(k));
    navigate("/parent/login");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    setUploadingImg(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setProfileImage(dataUrl);
      localStorage.setItem("parentProfileImage", dataUrl);
      setUploadingImg(false);
      setShowProfile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    localStorage.removeItem("parentProfileImage");
    setShowProfile(false);
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
      <div className="text-center">
        <img src={logo} alt="EMEXA" className="w-16 h-16 object-contain mx-auto mb-4 animate-pulse" />
        <div className="flex gap-1 justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── No children ──────────────────────────────────────────────────
  if (children.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center border border-gray-100">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Children Linked</h2>
        <p className="text-gray-500 text-sm">No student account was linked. Please contact your school administrator.</p>
        <button onClick={handleLogout} className="mt-6 px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-semibold transition">
          Log Out
        </button>
      </div>
    </div>
  );

  const traffic = dashboard ? TRAFFIC[dashboard.emotionalHealth?.trafficLight || "green"] : null;

  return (
    <div className="min-h-screen bg-gray-50/50">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto pl-1 pr-3 h-16 flex items-center justify-between gap-4">

          {/* Logo + Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={logo} alt="EMEXA" className="w-10 h-10 object-contain" />
            <div className="hidden sm:block">
              <p className="text-xs font-black text-teal-700 uppercase tracking-widest leading-none">EMEXA</p>
              <p className="text-xs text-gray-400 leading-none mt-0.5">Parent Portal</p>
            </div>
          </div>

          {/* Child Selector */}
          {children.length > 1 && (
            <select
              value={selectedChild?.studentId}
              onChange={e => setSelectedChild(children.find(c => c.studentId === e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-400 outline-none text-gray-700 font-medium"
            >
              {children.map(c => <option key={c.studentId} value={c.studentId}>{c.studentName}</option>)}
            </select>
          )}

          {/* Right: greeting + avatar + logout */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden md:block text-right">
              <p className="text-xs text-gray-400">Welcome back</p>
              <p className="text-sm font-bold text-gray-800">{parentName}</p>
            </div>

            {/* Profile avatar with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="relative group"
                title="Change profile photo"
              >
                <Avatar name={parentName} image={profileImage} size="sm" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-teal-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>

              {showProfile && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-56 z-50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Profile Photo</p>
                  <div className="flex justify-center mb-4">
                    <Avatar name={parentName} image={profileImage} size="lg" />
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImg}
                    className="w-full py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition mb-2 disabled:opacity-50"
                  >
                    {uploadingImg ? "Uploading..." : "📷 Upload Photo"}
                  </button>
                  {profileImage && (
                    <button
                      onClick={handleRemoveImage}
                      className="w-full py-2 bg-gray-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition border border-red-100"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition border border-transparent hover:border-red-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Child info banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-700 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow shrink-0">
            {selectedChild?.studentName?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-gray-900 truncate">{selectedChild?.studentName}</h2>
            <p className="text-sm text-gray-400 truncate">{selectedChild?.studentEmail}</p>
          </div>
          {traffic && (
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-semibold ${traffic.badge}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${traffic.dot} ring-4 ${traffic.ring} animate-pulse`} />
              <div>
                <p className="font-bold leading-tight">{traffic.label}</p>
                <p className="text-xs font-normal opacity-80 max-w-[200px] hidden sm:block">{traffic.msg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-6 shadow-sm w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize whitespace-nowrap ${
                activeTab === tab
                  ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-200"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab === "weekly" ? "📅 This Week" :
               tab === "overview" ? "📊 Overview" :
               tab === "emotions" ? "💭 Emotions" : "🎓 Academic"}
            </button>
          ))}
        </div>

        {/* Click outside to close profile */}
        {showProfile && <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />}

        {/* Content */}
        {loadingDash ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading data...</p>
            </div>
          </div>
        ) : !dashboard ? (
          <div className="text-center py-32 text-gray-300">
            <span className="text-5xl block mb-3">📭</span>
            <p className="text-sm">No data available yet</p>
          </div>
        ) : (
          <>
            {/* ══ OVERVIEW ══════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Emotional Health" value={`${dashboard.emotionalHealth.score}%`} sub="Last 7 days" icon="💚" gradient="bg-gradient-to-br from-teal-500 to-teal-700" />
                  <StatCard label="Average Score"    value={`${dashboard.academic.averageScore}%`} sub="Last 30 days" icon="📈" gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
                  <StatCard label="Quizzes Taken"    value={dashboard.academic.totalQuizzes}       sub="Last 30 days" icon="📝" gradient="bg-gradient-to-br from-violet-500 to-violet-700" />
                  <StatCard label="Burnout Risk"     value={dashboard.burnout.level}               sub={`Score ${dashboard.burnout.score}/100`} icon="🔥" gradient={dashboard.burnout.level === "Low" ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-orange-500 to-orange-700"} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dominant emotion */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Dominant Emotion This Week</h3>
                    <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-base font-bold ${EMOTION_COLOR[dashboard.emotionalHealth.dominantEmotion] || "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                      <span className="text-3xl">{EMOTION_EMOJI[dashboard.emotionalHealth.dominantEmotion] || "😐"}</span>
                      <span className="capitalize">{dashboard.emotionalHealth.dominantEmotion}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed">Based on webcam emotion detection during quiz sessions.</p>
                  </div>

                  {/* Burnout */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Burnout Risk</h3>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm ${BURNOUT_COLOR[dashboard.burnout.level]}`}>
                      {dashboard.burnout.level === "Low" ? "✅" : dashboard.burnout.level === "Critical" ? "🚨" : "⚠️"} {dashboard.burnout.level} Risk
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>Risk Score</span><span className="font-bold">{dashboard.burnout.score}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${
                            dashboard.burnout.score >= 70 ? "bg-gradient-to-r from-red-400 to-red-600" :
                            dashboard.burnout.score >= 50 ? "bg-gradient-to-r from-orange-400 to-orange-600" :
                            dashboard.burnout.score >= 30 ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                            "bg-gradient-to-r from-emerald-400 to-emerald-600"
                          }`}
                          style={{ width: `${dashboard.burnout.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent attempts */}
                {dashboard.academic.recentAttempts?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-5">Recent Quiz Activity</h3>
                    <div className="space-y-2">
                      {dashboard.academic.recentAttempts.map((a, i) => (
                        <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-xs font-black text-teal-600 group-hover:bg-teal-100 transition">
                              #{i+1}
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                              {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-lg">💡 {a.hintsUsed} hints</span>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                              a.score >= 70 ? "bg-emerald-50 text-emerald-700" :
                              a.score >= 50 ? "bg-amber-50 text-amber-700" :
                              "bg-red-50 text-red-700"
                            }`}>{a.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ EMOTIONS ══════════════════════════════════════ */}
            {activeTab === "emotions" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6">Emotion Distribution — Last 7 Days</h3>
                  <div className="space-y-5">
                    {Object.entries(dashboard.emotionalHealth.emotionDistribution)
                      .filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1])
                      .map(([emotion, pct]) => (
                        <div key={emotion}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <span className="text-lg">{EMOTION_EMOJI[emotion]}</span>
                              <span className="capitalize">{emotion}</span>
                            </span>
                            <span className="text-sm font-black text-gray-700">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-700 ${
                                ["happy","surprised"].includes(emotion) ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                                emotion === "neutral" ? "bg-gradient-to-r from-gray-300 to-gray-400" :
                                ["confused","sad"].includes(emotion) ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                                "bg-gradient-to-r from-red-400 to-red-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Score ring */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-8">Emotional Health Score</h3>
                  <div className="relative w-40 h-40 mx-auto mb-6">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={dashboard.emotionalHealth.score >= 70 ? "#10B981" : dashboard.emotionalHealth.score >= 40 ? "#F59E0B" : "#EF4444"}
                        strokeWidth="3.5"
                        strokeDasharray={`${dashboard.emotionalHealth.score} 100`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-gray-800">{dashboard.emotionalHealth.score}</span>
                      <span className="text-xs text-gray-400 font-medium">/100</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    {dashboard.emotionalHealth.score >= 70 ? "🌟 Your child is emotionally healthy and engaged." :
                     dashboard.emotionalHealth.score >= 40 ? "💛 Some stress detected. A check-in would help." :
                     "🆘 High stress. Please reach out to the teacher."}
                  </p>
                </div>
              </div>
            )}

            {/* ══ ACADEMIC ══════════════════════════════════════ */}
            {activeTab === "academic" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Average Score" value={`${dashboard.academic.averageScore}%`} sub="Last 30 days" icon="📊" gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
                  <StatCard label="Total Quizzes"  value={dashboard.academic.totalQuizzes}        sub="Last 30 days" icon="📝" gradient="bg-gradient-to-br from-violet-500 to-violet-700" />
                </div>

                {dashboard.academic.weeklyTrend?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6">Score Trend — Last 7 Quizzes</h3>
                    <div className="flex items-end gap-3" style={{ height: "160px" }}>
                      {dashboard.academic.weeklyTrend.map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                          <span className="text-xs font-black text-gray-500 group-hover:text-gray-800 transition">{item.score}%</span>
                          <div
                            className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-90 cursor-default ${
                              item.score >= 70 ? "bg-gradient-to-t from-emerald-600 to-emerald-400" :
                              item.score >= 50 ? "bg-gradient-to-t from-amber-600 to-amber-400" :
                              "bg-gradient-to-t from-red-600 to-red-400"
                            }`}
                            style={{ height: `${Math.max(item.score, 6)}%` }}
                          />
                          <span className="text-xs text-gray-300 font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-50">
                      {[["bg-emerald-400","≥70% Good"],["bg-amber-400","≥50% OK"],["bg-red-400","<50% Needs Help"]].map(([cls,lbl]) => (
                        <span key={lbl} className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className={`w-2.5 h-2.5 rounded-sm ${cls}`} />{lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dashboard.academic.totalQuizzes === 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 text-center">
                    <span className="text-3xl block mb-2">📭</span>
                    <p className="text-amber-800 font-bold">No quiz activity in the last 30 days.</p>
                    <p className="text-amber-600 text-sm mt-1">Encourage your child to log in and take a quiz!</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ WEEKLY ════════════════════════════════════════ */}
            {activeTab === "weekly" && weeklySummary && (
              <div className="space-y-5">
                {/* AI Summary */}
                <div className="bg-gradient-to-br from-teal-600 via-teal-600 to-teal-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-teal-200">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 text-xl backdrop-blur-sm">✨</div>
                    <div>
                      <p className="font-black text-base mb-1.5">This Week's AI Summary</p>
                      <p className="text-sm text-white/85 leading-relaxed">{weeklySummary.aiSummary}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Dominant Emotion" value={EMOTION_EMOJI[weeklySummary.dominantEmotion] || "😐"} sub={weeklySummary.dominantEmotion} icon="" gradient="bg-gradient-to-br from-teal-500 to-teal-700" />
                  <StatCard label="Calm Rate"   value={`${weeklySummary.calmRate}%`}     sub="Happy + Neutral" icon="😌" gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
                  <StatCard label="Avg Score"   value={`${weeklySummary.averageScore}%`} sub="This week"       icon="🎯" gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
                  <StatCard label="Quizzes"     value={weeklySummary.totalQuizzes}       sub="This week"       icon="📋" gradient="bg-gradient-to-br from-violet-500 to-violet-700" />
                </div>

                {/* Conversation starter */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl shrink-0">💬</span>
                    <div>
                      <p className="font-black text-amber-900 mb-1.5">Conversation Starter</p>
                      <p className="text-amber-800 text-sm leading-relaxed">{weeklySummary.conversationStarter}</p>
                    </div>
                  </div>
                </div>

                {/* Traffic status */}
                <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
                  weeklySummary.trafficLight === "green"  ? "bg-emerald-50 border-emerald-100" :
                  weeklySummary.trafficLight === "yellow" ? "bg-amber-50 border-amber-100" :
                  "bg-red-50 border-red-100"
                }`}>
                  <div className={`w-4 h-4 rounded-full shrink-0 ring-4 animate-pulse ${TRAFFIC[weeklySummary.trafficLight]?.dot} ${TRAFFIC[weeklySummary.trafficLight]?.ring}`} />
                  <div>
                    <p className="font-black text-gray-900">{TRAFFIC[weeklySummary.trafficLight]?.label}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{TRAFFIC[weeklySummary.trafficLight]?.msg}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;