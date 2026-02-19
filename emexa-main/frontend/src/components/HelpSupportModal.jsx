import React, { useState, useEffect } from "react";
import { 
  X, Search, Book, MessageCircle, Shield, Settings, 
  Heart, Brain, ChevronRight, ChevronDown, ExternalLink,
  HelpCircle, FileText, Zap, Users, Mail, Phone, Clock
} from 'lucide-react';
import Header from "../components/headerorigin.jsx";

const HelpSupportModal = ({ isOpen = true, onClose = () => {}, userRole = "student", userName = "User" }) => {
  const [activeTab, setActiveTab] = useState("articles");
  const [selectedCategory, setSelectedCategory] = useState("getting-started");
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // Show Tawk widget when modal opens, hide when it closes
  useEffect(() => {
    if (!isOpen) return;

    let attempts = 0;
    const maxAttempts = 50;

    const showWidget = () => {
      if (window.Tawk_API && window.Tawk_API.showWidget) {
        window.Tawk_API.showWidget();
        console.log('✅ Widget shown in Help & Support modal');
        return true;
      }
      return false;
    };

    // Keep trying until Tawk loads
    const interval = setInterval(() => {
      if (showWidget() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
      attempts++;
    }, 100);

    // Cleanup: hide widget when modal closes
    return () => {
      clearInterval(interval);
      if (window.Tawk_API && window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
        console.log('❌ Widget hidden - modal closed');
      }
    };
  }, [isOpen]); // Re-run when isOpen changes

  if (!isOpen) return null;

  const categories = [
    { id: "getting-started", label: "Getting Started", icon: Book },
    { id: "quizzes", label: "Quizzes", icon: FileText },
    { id: "wellness", label: "Wellness", icon: Heart },
    { id: "technical", label: "Technical", icon: Zap },
    { id: "privacy", label: "Privacy", icon: Shield }
  ];

  const quickArticles = {
    "getting-started": [
      { title: "Creating Your Account", time: "2 min read" },
      { title: "First Time Login", time: "3 min read" },
      { title: "Understanding Emotion Detection", time: "4 min read" }
    ],
    "quizzes": userRole === "student" ? [
      { title: "Taking Quizzes", time: "5 min read" },
      { title: "Understanding Adaptive Hints", time: "3 min read" },
      { title: "Viewing Your Results", time: "2 min read" }
    ] : [
      { title: "Creating Quizzes", time: "6 min read" },
      { title: "AI-Generated Questions", time: "4 min read" },
      { title: "Real-Time Monitoring", time: "5 min read" }
    ],
    "wellness": [
      { title: "Wellness Dashboard Overview", time: "4 min read" },
      { title: "Mood Tracking", time: "3 min read" },
      { title: "AI Wellness Coach", time: "3 min read" }
    ],
    "technical": [
      { title: "Camera Not Working", time: "2 min read" },
      { title: "Quiz Won't Load", time: "2 min read" },
      { title: "System Requirements", time: "3 min read" }
    ],
    "privacy": [
      { title: "What We Collect", time: "4 min read" },
      { title: "GDPR Compliance", time: "5 min read" },
      { title: "Data Security", time: "4 min read" }
    ]
  };

  const commonFAQs = [
    {
      question: "Is emotion detection mandatory?",
      answer: "No, emotion detection is completely optional. You can disable it anytime in Settings."
    },
    {
      question: "Will emotions affect my grade?",
      answer: "No, emotions provide context for feedback but don't directly impact grades."
    },
    {
      question: "Can I retake quizzes?",
      answer: "Retake options depend on your teacher's settings for each quiz."
    },
    {
      question: "How accurate is emotion detection?",
      answer: "Our AI model has ~92% accuracy, but works best with good lighting."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header Component */}
        <div className="border-b border-gray-200">
          <Header userName={userName} userRole={userRole} />
        </div>

        {/* Help & Support Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <HelpCircle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
              <p className="text-sm text-gray-600">Quick answers to your questions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 border-b border-gray-200">
          {[
            { id: "articles", label: "Articles", icon: Book },
            { id: "faqs", label: "FAQs", icon: MessageCircle },
            { id: "contact", label: "Contact", icon: Mail }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {activeTab === "articles" && (
            <div className="space-y-6">
              {/* Categories */}
              <div className="grid grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedCategory === cat.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <cat.icon className={selectedCategory === cat.id ? "text-blue-600" : "text-gray-600"} size={20} />
                    <p className="text-xs font-medium mt-1">{cat.label}</p>
                  </button>
                ))}
              </div>

              {/* Articles List */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {categories.find(c => c.id === selectedCategory)?.label} Articles
                </h3>
                {quickArticles[selectedCategory]?.map((article, index) => (
                  <button
                    key={index}
                    onClick={() => window.open('/help-support', '_blank')}
                    className="w-full p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">{article.time}</p>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>

              {/* View All */}
              <button
                onClick={() => window.open('/help-support', '_blank')}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center text-blue-600 font-medium"
              >
                View All Help Articles →
              </button>
            </div>
          )}

          {activeTab === "faqs" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Common Questions</h3>
              {commonFAQs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronDown className="text-blue-600" size={20} />
                    ) : (
                      <ChevronRight className="text-gray-400" size={20} />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="p-4 pt-0 text-gray-700 bg-gray-50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-6">
              {/* Note about different support options */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Note:</strong> For emotional support and wellness guidance, visit the{' '}
                  <button 
                    onClick={() => {
                      onClose();
                      window.location.href = '/wellness-centre';
                    }}
                    className="text-blue-600 underline font-medium hover:text-blue-700"
                  >
                    Wellness Centre
                  </button>
                  {' '}AI chatbot. Use live chat below for technical support.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Mail className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email Support</p>
                      <p className="text-sm text-gray-600">emexaedu@gmail.com</p>
                      <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Phone className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Phone Support</p>
                      <p className="text-sm text-gray-600">+94 78 513 4587</p>
                      <p className="text-xs text-gray-500 mt-1">Mon-Fri, 9 AM - 6 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <MessageCircle className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Live Chat</p>
                      <p className="text-sm text-gray-600">Available during business hours</p>
                      <button 
                        onClick={() => {
                          if (window.Tawk_API && window.Tawk_API.maximize) {
                            window.Tawk_API.maximize();
                            console.log('💬 Opening live chat from modal');
                          } else {
                            alert('Live chat is still loading. Please wait a moment and try again.');
                          }
                        }}
                        className="text-xs text-purple-600 font-medium mt-1 hover:underline"
                      >
                        Start Live Chat →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> For urgent issues during active quizzes, contact your teacher directly.
                </p>
              </div>

              <button
                onClick={() => window.open('/help-support', '_blank')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Submit Detailed Support Request
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => window.open('/help-support', '_blank')}
              className="text-blue-600 hover:underline font-medium"
            >
              Open Full Help Centre
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportModal;