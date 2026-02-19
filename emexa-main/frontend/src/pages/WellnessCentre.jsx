import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, TrendingUp, MessageCircle, Brain, Heart, Target, Zap, Plus, Check, Trash2 } from 'lucide-react';
import Header from "../components/headerorigin";
import Sidebar from "../components/sidebarorigin";

const WellnessCentre = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("wellness");
  const [selectedMood, setSelectedMood] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [userName, setUserName] = useState("Student");
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [dailyTip, setDailyTip] = useState("Loading your daily wellness tip...");
  const [moodHistory, setMoodHistory] = useState([]);
  const [weeklyInsights, setWeeklyInsights] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [activeTab, setActiveTab] = useState("mood");
  const [analyzingPattern, setAnalyzingPattern] = useState(false);
  const [todayMood, setTodayMood] = useState(null);

  // Wellness Goals States
  const [goals, setGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("mental-health");
  const [generatingGoal, setGeneratingGoal] = useState(false);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName") || sessionStorage.getItem("userName");
    setUserName(storedUserName || "Student");
    
    fetchDailyTip();
    loadMoodHistory();
    loadTodayMood();
    loadGoals();
  }, []);

  const loadTodayMood = async () => {
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (!token) return;

    const response = await fetch('http://localhost:5000/api/moods/today', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      setTodayMood(data.data);
      console.log('📅 Today\'s mood loaded:', data.data.mood);
    } else {
      setTodayMood(null);
    }
  } catch (error) {
    console.error('❌ Error loading today\'s mood:', error);
    setTodayMood(null);
  }
};

  const loadGoals = () => {
    const savedGoals = localStorage.getItem('wellnessGoals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      setGoals([
        {
          id: 1,
          title: "Meditate for 5 minutes daily",
          category: "mental-health",
          progress: [false, true, false, true, false, false, false],
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Take study breaks every hour",
          category: "study-life",
          progress: [true, true, false, false, false, false, false],
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  const saveGoals = (updatedGoals) => {
    setGoals(updatedGoals);
    localStorage.setItem('wellnessGoals', JSON.stringify(updatedGoals));
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;

    const newGoal = {
      id: Date.now(),
      title: newGoalTitle,
      category: newGoalCategory,
      progress: [false, false, false, false, false, false, false],
      createdAt: new Date().toISOString()
    };

    const updatedGoals = [...goals, newGoal];
    saveGoals(updatedGoals);
    setNewGoalTitle("");
    setShowAddGoal(false);
  };

  const generateAIGoal = async () => {
    setGeneratingGoal(true);
    
    setTimeout(() => {
      const aiGoals = [
        "Practice gratitude journaling for 10 minutes",
        "Go for a 15-minute walk outside",
        "Drink 8 glasses of water daily",
        "Get 7-8 hours of sleep each night",
        "Connect with a friend or family member",
        "Practice deep breathing for 3 minutes",
        "Limit social media to 1 hour per day",
        "Read for pleasure for 20 minutes",
        "Stretch or do yoga for 10 minutes",
        "Eat a healthy breakfast every morning"
      ];
      
      const randomGoal = aiGoals[Math.floor(Math.random() * aiGoals.length)];
      setNewGoalTitle(randomGoal);
      setGeneratingGoal(false);
    }, 1500);
  };

  const toggleGoalDay = (goalId, dayIndex) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newProgress = [...goal.progress];
        newProgress[dayIndex] = !newProgress[dayIndex];
        return { ...goal, progress: newProgress };
      }
      return goal;
    });
    saveGoals(updatedGoals);
  };

  const deleteGoal = (goalId) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
  };

  const calculateProgress = (progress) => {
    const completed = progress.filter(day => day).length;
    return Math.round((completed / 7) * 100);
  };

  const categoryColors = {
    "mental-health": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    "physical": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    "study-life": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    "sleep": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
    "nutrition": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "social": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" }
  };

  const fetchDailyTip = () => {
    setDailyTip("Loading...");
    setTimeout(() => {
      const tips = [
        "Small steps every day lead to big changes over time. Be patient with yourself.",
        "Take a 5-minute break every hour to stretch and breathe deeply.",
        "Celebrate your progress, no matter how small. You're doing great!",
        "Remember: it's okay to ask for help. Reaching out is a sign of strength.",
        "Practice the 5-4-3-2-1 grounding technique when you feel overwhelmed."
      ];
      setDailyTip(tips[Math.floor(Math.random() * tips.length)]);
    }, 1000);
  };

  const loadMoodHistory = async () => {
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (!token) {
      console.warn('No token found, using demo data');
      setMoodHistory([
        { date: "Mon", mood: "Happy", emoji: "😊", value: 4 },
        { date: "Tue", mood: "Neutral", emoji: "🙂", value: 3 },
        { date: "Wed", mood: "Happy", emoji: "😊", value: 4 },
        { date: "Thu", mood: "Very Happy", emoji: "😄", value: 5 },
        { date: "Fri", mood: "Happy", emoji: "😊", value: 4 },
        { date: "Sat", mood: "Sad", emoji: "😐", value: 2 },
        { date: "Sun", mood: "Neutral", emoji: "🙂", value: 3 }
      ]);
      return;
    }

    const response = await fetch('http://localhost:5000/api/moods/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      // CHANGED: Show ALL 7 days including empty ones
      setMoodHistory(data.data); // This includes days with value: 0
      console.log('✅ Loaded mood history from database:', data.data.length, 'days');
    } else {
      // API returned no data, use demo
      console.log('📊 No mood history, showing demo data');
      setMoodHistory([
        { date: "Mon", mood: "Happy", emoji: "😊", value: 4 },
        { date: "Tue", mood: "Neutral", emoji: "🙂", value: 3 },
        { date: "Wed", mood: "Happy", emoji: "😊", value: 4 },
        { date: "Thu", mood: "Very Happy", emoji: "😄", value: 5 },
        { date: "Fri", mood: "Happy", emoji: "😊", value: 4 },
        { date: "Sat", mood: "Sad", emoji: "😐", value: 2 },
        { date: "Sun", mood: "Neutral", emoji: "🙂", value: 3 }
      ]);
    }
  } catch (error) {
    console.error('❌ Error loading mood history:', error);
    // Use demo data on error
    setMoodHistory([
      { date: "Mon", mood: "Happy", emoji: "😊", value: 4 },
      { date: "Tue", mood: "Neutral", emoji: "🙂", value: 3 },
      { date: "Wed", mood: "Happy", emoji: "😊", value: 4 },
      { date: "Thu", mood: "Very Happy", emoji: "😄", value: 5 },
      { date: "Fri", mood: "Happy", emoji: "😊", value: 4 },
      { date: "Sat", mood: "Sad", emoji: "😐", value: 2 },
      { date: "Sun", mood: "Neutral", emoji: "🙂", value: 3 }
    ]);
  }
};


  const analyzeWeeklyPattern = async () => {
  if (moodHistory.length === 0) {
    alert("No mood history available to analyze");
    return;
  }
  
  setAnalyzingPattern(true);
  setWeeklyInsights(null);
  
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (token) {
      // Get weekly summary from backend
      const response = await fetch('http://localhost:5000/api/moods/weekly-summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.data.totalEntries > 0) {
        const summary = data.data;
        
        setWeeklyInsights({
          trend: summary.trend,
          message: `You've logged ${summary.totalEntries} mood entries this week! Your average mood is ${summary.averageMood.toFixed(1)}/5.0. You had ${summary.positiveDays} positive days, ${summary.neutralDays} neutral days, and ${summary.negativeDays} challenging days.`,
          suggestion: summary.trend === 'positive' 
            ? "Keep up the good work! Your positive momentum is strong." 
            : summary.trend === 'neutral'
            ? "Your moods are balanced. Try incorporating more activities that bring you joy."
            : "I notice you've had some challenging days. Remember, it's okay to ask for support.",
          strength: summary.mostCommonMood 
            ? `Your most common mood this week was "${summary.mostCommonMood}". ${summary.trend === 'positive' ? 'Your resilience is showing!' : 'Remember to be kind to yourself.'}`
            : "Keep tracking your moods to identify patterns."
        });
      } else {
        // Fallback to client-side analysis
        const positiveMoods = moodHistory.filter(m => 
          m.mood === "Happy" || m.mood === "Very Happy"
        ).length;
        
        setWeeklyInsights({
          trend: positiveMoods >= 4 ? "positive" : "neutral",
          message: `You've had mostly ${positiveMoods >= 4 ? 'positive' : 'balanced'} moods this week! Your emotional wellbeing shows a ${positiveMoods >= 4 ? 'healthy' : 'steady'} pattern with ${positiveMoods} out of ${moodHistory.length} days being happy or very happy.`,
          suggestion: "Keep up the good work! To maintain this positive trend, try to identify what made you happy on those days and do more of it.",
          strength: "Your resilience is showing - even on tougher days, you bounced back quickly."
        });
      }
    }
  } catch (error) {
    console.error('❌ Error analyzing patterns:', error);
    
    // Fallback analysis
    const positiveMoods = moodHistory.filter(m => 
      m.mood === "Happy" || m.mood === "Very Happy"
    ).length;
    
    setWeeklyInsights({
      trend: positiveMoods >= 4 ? "positive" : "neutral",
      message: `You've had mostly positive moods this week! Your emotional wellbeing shows a healthy pattern with ${positiveMoods} out of ${moodHistory.length} days being happy or very happy.`,
      suggestion: "Keep up the good work! To maintain this positive trend, try to identify what made you happy on those days and do more of it.",
      strength: "Your resilience is showing - even on tougher days, you bounced back quickly."
    });
  } finally {
    setAnalyzingPattern(false);
  }
};

  const moods = [
    { emoji: "😢", label: "Very Sad", color: "hover:bg-blue-50", bgColor: "bg-blue-50", ringColor: "ring-blue-500", messageColor: "bg-blue-100 text-blue-800 border-blue-300", value: 1 },
    { emoji: "😐", label: "Sad", color: "hover:bg-orange-50", bgColor: "bg-orange-50", ringColor: "ring-orange-500", messageColor: "bg-orange-100 text-orange-800 border-orange-300", value: 2 },
    { emoji: "🙂", label: "Neutral", color: "hover:bg-blue-50", bgColor: "bg-gray-50", ringColor: "ring-gray-500", messageColor: "bg-gray-100 text-gray-800 border-gray-300", value: 3 },
    { emoji: "😊", label: "Happy", color: "hover:bg-green-50", bgColor: "bg-green-50", ringColor: "ring-green-500", messageColor: "bg-green-100 text-green-800 border-green-300", value: 4 },
    { emoji: "😄", label: "Very Happy", color: "hover:bg-purple-50", bgColor: "bg-purple-50", ringColor: "ring-purple-500", messageColor: "bg-purple-100 text-purple-800 border-purple-300", value: 5 },
  ];

  const handleMoodSelect = async (index) => {
  setSelectedMood(index);
  setShowMessage(true);
  setLoadingAI(true);
  setAiAdvice(null);

  const selectedMoodData = moods[index];

  // Save mood to database
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (token) {
      const response = await fetch('http://localhost:5000/api/moods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood: selectedMoodData.label,
          emoji: selectedMoodData.emoji,
          value: selectedMoodData.value
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Mood saved to database:', data.message);
        
        // Reload mood history and today's mood to update chart
        await loadMoodHistory();
        await loadTodayMood(); // ← THIS LINE IS NEW
      } else {
        console.error('❌ Failed to save mood:', data.message);
      }
    } else {
      console.warn('⚠️ No authentication token found');
    }
  } catch (error) {
    console.error('❌ Error saving mood:', error);
  }

  // Generate AI advice
  setTimeout(() => {
    const responses = {
      "Very Sad": "I'm here with you. Remember that difficult feelings pass, and it's brave to acknowledge them. Try taking a few deep breaths, and consider reaching out to someone you trust. You don't have to face this alone.",
      "Sad": "It's okay to feel down sometimes. Be gentle with yourself today. Maybe try doing something small that usually brings you comfort, like listening to your favorite music or taking a short walk.",
      "Neutral": "You're doing okay, and that's perfectly fine! Some days are just steady, and that's part of life's balance. Keep taking care of yourself with small acts of kindness.",
      "Happy": "I'm glad you're feeling good today! This positive energy is wonderful. Keep it going by sharing a smile with someone or doing something you enjoy.",
      "Very Happy": "Your positive energy is contagious! This is wonderful. Take a moment to appreciate what brought you this joy, and remember this feeling when things get tough."
    };
    setAiAdvice(responses[selectedMoodData.label]);
    setLoadingAI(false);
  }, 1500);
};

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput("");
    setLoadingChat(true);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch('http://localhost:5000/api/wellness-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: chatInput,
          history: chatMessages
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = { 
          role: "assistant", 
          content: data.response
        };
        setChatMessages([...newMessages, aiMessage]);
      } else {
        const aiMessage = { 
          role: "assistant", 
          content: "I'm here to support you. Could you tell me more about what you're experiencing?"
        };
        setChatMessages([...newMessages, aiMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const aiMessage = { 
        role: "assistant", 
        content: "I'm having trouble connecting right now, but I'm here for you. How can I help?"
      };
      setChatMessages([...newMessages, aiMessage]);
    } finally {
      setLoadingChat(false);
    }
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const totalCompleted = goals.reduce((sum, goal) => sum + goal.progress.filter(d => d).length, 0);

  return (
    <div className="min-h-screen bg-white">
      <Header userName={userName} />
      <Sidebar 
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
      />

      <div className="ml-52 pt-14 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Wellness Dashboard
            </h1>
            <Sparkles className="text-teal-500" size={32} />
          </div>
          <button
            onClick={() => setShowChatbot(!showChatbot)}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <MessageCircle size={20} />
            AI Coach
          </button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[
            { id: "mood", label: "Mood Tracker", icon: Heart },
            { id: "insights", label: "AI Insights", icon: Brain },
            { id: "goals", label: "Wellness Goals", icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-600 hover:text-teal-600"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "mood" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {todayMood && (
  <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 flex items-center justify-between animate-fade-in">
    <div className="flex items-center gap-3">
      <div className="text-4xl">{todayMood.emoji}</div>
      <div>
        <p className="text-sm font-medium text-gray-600">Your mood today:</p>
        <p className="text-lg font-bold text-gray-800">{todayMood.mood}</p>
        <p className="text-xs text-gray-500">
          Logged at {new Date(todayMood.date).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs text-gray-500 mb-1">Want to update?</p>
      <p className="text-xs text-teal-600 font-medium">Select a new mood below</p>
    </div>
  </div>
)}
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                How are you feeling today?
              </h2>
              <div className="flex justify-center gap-6">
                {moods.map((mood, index) => (
                  <button
                    key={index}
                    onClick={() => handleMoodSelect(index)}
                    className={`flex flex-col items-center p-6 rounded-xl transition-all transform hover:scale-110 ${
                      selectedMood === index
                        ? `${mood.bgColor} ring-4 ${mood.ringColor} scale-110 shadow-xl`
                        : mood.color + " shadow-md"
                    }`}
                  >
                    <span className="text-6xl mb-2">{mood.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{mood.label}</span>
                  </button>
                ))}
              </div>

              {showMessage && selectedMood !== null && (
                <div className={`mt-6 p-6 rounded-xl border-2 ${moods[selectedMood].messageColor} animate-fade-in shadow-lg`}>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{moods[selectedMood].emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-xl">
                          You're feeling {moods[selectedMood].label}
                        </h3>
                        <Sparkles size={20} className="text-teal-600" />
                      </div>
                      
                      {loadingAI ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <RefreshCw className="animate-spin" size={16} />
                          <span>AI is generating personalized advice...</span>
                        </div>
                      ) : (
                        <p className="text-base leading-relaxed">{aiAdvice}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowMessage(false)}
                      className="text-gray-500 hover:text-gray-700 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl shadow-lg p-6 border border-rose-100">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                    <Heart className="text-rose-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Stress Management
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Try deep breathing for 2 minutes to reduce stress
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg p-6 border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                    <Zap className="text-amber-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Energy Boost
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Quick 5-minute movement break to refresh your mind
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Sparkles className="text-white/30" size={40} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Brain size={28} />
                <h3 className="text-2xl font-bold">AI Wellness Tip</h3>
                <button
                  onClick={fetchDailyTip}
                  className="ml-auto p-2 hover:bg-white/20 rounded-xl transition-all"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
              <p className="text-lg leading-relaxed font-medium">
                "{dailyTip}"
              </p>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="text-purple-600" size={28} />
                  Weekly Mood Pattern
                </h2>
                <button
                  onClick={analyzeWeeklyPattern}
                  disabled={analyzingPattern}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {analyzingPattern ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain size={18} />
                      Analyze Pattern
                    </>
                  )}
                </button>
              </div>

            <div className="flex justify-around items-end h-88 mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 pb-5 border border-gray-200">
                {moodHistory.map((day, idx) => {
                  const barHeight = day.value > 0 ? 50 + (day.value * 35) : 30;
    const barColor = day.value > 0 
      ? "bg-gradient-to-t from-teal-300 to-cyan-400 hover:from-teal-400 hover:to-cyan-500" 
      : "bg-gray-200";
    
    return (
      <div key={idx} className="flex flex-col items-center gap-3">
        <div 
          className={`w-16 rounded-t-xl transition-all cursor-pointer shadow-md ${barColor}`}
          style={{ height: `${barHeight}px` }}
          title={day.value > 0 ? `${day.mood} - ${day.date}` : `No mood logged - ${day.date}`}
        />
        <span className="text-3xl">{day.emoji}</span>
        <span className="text-sm font-semibold text-gray-700">{day.date}</span>
      </div>
    );
                })}
              </div>

              {weeklyInsights && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                      <Brain className="text-emerald-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900 mb-3">
                        AI-Generated Insights
                      </h4>
                      <p className="text-gray-800 mb-3 leading-relaxed">
                        {weeklyInsights.message}
                      </p>
                      <div className="bg-white/60 rounded-lg p-4 mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          💡 Suggestion: {weeklyInsights.suggestion}
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700">
                          ⭐ Your Strength: {weeklyInsights.strength}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="text-teal-500" size={32} />
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Your Wellness Goals
                    </h2>
                    <p className="text-sm text-gray-600">Track your daily wellness habits</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddGoal(!showAddGoal)}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Goal
                </button>
              </div>

              {showAddGoal && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border-2 border-cyan-200 animate-fade-in">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Sparkles size={20} className="text-teal-500" />
                    Create New Wellness Goal
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goal Title
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          placeholder="e.g., Meditate for 10 minutes daily"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                        <button
                          onClick={generateAIGoal}
                          disabled={generatingGoal}
                          className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {generatingGoal ? (
                            <RefreshCw className="animate-spin" size={18} />
                          ) : (
                            <Sparkles size={18} />
                          )}
                          AI Suggest
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={newGoalCategory}
                        onChange={(e) => setNewGoalCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="mental-health">Mental Health</option>
                        <option value="physical">Physical Activity</option>
                        <option value="study-life">Study-Life Balance</option>
                        <option value="sleep">Sleep</option>
                        <option value="nutrition">Nutrition</option>
                        <option value="social">Social Connection</option>
                      </select>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowAddGoal(false);
                          setNewGoalTitle("");
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addGoal}
                        disabled={!newGoalTitle.trim()}
                        className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Goal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {goals.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="text-teal-500" size={20} />
                      <span className="text-sm font-medium text-gray-600">Total Goals</span>
                    </div>
                    <p className="text-3xl font-bold text-teal-600">{goals.length}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="text-emerald-600" size={20} />
                      <span className="text-sm font-medium text-gray-600">Total Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">{totalCompleted}</p>
                  </div>

                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="text-sky-600" size={20} />
                      <span className="text-sm font-medium text-gray-600">Avg Progress</span>
                    </div>
                    <p className="text-3xl font-bold text-sky-600">
                      {goals.length > 0 ? Math.round(totalCompleted / (goals.length * 7) * 100) : 0}%
                    </p>
                  </div>
                </div>
              )}

              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map(goal => {
                    const progress = calculateProgress(goal.progress);
                    const colors = categoryColors[goal.category];
                    
                    return (
                      <div key={goal.id} className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 transition-all hover:shadow-lg`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                              {goal.title}
                            </h3>
                            <span className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-medium border ${colors.border}`}>
                              {goal.category.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-2"
                            title="Delete goal"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Weekly Progress</span>
                            <span className="text-sm font-bold text-gray-900">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-teal-400 to-cyan-400 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {weekDays.map((day, idx) => (
                            <button
                              key={idx}
                              onClick={() => toggleGoalDay(goal.id, idx)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                goal.progress[idx]
                                  ? 'bg-emerald-400 border-emerald-500 text-white shadow-md'
                                  : 'bg-white border-gray-300 hover:border-teal-300 hover:shadow'
                              }`}
                              title={`${day} - Click to toggle`}
                            >
                              <div className="text-center">
                                <div className="text-xs font-semibold mb-1">{day}</div>
                                {goal.progress[idx] ? (
                                  <Check size={16} className="mx-auto" />
                                ) : (
                                  <div className="w-4 h-4 mx-auto"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Goals Yet</h3>
                  <p className="text-gray-500 mb-6">
                    Start tracking your wellness journey by adding your first goal!
                  </p>
                  <button
                    onClick={() => setShowAddGoal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                  >
                    <Plus size={20} />
                    Create Your First Goal
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showChatbot && (
          <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={24} />
                <h3 className="font-semibold">AI Wellness Coach</h3>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Brain size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Hi! I'm your AI wellness coach.</p>
                  <p className="text-sm mt-2">How can I support you today?</p>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl ${
                      msg.role === "user"
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <RefreshCw className="animate-spin" size={20} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WellnessCentre;