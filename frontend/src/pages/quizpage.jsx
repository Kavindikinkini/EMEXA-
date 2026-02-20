import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Clock,
  Home,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Flag,
} from "lucide-react";
import { io } from "socket.io-client";
import teacherQuizService from "../services/teacherQuizService";
import headerLogo from "../assets/headerlogo.png";
import DownloadIcon from "../assets/download.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const QuizPage = () => {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const showResults = searchParams.get("results") === "true";

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeOnQuestion, setTimeOnQuestion] = useState(0);
  const [showBulb, setShowBulb] = useState(false);
  const [showEmojiDialog, setShowEmojiDialog] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState({}); 
  const [pendingHintRequest, setPendingHintRequest] = useState(null); 
  const [quizSubmitted, setQuizSubmitted] = useState(showResults);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStartTime] = useState(Date.now());
  const [totalTime, setTotalTime] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all"); 
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [hasExpired, setHasExpired] = useState(false);

  // AI Integration States
  const [sessionId] = useState(
    `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );
  const [aiHints, setAiHints] = useState({});
  const [aiFeedback, setAiFeedback] = useState(null);
  const [emotionSocket, setEmotionSocket] = useState(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [cameraPermissionLoading, setCameraPermissionLoading] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] =
    useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [bulbVisible, setBulbVisible] = useState(false);

  // Load quiz data on component mount
  useEffect(() => {
    loadQuizData();

    // Check camera permission from localStorage (set by Permission page)
    const cameraPermission = localStorage.getItem("cameraPermission");
    console.log(
      "📱 Retrieved camera permission from localStorage:",
      cameraPermission,
    );

    if (cameraPermission === "allowed") {
      // Camera was allowed on permission page - enable AI hints
      console.log("✅ Camera permission allowed - Enabling AI hints");
      setWebcamEnabled(true);
      setCameraPermissionDenied(false);
      // Initialize AI socket for emotion tracking
      initializeAI();
    } else {
      // Camera was denied or skipped - use teacher hints only
      console.log("❌ Camera permission denied - Using teacher hints only");
      setWebcamEnabled(false);
      setCameraPermissionDenied(true);
    }

    // Don't show camera permission dialog on quiz page
    // Camera permission is handled on the permission page before quiz starts
    setCameraPermissionLoading(false);
    setShowCameraPermissionDialog(false);

    return () => {
      // Cleanup on unmount
      if (emotionSocket) {
        emotionSocket.disconnect();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [quizId]);

  // Attach video stream to element when it becomes available
  useEffect(() => {
    if (videoRef.current && videoStream && !videoRef.current.srcObject) {
      videoRef.current.srcObject = videoStream;
      console.log("📹 Video stream attached to element (delayed)");
    }
  }, [videoStream]);

  // Show hint bulb after 10 seconds (for both camera allowed and denied)
  useEffect(() => {
    if (!cameraPermissionLoading) {
      const timer = setTimeout(() => {
        setBulbVisible(true);
        console.log("💡 Hint bulb now visible after 10 seconds");
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [cameraPermissionLoading]);

  // Log final camera permission status when state updates
  useEffect(() => {
    if (!cameraPermissionLoading) {
      console.log(
        `🎯 CAMERA PERMISSION FINAL: ${
          webcamEnabled
            ? "✅ ALLOWED - AI hints available"
            : "❌ DENIED - Teacher hints only"
        }`,
      );
    }
  }, [cameraPermissionLoading, webcamEnabled]);

  // Stop camera when quiz is submitted or results are shown
  useEffect(() => {
    if (quizSubmitted || showResults) {
      console.log("🛑 IMMEDIATELY STOPPING camera and all tracks...");

      // ⚡ IMMEDIATE STOP - Don't wait for state updates
      // Stop videoRef tracks FIRST
      if (videoRef.current) {
        console.log("Stopping tracks from videoRef...");
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach((track) => {
            console.log("🛑 Stopping track:", track.kind);
            track.stop();
          });
        }
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }

      // Stop videoStream state SECOND
      if (videoStream) {
        console.log("Stopping tracks from videoStream state...");
        videoStream.getTracks().forEach((track) => {
          console.log("🛑 Stopping track:", track.kind);
          track.stop();
        });
      }

      // Then update states
      setWebcamEnabled(false);
      setVideoStream(null);

      // Disconnect emotion socket
      if (emotionSocket) {
        console.log("🔌 Disconnecting emotion socket...");
        emotionSocket.disconnect();
      }

      console.log("✅ Camera, microphone, and sockets fully stopped!");
    }
  }, [quizSubmitted, showResults]);

  // Initialize AI features (Socket.IO connection only - no webcam yet)
  const initializeAI = async () => {
    try {
      // Get user info from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      // Connect to emotion tracking socket
      const socket = io("http://localhost:5000/emotion", {
        transports: ["websocket"],
        reconnection: true,
      });

      socket.on("connect", () => {
        console.log("🤖 AI: Connected to emotion tracking");
        socket.emit("join-session", sessionId);
      });

      socket.on("emotion-detected", (data) => {
        console.log(
          "😊 AI: Emotion detected -",
          data.emotion,
          `(${Math.round(data.confidence * 100)}%)`,
        );
      });

      socket.on("emotion-error", (error) => {
        console.error("❌ AI: Emotion error", error);
      });

      setEmotionSocket(socket);
    } catch (error) {
      console.error("AI initialization error:", error);
    }
  };

  // Request webcam permission and start emotion tracking
  const requestCameraPermission = async () => {
    try {
      setCameraPermissionLoading(true);
      console.log(
        "📷 AI: Requesting webcam permission for emotion tracking...",
      );

      // Initialize AI socket connection when user actually requests camera
      await initializeAI();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 224, height: 224 },
      });

      // Set webcam enabled immediately when permission is granted
      setWebcamEnabled(true);
      setVideoStream(stream);
      setCameraPermissionDenied(false);
      setShowCameraPermissionDialog(false);
      console.log(
        "✅ AI: Webcam permission granted - emotion tracking active - AI hints enabled",
      );

      // Attach stream to video element if available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("📹 Video stream attached to element");
      }
    } catch (err) {
      console.log(
        "⚠️ AI: Webcam permission denied or device not found - falling back to manual mode - teacher hints only",
      );
      console.error("📷 Camera error details:", err.name, err.message);

      // Handle NotFoundError (no camera device) same as denied permission
      if (err.name === "NotFoundError") {
        console.log("📷 No camera device found on this system");
      } else if (err.name === "NotAllowedError") {
        console.log("📷 User denied camera permission");
      } else if (err.name === "NotReadableError") {
        console.log("📷 Camera device is in use by another application");
      }

      setCameraPermissionDenied(true);
      setWebcamEnabled(false);
      setShowCameraPermissionDialog(false);
    } finally {
      setCameraPermissionLoading(false);
      console.log(
        `🎯 CAMERA PERMISSION CHECK: Permission request completed. State will update shortly.`,
      );
    }
  };

  // Capture and send emotion snapshot every 60 seconds
  useEffect(() => {
    if (!webcamEnabled || !emotionSocket || quizSubmitted) return;

    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const user = JSON.parse(userStr);

    const captureEmotion = () => {
      if (!videoRef.current) {
        console.log("📸 AI: No video ref, skipping emotion capture");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 224, 224);
      const base64Image = canvas.toDataURL("image/jpeg");

      if (!base64Image || base64Image === "data:,") {
        console.log("📸 AI: Invalid image data, skipping");
        return;
      }

      if (!user.id || !sessionId || currentQuestion === undefined) {
        console.log("📸 AI: Missing user/session data", {
          userId: user.id,
          sessionId,
          questionIndex: currentQuestion,
        });
        return;
      }

      emotionSocket.emit("emotion-snapshot", {
        image: base64Image,
        userId: user.id,
        sessionId: sessionId,
        questionIndex: currentQuestion,
      });

      console.log("📸 AI: Emotion snapshot sent", {
        userId: user.id,
        sessionId,
        questionIndex: currentQuestion,
      });
    };

    // Capture immediately on question change
    captureEmotion();

    // Then every 10 seconds
    const interval = setInterval(captureEmotion, 10000);

    return () => clearInterval(interval);
  }, [webcamEnabled, emotionSocket, currentQuestion, quizSubmitted]);

  const loadQuizData = async () => {
    try {
      console.log("Quiz Page - Loading quiz with ID:", quizId);
      console.log("Quiz Page - URL:", window.location.href);
      console.log("Quiz Page - Show results:", showResults);

      // Get quiz ID from URL path parameter
      if (quizId) {
        // If we should show results, fetch the saved submission
        if (showResults) {
          try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
              `${API_BASE}/api/teacher-quizzes/${quizId}/submission`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            console.log("✅ Loaded saved submission:", response.data);

            if (
              response.data.success &&
              response.data.submission &&
              response.data.quiz
            ) {
              const { submission, quiz } = response.data;

              // Format quiz data with saved answers
              const formattedQuestions = quiz.questions.map((q, index) => ({
                id: index + 1,
                text: q.text,
                options: q.options.map((opt) => opt.text),
                correctAnswer: q.options.findIndex((opt) => opt.isCorrect),
                type: "mcq",
                hints: q.hints || [],
              }));

              setQuizData({
                _id: quiz._id,
                title: quiz.title,
                subject: quiz.subject,
                questions: formattedQuestions,
              });

              // Set the answers from the submission
              const savedAnswers = {};
              submission.answers.forEach((ans, idx) => {
                savedAnswers[idx] = ans.userAnswer;
              });
              setAnswers(savedAnswers);

              setQuizSubmitted(true);
              setLoading(false);
              return;
            }
          } catch (submissionError) {
            console.error(
              "❌ Error loading saved submission:",
              submissionError,
            );
            // Fall through to load quiz normally if submission not found
          }
        }

        try {
          // Try to load from backend first
          const response = await teacherQuizService.getSharedQuizzes();

          const teacherQuiz = response.quizzes.find((q) => {
            return String(q._id) === String(quizId) || q._id == quizId;
          });

          if (teacherQuiz) {
            console.log(
              "Quiz Page - Teacher quiz questions:",
              teacherQuiz.questions,
            );

            // Check if quiz is currently active
            const timeStatus = teacherQuiz.timeStatus || "active";
            const isActive =
              teacherQuiz.isCurrentlyActive !== undefined
                ? teacherQuiz.isCurrentlyActive
                : true;

            // Calculate if quiz has actually started based on real time
            let hasStarted = true;
            if (teacherQuiz.scheduleDate && teacherQuiz.startTime) {
              const scheduleDate = new Date(teacherQuiz.scheduleDate);
              const [startHour, startMinute] = teacherQuiz.startTime.split(':').map(Number);
              const startDateTime = new Date(scheduleDate);
              startDateTime.setHours(startHour, startMinute, 0, 0);
              const now = new Date();
              hasStarted = now >= startDateTime;
            }

            console.log(
              "Quiz Page - Time status:",
              timeStatus,
              "Is active:",
              isActive,
              "Has started:",
              hasStarted,
            );

            // Only block if quiz hasn't started yet
            if (!hasStarted) {
              alert(
                "This quiz has not started yet. Please wait until the scheduled time: " +
                  (teacherQuiz.scheduleDate
                    ? new Date(teacherQuiz.scheduleDate).toLocaleDateString()
                    : "TBA") +
                  " at " +
                  (teacherQuiz.startTime || "TBA"),
              );
              window.location.href = "/dashboard";
              return;
            }

            // Check if quiz has expired based on actual due date
            let quizExpired = false;
            if (teacherQuiz.dueDate) {
              const dueDateTime = new Date(teacherQuiz.dueDate);
              dueDateTime.setHours(23, 59, 59, 999); 
              const now = new Date();
              quizExpired = now > dueDateTime;
            }

            setHasExpired(quizExpired);

            if (quizExpired) {
              alert("This quiz has expired. The deadline has passed.");
              window.location.href = "/dashboard";
              return;
            }

            if (teacherQuiz.questions && teacherQuiz.questions.length > 0) {
              // Convert teacher quiz format to quiz page format
              const formattedQuestions = teacherQuiz.questions.map(
                (q, index) => ({
                  id: index + 1,
                  text: q.questionText,
                  type: q.type, // 'mcq' or 'short'
                  options:
                    q.type === "mcq" ? q.options.map((opt) => opt.text) : [],
                  correctAnswer:
                    q.type === "mcq"
                      ? q.options.findIndex((opt) => opt.isCorrect)
                      : null,
                  hints: q.hints || ["", "", "", ""],
                  shortAnswer: q.shortAnswer || "",
                }),
              );

              setQuizData({
                title: teacherQuiz.title,
                subject: teacherQuiz.subject,
                questions: formattedQuestions,
              });
              setLoading(false);
              return;
            } else {
              console.warn("Quiz Page - Teacher quiz found but no questions!");
            }
          } else {
            console.warn(
              "Quiz Page - No matching teacher quiz found for ID:",
              quizId,
            );
          }
        } catch (apiError) {
          console.error("Quiz Page - Error loading from backend:", apiError);
        }
      } else {
        console.warn("Quiz Page - No quizId provided in URL");
      }

      // Fallback to default sample quiz
      setQuizData({
        title: "Introduction to Biology",
        questions: sampleQuestions,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error loading quiz:", error);
      // Fallback to default sample quiz
      setQuizData({
        title: "Introduction to Biology",
        questions: sampleQuestions,
      });
      setLoading(false);
    }
  };

  const sampleQuestions = [
    {
      id: 1,
      text: "Which of the following is NOT a characteristic of living organisms?",
      options: [
        "Growth and development",
        "Response to environment",
        "Crystalline structure",
        "Reproduction",
      ],
      correctAnswer: 2,
      hints: [
        "This process occurs in plants and some bacteria.",
        "It involves the conversion of carbon dioxide and water into glucose and oxygen.",
        "Chlorophyll is essential for this process.",
        "The answer is related to photosynthesis characteristics.",
      ],
    },
    {
      id: 2,
      text: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic reticulum"],
      correctAnswer: 1,
      hints: [
        "This organelle is responsible for energy production.",
        "It produces ATP through cellular respiration.",
        "It has its own DNA.",
        "Often called the energy factory of the cell.",
      ],
    },
    {
      id: 3,
      text: "Which of the following is NOT a nucleotide found in DNA?",
      options: ["Adenine", "Guanine", "Uracil", "Cytosine"],
      correctAnswer: 2,
      hints: [
        "DNA contains four bases.",
        "This nucleotide is found in RNA, not DNA.",
        "Thymine replaces this base in DNA.",
        "The answer starts with 'U'.",
      ],
    },
    {
      id: 4,
      text: "Which organelle is responsible for protein synthesis?",
      options: ["Golgi apparatus", "Lysosome", "Ribosome", "Peroxisome"],
      correctAnswer: 2,
      hints: [
        "These are found on the rough endoplasmic reticulum.",
        "They translate mRNA into proteins.",
        "They can be free-floating or attached.",
        "They read messenger RNA sequences.",
      ],
    },
    {
      id: 5,
      text: "Which of the following is NOT a function of proteins in the human body?",
      options: [
        "Energy storage",
        "Structural support",
        "Transport of substances",
        "Catalyzing biochemical reactions",
      ],
      correctAnswer: 0,
      hints: [
        "Proteins have many functions but one is primarily handled by other molecules.",
        "Fats and carbohydrates are better suited for this function.",
        "This is not a primary role of proteins.",
        "Think about what lipids do better than proteins.",
      ],
    },
  ];

  // Timer effect for current question
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnQuestion((prev) => prev + 1);
      if (timeOnQuestion >= 10 && !showBulb) {
        setShowBulb(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeOnQuestion, showBulb, currentQuestion, answers]);

  // Overall quiz timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalTime(Math.floor((Date.now() - quizStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStartTime]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeOnQuestion(0);
    setShowBulb(false);
    setShowEmojiDialog(false);
    setShowHints(false);
  }, [currentQuestion]);

  // ✅ NEW: Block browser navigation during quiz
useEffect(() => {
  if (quizSubmitted || showResults || loading) {
    // Don't block if quiz is submitted, showing results, or still loading
    return;
  }

  const handlePopState = (e) => {
    e.preventDefault();
    const confirmLeave = window.confirm(
      '⚠️ WARNING: Leaving this page will count as using one attempt!\n\n' +
      'Are you sure you want to leave? This action cannot be undone.'
    );
    
    if (confirmLeave) {
      // Navigate to dashboard directly - NOT back (which would go to permission page)
      console.log('🚪 Student left quiz - navigating to dashboard');
      window.location.href = '/dashboard';
    } else {
      // Student wants to stay - push state again to prevent navigation
      window.history.pushState(null, '', window.location.href);
    }
  };

  // Block page refresh and tab close
  const handleBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = '⚠️ Leaving this page will count as using one attempt!';
    return e.returnValue;
  };

  // Initial push state to enable back button blocking
  window.history.pushState(null, '', window.location.href);
  
  // Add event listeners
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('beforeunload', handleBeforeUnload);

  console.log('🔒 Navigation blocking enabled');

  // Cleanup
  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    console.log('🔓 Navigation blocking disabled');
  };
}, [quizSubmitted, showResults, loading]);

// ✅ NEW: Auto-submit if student navigates away (FIXED: Only trigger on actual navigation, not page refresh)
useEffect(() => {
  let isNavigatingAway = false;

  const handleBeforeUnload = () => {
    isNavigatingAway = true;
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    
    // ONLY auto-submit if:
    // 1. Student is navigating away (not just component unmount)
    // 2. Quiz was not submitted
    // 3. Quiz data exists
    if (isNavigatingAway && !quizSubmitted && !showResults && quizData) {
      console.log('⚠️ Student left quiz without submitting - recording attempt');
      
      const autoSubmit = async () => {
        try {
          const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
          const answersArray = Object.entries(answers).map(
            ([index, answer]) => answer
          );

          const token = localStorage.getItem('token');
          
          await axios.post(
            `${API_BASE}/api/teacher-quizzes/${quizId}/submit`,
            {
              answers: answersArray,
              timeTaken,
              abandonedQuiz: true
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          console.log('✅ Abandoned quiz recorded as attempt');
        } catch (error) {
          console.error('❌ Error recording abandoned quiz:', error);
        }
      };

      autoSubmit();
    }
  };
}, [quizSubmitted, showResults, quizData, answers, quizId, quizStartTime]);

  const handleAnswerSelect = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleBulbClick = async () => {
    // Wait for camera permission to be determined
    if (cameraPermissionLoading) {
      console.log("⏳ Camera permission still loading, please wait...");
      alert("Please wait while we check camera permissions...");
      return;
    }

    const question = quizData.questions[currentQuestion];

    console.log("🔍 Bulb clicked - Current question:", question);
    console.log("🔍 Camera enabled:", webcamEnabled);
    console.log("🔍 Hints available:", question.hints);

    // First, check if AI hint already generated for this question (in memory)
    if (aiHints[currentQuestion]) {
      console.log(
        "✅ AI hint already exists in memory, showing emoji dialog first",
      );
      // Store that we should show existing hints after emoji selection
      setPendingHintRequest({
        type: "existing",
        questionIndex: currentQuestion,
      });
      setShowEmojiDialog(true);
      return;
    }

    // Check local storage for previously generated hint
    const localStorageKey = `hint_${quizId}_${question.id}`;
    const cachedHints = localStorage.getItem(localStorageKey);

    if (cachedHints && webcamEnabled) {
      console.log(
        "💾 Found cached AI hints in local storage, showing emoji dialog first",
      );
      // Store pending request to load from cache after emoji selection
      setPendingHintRequest({
        type: "cached",
        questionIndex: currentQuestion,
        cachedHints: cachedHints,
        localStorageKey: localStorageKey,
      });
      setShowEmojiDialog(true);
      return;
    }

    // Check if teacher hints are available (non-empty)
    const hasTeacherHints =
      question.hints &&
      question.hints.some((hint) => hint && hint.trim() !== "");

    console.log("🔍 Has teacher hints?", hasTeacherHints);

    // 🎯 MAIN LOGIC: Camera permission determines hint type
    // ✅ Camera ALLOWED → AI hints (with teacher fallback)
    // ❌ Camera DENIED → Teacher hints only

    console.log(
      `🎯 HINT LOGIC: Camera ${webcamEnabled ? "ALLOWED" : "DENIED"} → ${
        webcamEnabled ? "AI hints with teacher fallback" : "Teacher hints only"
      }`,
    );

    if (webcamEnabled) {
      // 🎥 CAMERA ALLOWED: Show emoji dialog first, then generate AI hint
      console.log("🎥 Camera allowed - showing emoji dialog before AI hint...");
      // Store that we need to generate AI hints after emoji selection
      setPendingHintRequest({
        type: "ai",
        questionIndex: currentQuestion,
        question: question,
        hasTeacherHints: hasTeacherHints,
      });
      setShowEmojiDialog(true);
    } else {
      // 🚫 CAMERA DENIED: Show emoji dialog first, then show teacher hints
      console.log(
        "🚫 Camera denied - showing emoji dialog before teacher hints...",
      );
      if (hasTeacherHints) {
        setPendingHintRequest({
          type: "teacher",
          questionIndex: currentQuestion,
          hasTeacherHints: hasTeacherHints,
        });
        setShowEmojiDialog(true);
      } else {
        alert(
          "No hints available for this question. Please ask your teacher to add hints.",
        );
      }
    }
  };

  const processHintRequest = async (request) => {
    if (!request) return;

    const { type, questionIndex, question, hasTeacherHints, cachedHints } =
      request;

    if (type === "existing") {
      // Show existing hints from memory
      console.log("✅ Showing existing hints from memory");
      setShowHints(true);
      return;
    }

    if (type === "cached") {
      // Load from local storage
      console.log("💾 Loading cached AI hints from local storage");
      try {
        const parsedHints = JSON.parse(cachedHints);
        setAiHints({
          ...aiHints,
          [questionIndex]: Array.isArray(parsedHints)
            ? parsedHints
            : [cachedHints],
        });
      } catch (e) {
        setAiHints({
          ...aiHints,
          [questionIndex]: [cachedHints],
        });
      }
      setShowHints(true);
      return;
    }

    if (type === "teacher") {
      // Show teacher hints
      console.log("📚 Displaying teacher-created hints");
      setShowHints(true);
      return;
    }

    if (type === "ai") {
      // Generate AI hint
      console.log("🎥 Generating AI hint...");
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          alert("Please log in to get hints");
          return;
        }

        const user = JSON.parse(userStr);

        const token = localStorage.getItem("token");
        const hintLocalStorageKey = `hint_${quizId}_${question.id}`;
        const response = await fetch("http://localhost:5000/api/hint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            sessionId: sessionId,
            questionId: String(question.id),
            questionIndex: questionIndex,
            questionText: question.text,
            options: question.options || [],
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log("🤖 AI Hints generated:", data.data.hints);
          console.log("🤖 Hints type:", typeof data.data.hints);
          console.log("🤖 Is array?:", Array.isArray(data.data.hints));
          console.log("🤖 Hints length:", data.data.hints?.length);

          // Ensure hints are always an array
          let hintsArray = Array.isArray(data.data.hints)
            ? data.data.hints
            : [data.data.hint];

          console.log("✅ Final hints array:", hintsArray);
          console.log("✅ Final hints count:", hintsArray.length);

          // Save to local storage as JSON array
          localStorage.setItem(hintLocalStorageKey, JSON.stringify(hintsArray));
          console.log("💾 AI hints saved to local storage");

          // Store AI hints in state (as array)
          setAiHints({
            ...aiHints,
            [questionIndex]: hintsArray,
          });

          // Increment hints used count
          if (!data.data.alreadyRequested) {
            setHintsUsedCount((prev) => prev + 1);
          }

          setShowHints(true);
        } else {
          // AI failed - fallback to teacher hints if available
          console.error("🤖 AI Error:", data.message);
          if (hasTeacherHints) {
            console.log("📚 AI failed, falling back to teacher hints");
            setShowHints(true);
          } else {
            alert(
              data.message || "Unable to generate hint. No hints available.",
            );
          }
        }
      } catch (error) {
        console.error("🤖 AI generation error:", error);
        // Fallback to teacher hints if available
        if (hasTeacherHints) {
          console.log("📚 AI error, falling back to teacher hints");
          setShowHints(true);
        } else {
          alert("Error: Could not generate hint. No hints available.");
        }
      }
    }
  };

  const handleEmojiClick = async (emoji) => {
    console.log(`😊 Emoji clicked: ${emoji}`);
    setShowEmojiDialog(false);

    // Only proceed with hints for neutral, confused, frustrated
    if (emoji === "neutral" || emoji === "confused" || emoji === "frustrated") {
      console.log(`✅ Proceeding with hint request for emotion: ${emoji}`);
      await processHintRequest(pendingHintRequest);
    } else {
      // For happy and excited - skip hints
      console.log(`❌ Skipping hints for emotion: ${emoji}`);
    }

    // Clear pending request
    setPendingHintRequest(null);
  };

  const handleRevealHint = (index) => {
    const questionRevealedHints = revealedHints[currentQuestion] || [];
    if (!questionRevealedHints.includes(index)) {
      setRevealedHints({
        ...revealedHints,
        [currentQuestion]: [...questionRevealedHints, index],
      });
      // Increment hint count for each revealed hint (AI or Teacher)
      setHintsUsedCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting || quizSubmitted) {
      console.log('⚠️ Already submitting or submitted, ignoring click');
      return;
    }

    setIsSubmitting(true);
    console.log('🚀 Starting quiz submission...');

    // Stop camera capture and release camera resources (safely check if camera exists)
    if (typeof camera !== 'undefined' && camera) {
      try {
        camera.stopCapture();
      } catch (e) {
        console.error("Error stopping camera capture:", e);
      }
      try {
        camera.stop();
        console.log("📷 Camera singleton stopped after quiz submission");
      } catch (e) {
        console.error("Error stopping camera:", e);
      }
    }

    // Stop the local videoStream (separate from camera.js singleton)
    if (videoRef.current) {
      console.log("🛑 Stopping videoRef tracks...");
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => {
          console.log("🛑 Stopping track:", track.kind, track.label);
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      videoRef.current.pause();
    }

    if (videoStream) {
      console.log("🛑 Stopping videoStream state tracks...");
      videoStream.getTracks().forEach((track) => {
        console.log("🛑 Stopping track:", track.kind, track.label);
        track.stop();
      });
      setVideoStream(null);
    }

    // Also stop any remaining video elements in the DOM (defensive cleanup)
    try {
      document.querySelectorAll("video").forEach((v) => {
        if (v.srcObject) {
          v.srcObject.getTracks().forEach((t) => {
            console.log("🛑 Stopping orphaned track:", t.kind, t.label);
            t.stop();
          });
          v.srcObject = null;
        }
      });
    } catch (e) {
      console.error("Error cleaning up orphaned video elements:", e);
    }

    setWebcamEnabled(false);
    console.log("📷 All camera resources released after quiz submission");

    try {
      // First, submit quiz answers to backend
      const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
      const answersArray = Object.entries(answers).map(
        ([index, answer]) => answer,
      );

      const token = localStorage.getItem("token");
      console.log("📤 Submitting quiz answers to backend:", quizId);

      try {
        const submitResponse = await axios.post(
          `${API_BASE}/api/teacher-quizzes/${quizId}/submit`,
          {
            answers: answersArray,
            timeTaken,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (submitResponse.data.success) {
          console.log("✅ Quiz submitted successfully:", submitResponse.data);
        }
      } catch (submitError) {
        console.error("❌ Error submitting quiz to /submit endpoint:", submitError);
        // Continue anyway - feedback will still be generated
      }

      // Show results immediately even if submit fails
      setQuizSubmitted(true);
      setIsSubmitting(false);

      // Trigger notification count refresh
      window.dispatchEvent(new Event("refreshNotifications"));
    } catch (submitError) {
      console.error("❌ Error in submit flow:", submitError);
      setIsSubmitting(false);
    }

    // Then generate AI feedback
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const rawScore = calculateScore();

        // Use _id or id, whichever is available
        const userId = user._id || user.id;

        // Calculate time taken
        const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);

        if (!userId) {
          console.error("❌ User ID not found in localStorage");
          setQuizSubmitted(true);
          return;
        }

        console.log("📤 Submitting quiz feedback request:", {
          userId,
          quizId,
          sessionId,
          rawScore,
          totalQuestions: quizData.questions.length,
        });

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/api/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: userId,
            quizId: quizId,
            sessionId: sessionId,
            rawScore: rawScore,
            totalQuestions: quizData.questions.length,
            timeTaken: timeTaken,
            answers: Object.entries(answers).map(([index, answer]) => ({
              questionId: quizData.questions[index].id,
              selectedAnswer: answer,
              isCorrect: answer === quizData.questions[index].correctAnswer,
            })),
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log("🎯 AI Feedback generated:", data.data.feedback);
          console.log(
            "📊 Final Score:",
            data.data.finalScore,
            "/",
            quizData.questions.length,
          );
          console.log("💡 Hints Used:", data.data.hintsUsed);
          console.log("✅ Full feedback data:", data.data);

          setAiFeedback(data.data);
        } else {
          console.error("❌ Feedback API error:", data.message);
          console.error("❌ Full error:", data);
          setAiFeedback({
            feedback: "Unable to generate personalized feedback at this time.",
            emotionalSummary: null,
            hintsUsed: 0,
            finalScore: rawScore,
          });
        }
      }
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      console.error("Error details:", error.message, error.stack);
      setAiFeedback({
        feedback: "Unable to generate personalized feedback at this time.",
        emotionalSummary: null,
        hintsUsed: 0,
        finalScore: 0,
      });
    }

    // Don't set quizSubmitted here - already set after backend confirmation
  };

  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });

    // Calculate score out of 100
    const totalQuestions = quizData.questions.length;
    const marksPerQuestion = 100 / totalQuestions;
    const baseScore = correct * marksPerQuestion;

    // Deduct 1 mark for each hint used
    const finalScore = Math.max(0, baseScore - hintsUsedCount);

    // console.log("📊 Score Calculation:", {
    //   correct,
    //   totalQuestions,
    //   marksPerQuestion,
    //   baseScore,
    //   hintsUsed: hintsUsedCount,
    //   finalScore,
    // });

    return finalScore;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if question matches current filter
  const matchesFilter = (index) => {
    const answered = answers[index] !== undefined;
    const isCurrent = index === currentQuestion;
    const isFlagged = flaggedQuestions.has(index);

    if (activeFilter === "all") return true;
    if (activeFilter === "current") return isCurrent;
    if (activeFilter === "answered") return answered;
    if (activeFilter === "unanswered") return !answered;
    if (activeFilter === "flagged") return isFlagged;

    return true;
  };

  const handleFilterClick = (filter) => {
    // Always switch to the clicked filter (don't toggle off)
    setActiveFilter(filter);
  };

  // Toggle flag for current question
  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const handleDownloadPDF = () => {
    // Create a printable version
    const printWindow = window.open("", "_blank");
    const score = calculateScore();
    const percentage = Math.round(score); // Score is already out of 100
    const correctAnswers = Object.values(answers).filter(
      (ans, idx) => ans === quizData.questions[idx].correctAnswer,
    ).length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quiz Results - ${quizData.title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
          }
          .header { 
            background: #0f766e; 
            color: white; 
            padding: 20px; 
            margin: -40px -40px 30px -40px;
            border-radius: 8px 8px 0 0;
          }
          .header h1 { margin: 0; font-size: 24px; }
          .success { text-align: center; margin-bottom: 30px; }
          .success h2 { color: #047857; margin-bottom: 10px; }
          .summary { 
            background: #f0fdfa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
          }
          .summary-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 15px;
            color: #1f2937;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            text-align: center;
          }
          .summary-item label { 
            display: block; 
            font-size: 12px; 
            color: #6b7280; 
            margin-bottom: 5px;
          }
          .summary-item value { 
            display: block; 
            font-weight: bold; 
            color: #1f2937;
          }
          .score-box { 
            background: #fef2f2; 
            border-left: 4px solid #ef4444; 
            padding: 20px; 
            margin-bottom: 30px;
          }
          .score-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 15px;
          }
          .score-header h3 { margin: 0; font-size: 20px; }
          .score-percentage { 
            font-size: 36px; 
            font-weight: bold; 
            color: #ef4444;
          }
          .question-box { 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .question-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px;
          }
          .question-title { 
            font-weight: bold; 
            color: #1f2937; 
            flex: 1;
          }
          .answer-box { 
            padding: 12px; 
            border-radius: 8px; 
            margin-bottom: 10px;
          }
          .correct-answer { background: #f0fdf4; }
          .wrong-answer { background: #fef2f2; }
          .explanation { background: #eff6ff; }
          .answer-label { 
            font-size: 12px; 
            color: #6b7280; 
            margin-bottom: 5px;
          }
          .answer-text { 
            font-weight: 500; 
            margin: 0;
          }
          .correct-text { color: #166534; }
          .wrong-text { color: #991b1b; }
          .explanation-text { color: #1e40af; }
          .status-icon { 
            font-size: 20px; 
            margin-left: 10px;
          }
          @media print {
            body { padding: 20px; }
            .header { margin: -20px -20px 20px -20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Quiz Results: ${quizData.title}</h1>
        </div>
        
        <div class="success">
          <h2>Quiz Successfully Submitted!</h2>
          <p>Thank you for completing the quiz. Your responses have been recorded.</p>
        </div>
        
        <div class="summary">
          <div class="summary-title">⭐ Quiz Summary</div>
          <div class="summary-grid">
            <div class="summary-item">
              <label>Date Submitted:</label>
              <value>${new Date().toLocaleDateString()}</value>
            </div>
            <div class="summary-item">
              <label>Time Taken:</label>
              <value>${Math.floor(totalTime / 60)} minutes</value>
            </div>
            <div class="summary-item">
              <label>Questions Answered:</label>
              <value>${Object.keys(answers).length} of ${
                quizData.questions.length
              }</value>
            </div>
          </div>
        </div>
        
        <div class="score-box">
          <div class="score-header">
            <h3>Your Score</h3>
            <div class="score-percentage">${percentage}%</div>
          </div>
          <p><strong>Correct Answers:</strong> ${correctAnswers} out of ${
            quizData.questions.length
          }</p>
          ${
            hintsUsedCount > 0
              ? `<p><strong>Hints Used Penalty:</strong> -${hintsUsedCount} mark${
                  hintsUsedCount > 1 ? "s" : ""
                }</p>`
              : ""
          }
          <p><strong>Final Score:</strong> ${Math.round(score)} / 100</p>
        </div>
        
        ${quizData.questions
          .map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect =
              question.type === "mcq"
                ? userAnswer === question.correctAnswer
                : false;

            return `
            <div class="question-box">
              <div class="question-header">
                <div class="question-title">
                  Question ${question.id}: ${question.text}
                </div>
                ${
                  question.type === "mcq"
                    ? `<span class="status-icon">${
                        isCorrect ? "✓" : "✗"
                      }</span>`
                    : ""
                }
              </div>
              
              ${
                userAnswer !== undefined && userAnswer !== ""
                  ? `
                <div class="answer-box ${
                  question.type === "mcq"
                    ? isCorrect
                      ? "correct-answer"
                      : "wrong-answer"
                    : "explanation"
                }">
                  <div class="answer-label">Your Answer:</div>
                  <p class="answer-text ${
                    question.type === "mcq"
                      ? isCorrect
                        ? "correct-text"
                        : "wrong-text"
                      : "explanation-text"
                  }">
                    ${
                      question.type === "mcq"
                        ? question.options[userAnswer]
                        : userAnswer
                    }
                  </p>
                </div>
              `
                  : ""
              }
              
              ${
                question.type === "mcq" && !isCorrect
                  ? `
                <div class="answer-box correct-answer">
                  <div class="answer-label">Correct Answer:</div>
                  <p class="answer-text correct-text">${
                    question.options[question.correctAnswer]
                  }</p>
                </div>
              `
                  : ""
              }
              
              ${
                question.type === "short" && question.shortAnswer
                  ? `
                <div class="answer-box correct-answer">
                  <div class="answer-label">Expected Answer:</div>
                  <p class="answer-text correct-text">${question.shortAnswer}</p>
                </div>
              `
                  : ""
              }
              
              <div class="answer-box explanation">
                <div class="answer-label">Explanation:</div>
                <p class="answer-text explanation-text">${
                  question.hints && question.hints[3]
                    ? question.hints[3]
                    : "No explanation available"
                }</p>
              </div>
            </div>
          `;
          })
          .join("")}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Automatically trigger print dialog with PDF option
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Show loading state
  if (loading || !quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-700 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (quizSubmitted) {
    const score = calculateScore();
    const percentage = Math.round(score); // Score is already out of 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8">
          <div className="bg-teal-700 text-white px-6 py-4 rounded-t-xl -mx-8 -mt-8 mb-8">
            <h2 className="text-2xl font-bold">
              Quiz Results: {quizData.title}
            </h2>
          </div>

          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <Check className="w-16 h-16 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">
              Quiz Successfully Submitted!
            </h3>
            <p className="text-gray-600">
              Thank you for completing the quiz. Your responses have been
              recorded.
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-yellow-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h4 className="text-xl font-semibold text-gray-800">
                Quiz Summary
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-600 text-sm mb-1">Date Submitted:</p>
                <p className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Time Taken:</p>
                <p className="font-semibold text-gray-800">
                  {Math.floor(totalTime / 60)} minutes
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">
                  Questions Answered:
                </p>
                <p className="font-semibold text-gray-800">
                  {Object.keys(answers).length} of {quizData.questions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8 rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Your Score</h3>
              <div className="text-5xl font-bold text-red-500">
                {percentage}%
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-red-200">
                <span className="text-gray-700">Correct Answers:</span>
                <span className="font-bold text-green-600">
                  {
                    Object.values(answers).filter(
                      (ans, idx) =>
                        ans === quizData.questions[idx].correctAnswer,
                    ).length
                  }{" "}
                  / {quizData.questions.length}
                </span>
              </div>

              {hintsUsedCount > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-red-200">
                  <span className="text-gray-700">Hints Used Penalty:</span>
                  <span className="font-bold text-orange-600">
                    - {hintsUsedCount} mark{hintsUsedCount > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 bg-white px-3 rounded-lg">
                <span className="text-lg font-bold text-gray-800">
                  Final Score:
                </span>
                <span className="text-2xl font-bold text-red-500">
                  {Math.round(score)} / 100
                </span>
              </div>
            </div>

            {hintsUsedCount > 0 && (
              <p className="text-sm text-gray-600 italic">
                💡 Each hint used deducts 1 mark from your final score
              </p>
            )}
          </div>

          {/* AI Personalized Feedback */}
          {aiFeedback && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 mb-8 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <svg
                  className="w-7 h-7 text-blue-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-xl font-bold text-gray-800">
                  🤖 Personalized Performance Feedback
                </h3>
              </div>
              {aiFeedback.feedback ? (
                <>
                  <p className="text-gray-700 leading-relaxed text-lg mb-4 italic">
                    "{aiFeedback.feedback}"
                  </p>
                  {aiFeedback.emotionalSummary &&
                    aiFeedback.emotionalSummary.totalCaptures > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-blue-700">
                            📊 Emotional Analysis:
                          </span>{" "}
                          Your most common emotional state was{" "}
                          <span className="font-semibold">
                            {aiFeedback.emotionalSummary.mostCommonEmotion}
                          </span>
                          {aiFeedback.emotionalSummary.confusedCount > 0 &&
                            `. Moments of confusion were detected ${
                              aiFeedback.emotionalSummary.confusedCount
                            } time${
                              aiFeedback.emotionalSummary.confusedCount > 1
                                ? "s"
                                : ""
                            }`}
                          .
                        </p>
                      </div>
                    )}
                </>
              ) : (
                <p className="text-gray-600 italic">
                  Generating personalized feedback based on your performance...
                </p>
              )}
            </div>
          )}

          {quizData.questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect =
              question.type === "mcq"
                ? userAnswer === question.correctAnswer
                : false;

            return (
              <div
                key={question.id}
                className="mb-6 border rounded-lg p-6 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-semibold text-gray-800 flex-1">
                    Question {question.id}: {question.text}
                  </h4>
                  {question.type === "mcq" &&
                    (isCorrect ? (
                      <Check className="w-6 h-6 text-green-500 flex-shrink-0 ml-4" />
                    ) : (
                      <X className="w-6 h-6 text-red-500 flex-shrink-0 ml-4" />
                    ))}
                </div>

                <div className="space-y-3">
                  {userAnswer !== undefined && userAnswer !== "" && (
                    <div
                      className={`p-3 rounded-lg ${
                        question.type === "mcq"
                          ? isCorrect
                            ? "bg-green-50"
                            : "bg-red-50"
                          : "bg-blue-50"
                      }`}
                    >
                      <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                      <p
                        className={`font-medium ${
                          question.type === "mcq"
                            ? isCorrect
                              ? "text-green-800"
                              : "text-red-800"
                            : "text-blue-800"
                        }`}
                      >
                        {question.type === "mcq"
                          ? question.options[userAnswer]
                          : userAnswer}
                      </p>
                    </div>
                  )}

                  {question.type === "mcq" && !isCorrect && (
                    <div className="p-3 rounded-lg bg-teal-50">
                      <p className="text-sm text-gray-600 mb-1">
                        Correct Answer:
                      </p>
                      <p className="font-medium text-teal-800">
                        {question.options[question.correctAnswer]}
                      </p>
                    </div>
                  )}

                  {question.type === "short" && question.shortAnswer && (
                    <div className="p-3 rounded-lg bg-teal-50">
                      <p className="text-sm text-gray-600 mb-1">
                        Expected Answer:
                      </p>
                      <p className="font-medium text-teal-800">
                        {question.shortAnswer}
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-sm text-gray-600 mb-1">Explanation:</p>
                    <p className="text-blue-800">
                      {question.hints && question.hints[3]
                        ? question.hints[3]
                        : "No explanation available"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors"
            >
              Download as PDF
              <img
                src={DownloadIcon}
                alt="download icon"
                className="w-5 h-5 object-contain"
              />
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="flex items-center gap-2 bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors"
            >
              <Home className="w-5 h-5" />
              Return Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-green-100 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Questions</h2>

        <div className="grid grid-cols-4 gap-2 mb-8">
          {quizData.questions.map((_, index) => {
            const answered = answers[index] !== undefined;
            const isCurrent = index === currentQuestion;
            const highlightQuestion = matchesFilter(index);
            const isFlagged = flaggedQuestions.has(index);

            return (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  w-12 h-12 rounded-lg font-semibold flex items-center justify-center transition-all relative
                  ${
                    isCurrent && activeFilter === "all"
                      ? "bg-teal-700 text-white ring-4 ring-teal-300"
                      : isCurrent && activeFilter !== "all"
                        ? "bg-teal-700 text-white"
                        : answered
                          ? "bg-white text-teal-700 border-2 border-teal-700"
                          : "bg-white text-gray-400 border-2 border-gray-200"
                  }
                  ${
                    highlightQuestion && !isCurrent && activeFilter !== "all"
                      ? "bg-teal-50"
                      : ""
                  }
                  ${
                    !highlightQuestion && activeFilter !== "all"
                      ? "opacity-40"
                      : ""
                  }
                `}
              >
                {index + 1}
                {answered && !isCurrent && (
                  <div className="absolute -top-1 -right-1 bg-teal-700 rounded-full w-4 h-4 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                {isFlagged && (
                  <div className="absolute -top-1 -left-1">
                    <Flag className="w-3 h-3 text-orange-500 fill-orange-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-3 mb-8">
          <button
            onClick={() => handleFilterClick("current")}
            className="w-full flex items-center gap-3 p-2 rounded transition-colors hover:bg-green-50"
          >
            <div className="w-5 h-5 rounded border-2 border-teal-600 bg-white flex items-center justify-center flex-shrink-0">
              {activeFilter === "current" && (
                <Check className="w-3.5 h-3.5 text-teal-600" strokeWidth={3} />
              )}
            </div>
            <span className="text-sm text-gray-700">Current question</span>
          </button>
          <button
            onClick={() => handleFilterClick("answered")}
            className="w-full flex items-center gap-3 p-2 rounded transition-colors hover:bg-green-50"
          >
            <div className="w-5 h-5 rounded border-2 border-teal-600 bg-white flex items-center justify-center flex-shrink-0">
              {activeFilter === "answered" && (
                <Check className="w-3.5 h-3.5 text-teal-600" strokeWidth={3} />
              )}
            </div>
            <span className="text-sm text-gray-700">Answered</span>
          </button>
          <button
            onClick={() => handleFilterClick("unanswered")}
            className="w-full flex items-center gap-3 p-2 rounded transition-colors hover:bg-green-50"
          >
            <div className="w-5 h-5 rounded border-2 border-teal-600 bg-white flex items-center justify-center flex-shrink-0">
              {activeFilter === "unanswered" && (
                <Check className="w-3.5 h-3.5 text-teal-600" strokeWidth={3} />
              )}
            </div>
            <span className="text-sm text-gray-700">Unanswered</span>
          </button>
          <button
            onClick={() => handleFilterClick("flagged")}
            className="w-full flex items-center gap-3 p-2 rounded transition-colors hover:bg-green-50"
          >
            <div className="w-5 h-5 rounded border-2 border-teal-600 bg-white flex items-center justify-center flex-shrink-0">
              {activeFilter === "flagged" && (
                <Check className="w-3.5 h-3.5 text-teal-600" strokeWidth={3} />
              )}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-gray-700">Flagged</span>
              {flaggedQuestions.size > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {flaggedQuestions.size}
                </span>
              )}
            </div>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || quizSubmitted}
          className={`w-full py-3 rounded-lg font-semibold transition-colors mb-8 ${
            isSubmitting || quizSubmitted
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-teal-700 text-white hover:bg-teal-800'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </button>

        <div className="mt-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src={headerLogo}
              alt="EMEXA Logo"
              className="w-50 h-50 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-800">
                {quizData.title}
              </h1>
              <div className="flex items-center gap-2 text-teal-700">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">{formatTime(totalTime)}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestion + 1) / quizData.questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {currentQuestion + 1} / {quizData.questions.length} Questions
            </p>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-md p-8 relative">
            {showBulb && bulbVisible && (
              <div className="absolute top-6 right-6 flex flex-col items-center gap-1">
                <button
                  onClick={handleBulbClick}
                  className="animate-bounce"
                  title={
                    cameraPermissionLoading
                      ? "Checking camera permissions..."
                      : webcamEnabled
                        ? "AI Hint Available (Camera Enabled)"
                        : "Teacher Hints Available (Camera Disabled)"
                  }
                  disabled={cameraPermissionLoading}
                >
                  <Lightbulb
                    className={`w-10 h-10 ${
                      cameraPermissionLoading
                        ? "text-gray-400 fill-gray-200"
                        : "text-yellow-500 fill-yellow-200"
                    }`}
                  />
                </button>
                {/* Hint type indicator */}
              </div>
            )}

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  Question {question.id}
                </h2>
                <button
                  onClick={toggleFlag}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    flaggedQuestions.has(currentQuestion)
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : "bg-gray-100 text-gray-500 border border-gray-300 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                  }`}
                  title={
                    flaggedQuestions.has(currentQuestion)
                      ? "Remove flag"
                      : "Flag for review"
                  }
                >
                  <Flag
                    className={`w-4 h-4 ${
                      flaggedQuestions.has(currentQuestion)
                        ? "fill-orange-600"
                        : ""
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {flaggedQuestions.has(currentQuestion) ? "Flagged" : "Flag"}
                  </span>
                </button>
              </div>
            </div>
            <p className="text-lg text-gray-700 mb-8">{question.text}</p>

            {/* Options for MCQ or Text Input for Short Answer */}
            {question.type === "mcq" ? (
              <div className="space-y-4 mb-8">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      ${
                        answers[currentQuestion] === index
                          ? "border-teal-600 bg-teal-50 ring-2 ring-teal-200"
                          : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${
                          answers[currentQuestion] === index
                            ? "border-teal-600 bg-teal-600"
                            : "border-gray-300"
                        }
                      `}
                      >
                        {answers[currentQuestion] === index && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-gray-800">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-8">
                <textarea
                  value={answers[currentQuestion] || ""}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [currentQuestion]: e.target.value,
                    })
                  }
                  placeholder="Type your answer here..."
                  rows="4"
                  className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
                />
              </div>
            )}

            {/* Hints Section */}
            {showHints && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-300 mb-6">
                <div className="flex items-center gap-2 mb-5">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                  <h3 className="font-bold text-lg text-gray-800">
                    {aiHints[currentQuestion]
                      ? `🤖 AI-Generated Hints (${
                          (Array.isArray(aiHints[currentQuestion])
                            ? aiHints[currentQuestion]
                            : [aiHints[currentQuestion]]
                          ).length
                        })`
                      : "📚 Teacher Hints"}
                  </h3>
                </div>

                {/* AI Hints (if available) */}
                {aiHints[currentQuestion] ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      You have{" "}
                      {
                        (Array.isArray(aiHints[currentQuestion])
                          ? aiHints[currentQuestion]
                          : [aiHints[currentQuestion]]
                        ).length
                      }{" "}
                      hints available. Each hint provides additional
                      information.
                    </p>

                    <div className="space-y-3">
                      {(Array.isArray(aiHints[currentQuestion])
                        ? aiHints[currentQuestion]
                        : [aiHints[currentQuestion]]
                      ).map((hint, index) => {
                        const questionRevealedHints =
                          revealedHints[currentQuestion] || [];
                        return (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-700">
                                Hint {index + 1}
                              </span>
                              {!questionRevealedHints.includes(index) && (
                                <button
                                  onClick={() => handleRevealHint(index)}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Reveal
                                </button>
                              )}
                            </div>
                            {questionRevealedHints.includes(index) && (
                              <div className="flex items-start gap-3">
                                <p className="text-gray-700 flex-1">{hint}</p>
                                {index === 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium flex-shrink-0">
                                    -1 mark
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      You have{" "}
                      {
                        question.hints.filter(
                          (hint) => hint && hint.trim() !== "",
                        ).length
                      }{" "}
                      hints available. Each hint provides additional
                      information.
                    </p>

                    <div className="space-y-3">
                      {question.hints
                        .map((hint, index) => ({ hint, index }))
                        .filter(({ hint }) => hint && hint.trim() !== "")
                        .map(({ hint, index }) => {
                          const questionRevealedHints =
                            revealedHints[currentQuestion] || [];
                          return (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-700">
                                  Hint {index + 1}
                                </span>
                                {!questionRevealedHints.includes(index) && (
                                  <button
                                    onClick={() => handleRevealHint(index)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    Reveal
                                  </button>
                                )}
                              </div>
                              {questionRevealedHints.includes(index) && (
                                <p className="text-gray-700">{hint}</p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors
                  ${
                    currentQuestion === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {currentQuestion === quizData.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || quizSubmitted}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                    isSubmitting || quizSubmitted
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition-colors"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Permission Dialog */}
      {showCameraPermissionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">
              📷 Camera Permission Required
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {cameraPermissionDenied
                ? "Camera permission was denied. You can still take the quiz, but AI-powered hints won't be available."
                : "To enable emotion-based AI hints, we need camera access. Your video stream will only be used to detect emotions - no recordings are stored."}
            </p>
            <div className="flex gap-4">
              {!cameraPermissionDenied ? (
                <>
                  <button
                    onClick={() => {
                      console.log("⏭️  Skipping camera permission");
                      setCameraPermissionLoading(false);
                      setWebcamEnabled(false);
                      setShowCameraPermissionDialog(false);
                      console.log(
                        "🎯 CAMERA PERMISSION FINAL: ❌ DENIED - Teacher hints only",
                      );
                    }}
                    className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={() => requestCameraPermission()}
                    className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition-colors"
                  >
                    Allow Camera
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowCameraPermissionDialog(false)}
                  className="w-full px-4 py-3 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition-colors"
                >
                  Continue Without Camera
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emoji Dialog */}
      {showEmojiDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">
              How are you feeling?
            </h3>
            <div className="flex justify-around">
              {[
                { emoji: "😊", label: "Happy", value: "happy" },
                { emoji: "😐", label: "Neutral", value: "neutral" },
                { emoji: "😕", label: "Confused", value: "confused" },
                { emoji: "😤", label: "Frustrated", value: "frustrated" },
                { emoji: "😃", label: "Excited", value: "excited" },
              ].map(({ emoji, label, value }) => (
                <button
                  key={value}
                  onClick={() => handleEmojiClick(value)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className="text-xs text-gray-600">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden webcam video for AI emotion tracking */}
      {!quizSubmitted && !showResults && webcamEnabled && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: "none" }}
        />
      )}
    </div>
  );
};

export default QuizPage;
