import React, { useState, useEffect } from "react";
import { 
  HelpCircle, Search, Book, MessageCircle, Shield, 
  Settings, Camera, Wifi, Clock, AlertCircle, 
  ChevronRight, ChevronDown, ExternalLink, Mail,
  Phone, Download, CheckCircle, XCircle, Heart,
  Brain, Target, Users, Lock, FileText, Zap
} from 'lucide-react';
import Header from "../components/headerorigin";
import Sidebar from "../components/sidebarorigin";
import axios from 'axios';
import { jsPDF } from 'jspdf';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

const HelpSupportCentre = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("help");
  const [userName, setUserName] = useState("Student");
  const [userRole, setUserRole] = useState("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: "",
    category: "technical",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    const storedUserRole = localStorage.getItem("userRole") || "student";
    setUserName(storedUserName || "User");
    setUserRole(storedUserRole);
  }, []);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50;
    let widgetInterval;

    const showWidget = () => {
      if (window.Tawk_API && window.Tawk_API.showWidget) {
        window.Tawk_API.showWidget();
        console.log('✅ Widget shown on Help & Support page');
        return true;
      }
      return false;
    };

    // Try to show widget repeatedly until it's loaded
    widgetInterval = setInterval(() => {
      if (attempts < maxAttempts) {
        showWidget();
        attempts++;
      } else {
        clearInterval(widgetInterval);
      }
    }, 100);

    // Also try immediately
    showWidget();

    // Cleanup: hide widget only when component unmounts
    return () => {
      if (widgetInterval) {
        clearInterval(widgetInterval);
      }
      if (window.Tawk_API && window.Tawk_API.hideWidget) {
        window.Tawk_API.hideWidget();
        console.log('❌ Widget hidden - leaving Help & Support page');
      }
    };
  }, []);

  const categories = [
    { id: "getting-started", label: "Getting Started", icon: Book, color: "text-blue-600" },
    { id: "taking-quizzes", label: "Taking Quizzes", icon: FileText, color: "text-green-600" },
    { id: "creating-quizzes", label: "Creating Quizzes", icon: Settings, color: "text-purple-600" },
    { id: "wellness", label: "Wellness Features", icon: Heart, color: "text-pink-600" },
    { id: "analytics", label: "Analytics & Reports", icon: Brain, color: "text-indigo-600" },
    { id: "privacy", label: "Privacy & Security", icon: Shield, color: "text-red-600" },
    { id: "technical", label: "Technical Support", icon: Zap, color: "text-yellow-600" },
    { id: "account", label: "Account & Settings", icon: Users, color: "text-teal-600" }
  ];

  const helpContent = {
    "getting-started": {
      title: "Getting Started",
      articles: [
        {
          title: "Creating Your Account",
          content: "Register using your institutional email. Complete your profile with basic information including your name, profile picture, and preferences.",
          steps: [
            "Navigate to the registration page",
            "Enter your institutional email",
            "Set a strong password (min 8 characters)",
            "Verify your email through the confirmation link",
            "Complete your profile setup"
          ]
        },
        {
          title: "First Time Login",
          content: "After logging in, you'll see your personalized dashboard with upcoming quizzes, scores, and study time tracking.",
          tips: [
            "Explore the sidebar menu to familiarize yourself with features",
            "Set up your notification preferences",
            "Enable emotion detection for a better experience",
            "Check out the Wellness Centre for mental health support"
          ]
        },
        {
          title: "Understanding Emotion Detection",
          content: "Our system uses your webcam to detect emotions during quizzes to provide personalized support and reduce test anxiety.",
          features: [
            "Real-time facial emotion analysis",
            "Privacy-first approach - you control when it's active",
            "Adaptive support based on stress levels",
            "Post-quiz emotional insights"
          ]
        }
      ]
    },
    "taking-quizzes": {
      title: "Taking Quizzes",
      articles: [
        {
          title: "Before the Quiz",
          content: "Ensure you're prepared for a smooth quiz experience.",
          checklist: [
            "✓ Stable internet connection",
            "✓ Working webcam (for emotion detection)",
            "✓ Quiet environment",
            "✓ Browser compatibility (Chrome, Firefox, Edge)",
            "✓ Grant camera permissions when prompted"
          ]
        },
        {
          title: "During the Quiz",
          content: "Our system monitors your emotional state and provides adaptive support.",
          features: [
            "Motivational messages when stressed",
            "Breathing exercise prompts",
            "Adaptive hints (if enabled by teacher)",
            "Auto-save of answers",
            "Timer with visual countdown"
          ]
        },
        {
          title: "After the Quiz",
          content: "Receive comprehensive feedback and insights.",
          includes: [
            "AI-powered personalized feedback",
            "Correct answers and explanations",
            "Your emotional journey visualization",
            "Performance analytics",
            "Areas for improvement"
          ]
        },
        {
          title: "Technical Issues During Quiz",
          content: "If you experience technical problems:",
          steps: [
            "Don't panic - your progress is auto-saved",
            "Take a screenshot if possible",
            "Contact your teacher immediately",
            "Document the time and nature of the issue",
            "Request time adjustment if needed"
          ]
        }
      ]
    },
    "creating-quizzes": {
      title: "Creating & Managing Quizzes",
      articles: [
        {
          title: "Manual Quiz Creation",
          content: "Create custom quizzes with full control over questions and settings.",
          steps: [
            "Navigate to Dashboard → Create Quiz",
            "Enter quiz title and description",
            "Add questions one by one",
            "Set correct answers and point values",
            "Configure time limits and settings",
            "Preview and publish"
          ]
        },
        {
          title: "AI-Generated Quizzes",
          content: "Let AI create quizzes from your content.",
          process: [
            "Upload content (PDF, DOCX, or text)",
            "AI analyzes and generates questions",
            "Review and edit generated questions",
            "Adjust difficulty levels",
            "Set adaptive difficulty if desired",
            "Publish to students"
          ]
        },
        {
          title: "Quiz Settings",
          content: "Customize your quiz experience.",
          options: [
            "Time limits - Set overall duration",
            "Question randomization",
            "Proctoring - Enable anti-cheat measures",
            "Emotion tracking - Toggle for students",
            "Adaptive hints - AI-powered help",
            "Retake options",
            "Grading method - Auto/Manual"
          ]
        },
        {
          title: "Real-Time Monitoring",
          content: "Track student progress during active quizzes.",
          capabilities: [
            "View completion status",
            "Monitor emotional states",
            "Send encouragement messages",
            "Identify struggling students",
            "Adjust settings mid-quiz if needed",
            "Handle technical issues"
          ]
        }
      ]
    },
    "wellness": {
      title: "Wellness & Emotional Support",
      articles: [
        {
          title: "Wellness Dashboard",
          content: "Track your emotional wellbeing alongside academic performance.",
          features: [
            "Daily mood tracking",
            "Weekly emotional patterns",
            "AI wellness tips",
            "Stress management resources",
            "Wellness goals tracker"
          ]
        },
        {
          title: "Emotion Tracking",
          content: "Understand how emotions affect your performance.",
          howItWorks: [
            "Log your mood daily",
            "System detects emotions during quizzes",
            "View emotional trends over time",
            "Get AI-generated insights",
            "Correlate with academic performance"
          ]
        },
        {
          title: "AI Wellness Coach",
          content: "Chat with our AI coach for mental health support.",
          capabilities: [
            "24/7 availability",
            "Personalized advice",
            "Stress management techniques",
            "Study-life balance tips",
            "Crisis resources if needed"
          ]
        },
        {
          title: "Privacy Controls",
          content: "You're always in control of your emotional data.",
          controls: [
            "Enable/disable emotion tracking anytime",
            "View all collected data",
            "Request data deletion",
            "Control who sees your data",
            "Opt-out completely if preferred"
          ]
        }
      ]
    },
    "analytics": {
      title: "Analytics & Reports",
      articles: [
        {
          title: "Student Analytics",
          content: "Track your academic progress and growth.",
          metrics: [
            "Performance trends over time",
            "Emotion-performance correlations",
            "Study time tracking",
            "Comparative class analysis",
            "Strength and weakness identification"
          ]
        },
        {
          title: "Teacher Dashboard",
          content: "Comprehensive class insights.",
          includes: [
            "Class-wide performance overview",
            "Individual student reports",
            "Emotional analytics",
            "Engagement metrics",
            "Intervention recommendations"
          ]
        },
        {
          title: "Exporting Data",
          content: "Download reports for offline analysis.",
          formats: [
            "PDF - Formatted reports",
            "CSV - Raw data for spreadsheets",
            "JSON - Developer-friendly format",
            "Include/exclude emotional data",
            "Custom date ranges"
          ]
        }
      ]
    },
    "privacy": {
      title: "Privacy & Data Security",
      articles: [
        {
          title: "What We Collect",
          content: "Transparency about data collection.",
          collected: [
            "✓ Facial emotion data (only during quizzes, with consent)",
            "✓ Quiz responses and performance",
            "✓ Interaction patterns and timing",
            "✓ Session data and timestamps",
            "✓ Profile information you provide"
          ]
        },
        {
          title: "What We DON'T Collect",
          content: "Your privacy is paramount.",
          notCollected: [
            "✗ Video or audio recordings",
            "✗ Personal conversations",
            "✗ Browsing history outside the app",
            "✗ Location tracking",
            "✗ Third-party sharing without consent"
          ]
        },
        {
          title: "GDPR Compliance",
          content: "We follow strict data protection regulations.",
          rights: [
            "Right to access your data",
            "Right to delete your data",
            "Right to data portability",
            "Right to opt-out of processing",
            "Right to be forgotten"
          ]
        },
        {
          title: "Data Security",
          content: "How we protect your information.",
          measures: [
            "End-to-end encryption",
            "Secure authentication (JWT)",
            "Regular security audits",
            "HTTPS for all connections",
            "No data sold to third parties"
          ]
        }
      ]
    },
    "technical": {
      title: "Technical Support",
      articles: [
        {
          title: "Camera Not Working",
          content: "Troubleshoot camera issues.",
          solutions: [
            "Check browser permissions (Settings → Privacy → Camera)",
            "Ensure no other app is using the camera",
            "Try refreshing the page",
            "Test camera at browser's test page",
            "Restart your browser",
            "Update browser to latest version"
          ]
        },
        {
          title: "Quiz Won't Load",
          content: "Resolve loading issues.",
          steps: [
            "Check internet connection",
            "Clear browser cache and cookies",
            "Try incognito/private mode",
            "Switch to a different browser",
            "Disable browser extensions",
            "Contact your teacher if issue persists"
          ]
        },
        {
          title: "Login Problems",
          content: "Can't access your account?",
          solutions: [
            "Reset password using 'Forgot Password'",
            "Check if using correct institutional email",
            "Verify account via email confirmation",
            "Check for typos in username/password",
            "Contact admin if account is locked",
            "Try clearing browser cache"
          ]
        },
        {
          title: "Emotion Detection Issues",
          content: "Improve emotion detection accuracy.",
          tips: [
            "Ensure adequate lighting",
            "Face camera directly",
            "Remove obstructions (large glasses, masks)",
            "Maintain stable head position",
            "Check camera permissions",
            "Use external webcam if built-in fails"
          ]
        },
        {
          title: "System Requirements",
          content: "Ensure your device meets requirements.",
          requirements: [
            "Modern browser (Chrome 90+, Firefox 88+, Edge 90+)",
            "Stable internet (5+ Mbps recommended)",
            "Working webcam (720p or higher)",
            "4GB RAM minimum",
            "JavaScript enabled",
            "Cookies enabled"
          ]
        }
      ]
    },
    "account": {
      title: "Account & Settings",
      articles: [
        {
          title: "Profile Settings",
          content: "Customize your account.",
          options: [
            "Update profile picture",
            "Change display name",
            "Update email preferences",
            "Set notification preferences",
            "Choose interface theme",
            "Manage connected accounts"
          ]
        },
        {
          title: "Notification Settings",
          content: "Control how you receive updates.",
          types: [
            "Quiz reminders",
            "Grade notifications",
            "Wellness check-ins",
            "System announcements",
            "Email vs in-app",
            "Quiet hours"
          ]
        },
        {
          title: "Privacy Controls",
          content: "Manage your data and privacy.",
          settings: [
            "Emotion tracking on/off",
            "Data sharing preferences",
            "Profile visibility",
            "Analytics opt-in/out",
            "Download your data",
            "Delete account"
          ]
        }
      ]
    }
  };

  const faqs = [
    {
      question: "Is emotion detection mandatory?",
      answer: "No, emotion detection is completely optional. Students can opt-out in Settings, and teachers can disable it per quiz. Your participation is always voluntary.",
      category: "privacy"
    },
    {
      question: "How accurate is emotion detection?",
      answer: "Our AI model has approximately 92% accuracy, but works best with good lighting and a clear camera view. Results may vary based on environmental conditions.",
      category: "technical"
    },
    {
      question: "Will emotions affect my grade?",
      answer: "No, emotions do not directly impact your grade. Emotional data provides context for feedback and helps teachers understand your learning experience, but grades are based solely on your quiz performance.",
      category: "taking-quizzes"
    },
    {
      question: "Can I retake quizzes?",
      answer: "Retake options depend on your teacher's settings for each quiz. Check the quiz details or ask your teacher about retake policies.",
      category: "taking-quizzes"
    },
    {
      question: "What if I'm stressed about being monitored?",
      answer: "You can disable emotion tracking completely in Settings. The system is designed to support you, not add pressure. Your wellbeing comes first.",
      category: "wellness"
    },
    {
      question: "How do I export my data?",
      answer: "Go to Settings → Data & Privacy → Export Data. Choose your date range and format (PDF/CSV/JSON), then download. Processing may take a few minutes.",
      category: "analytics"
    },
    {
      question: "What browsers are supported?",
      answer: "We support modern versions of Chrome, Firefox, Edge, and Safari. For best experience, we recommend Chrome 90+ or Firefox 88+ with all updates installed.",
      category: "technical"
    },
    {
      question: "Can teachers see my emotions in real-time?",
      answer: "Teachers see aggregate emotional data and receive alerts for high stress levels, not continuous detailed monitoring of individual students' emotions.",
      category: "privacy"
    }
  ];

  const filteredFAQs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs.filter(faq => faq.category === activeCategory);

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/help-support/contact`,
        contactForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSubmitSuccess(true);
        setContactForm({ subject: "", category: "technical", message: "" });
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Failed to submit. Please try again or email support@emotionquiz.edu");
    } finally {
      setSubmitting(false);
    }
  };

  const currentContent = helpContent[activeCategory];

  const downloadPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Emotion-Aware Quiz System', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Help & Support Guide', margin, yPosition);
    yPosition += 15;

    Object.keys(helpContent).forEach((categoryKey) => {
      const category = helpContent[categoryKey];
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(category.title, margin, yPosition);
      yPosition += 10;

      category.articles.forEach((article) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(article.title, margin + 5, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const contentLines = doc.splitTextToSize(article.content, 170);
        contentLines.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 3;

        const dataArrays = {
          steps: article.steps,
          tips: article.tips,
          features: article.features,
          checklist: article.checklist,
          solutions: article.solutions,
          process: article.process,
          options: article.options,
          capabilities: article.capabilities,
          howItWorks: article.howItWorks,
          controls: article.controls,
          metrics: article.metrics,
          collected: article.collected,
          notCollected: article.notCollected,
          rights: article.rights,
          measures: article.measures,
          requirements: article.requirements,
          includes: article.includes
        };

        Object.entries(dataArrays).forEach(([key, items]) => {
          if (items && items.length > 0) {
            items.forEach((item, index) => {
              if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }
              const bullet = key === 'steps' ? `${index + 1}.` : '•';
              const itemLines = doc.splitTextToSize(`${bullet} ${item}`, 160);
              itemLines.forEach((line) => {
                doc.text(line, margin + 10, yPosition);
                yPosition += 5;
              });
            });
            yPosition += 3;
          }
        });

        yPosition += 5;
      });

      yPosition += 10;
    });

    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Frequently Asked Questions', margin, yPosition);
    yPosition += 10;

    faqs.forEach((faq) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      const questionLines = doc.splitTextToSize(`Q: ${faq.question}`, 170);
      questionLines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const answerLines = doc.splitTextToSize(`A: ${faq.answer}`, 170);
      answerLines.forEach((line) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 8;
    });

    doc.addPage();
    yPosition = 20;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Contact Information', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Email: emexaedu@gmail.com', margin, yPosition);
    yPosition += 7;
    doc.text('Phone: +94 78 513 4587', margin, yPosition);
    yPosition += 7;
    doc.text('Hours: Mon-Fri, 9 AM - 6 PM', margin, yPosition);

    doc.save('Emotion-Quiz-Help-Guide.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header userName={userName} userRole={userRole} />
      <Sidebar 
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
      />

      <div className="ml-52 pt-14 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Help & Support Centre
              </h1>
              <p className="text-gray-600 mt-1">
                Find answers, guides, and get help with Emotion-Aware Quiz System
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeCategory === cat.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow"
              }`}
            >
              <cat.icon className={`${cat.color} mb-2`} size={24} />
              <h3 className="font-semibold text-gray-900 text-sm">{cat.label}</h3>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Book size={24} className="text-blue-600" />
                {currentContent.title}
              </h2>

              <div className="space-y-6">
                {currentContent.articles.map((article, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {article.title}
                    </h3>
                    <p className="text-gray-700 mb-4">{article.content}</p>

                    {article.steps && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Steps:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          {article.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {article.tips && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Tips:</h4>
                        <ul className="space-y-2 text-gray-700">
                          {article.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle size={16} className="text-green-600 mt-1 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {article.features && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2">Features:</h4>
                        <ul className="space-y-2 text-gray-700">
                          {article.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Zap size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {article.checklist && (
                      <div className="bg-amber-50 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-900 mb-2">Checklist:</h4>
                        <ul className="space-y-2 text-gray-700">
                          {article.checklist.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {article.includes && (
                      <ul className="space-y-2 text-gray-700">
                        {article.includes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight size={16} className="text-blue-600 mt-1 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {(article.process || article.options || article.capabilities || article.howItWorks || 
                      article.controls || article.metrics || article.collected || article.notCollected || 
                      article.rights || article.measures || article.solutions || article.requirements) && (
                      <ul className="space-y-2 text-gray-700 mt-4">
                        {(article.process || article.options || article.capabilities || article.howItWorks || 
                          article.controls || article.metrics || article.collected || article.notCollected || 
                          article.rights || article.measures || article.solutions || article.requirements).map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageCircle size={24} className="text-green-600" />
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {filteredFAQs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900">{faq.question}</span>
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
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-600" />
                Quick Links
              </h3>
              <div className="space-y-2">
                <a href="#" className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors">
                  <span className="text-gray-700">Video Tutorials</span>
                  <ExternalLink size={16} className="text-gray-400" />
                </a>
                <button 
                  onClick={downloadPDF}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors w-full text-left"
                >
                  <span className="text-gray-700">Download Guide (PDF)</span>
                  <Download size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                Need More Help?
              </h3>
              <p className="text-sm mb-4 text-blue-100">
                Can't find what you're looking for? Our support team is here to help!
              </p>

              <div className="bg-white/20 rounded-lg p-3 mb-3 border border-white/30">
                <p className="text-xs font-medium mb-1">💙 For Emotional Support:</p>
                <p className="text-xs text-blue-100 mb-2">
                  Visit the Wellness Centre for AI-powered mental health support.
                </p>
                <button
                  onClick={() => window.location.href = '/wellness-centre'}
                  className="text-xs bg-white/30 hover:bg-white/40 px-3 py-1.5 rounded transition-colors font-medium"
                >
                  Go to Wellness Centre →
                </button>
              </div>

              <div className="bg-white/20 rounded-lg p-3 mb-4 border border-white/30">
                <p className="text-xs font-medium mb-1">💬 Live Chat Support:</p>
                <p className="text-xs text-blue-100 mb-2">
                  Chat with our team in real-time for technical help.
                </p>
                <button
                  onClick={() => {
                    if (window.Tawk_API && window.Tawk_API.maximize) {
                      window.Tawk_API.maximize();
                      console.log('💬 Opening live chat');
                    } else {
                      alert('Live chat is still loading. Please wait a moment and try again.');
                    }
                  }}
                  className="text-xs bg-white/30 hover:bg-white/40 px-3 py-1.5 rounded transition-colors font-medium"
                >
                  Start Live Chat →
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>emexaedu@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>+94 78 513 4587</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Mon-Fri, 9 AM - 6 PM</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wifi size={20} className="text-green-600" />
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm">Platform</span>
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm">Emotion AI</span>
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 text-sm">Database</span>
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportCentre;