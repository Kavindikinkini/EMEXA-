import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // MUST BE FIRST!
console.log(
  "🔍 .env loaded, MONGO_URI:",
  process.env.MONGO_URI ? "SET" : "NOT SET"
);

// Auto-restart enabled with nodemon
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import cors from "cors";
import os from "os";
import { fileURLToPath } from "url";
import { cloudinary } from "./src/config/cloudinary.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import { connectDB } from "./src/services/dbService.js";
import userRoutes from "./src/routes/userRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import quizRoutes from "./src/routes/quizroutes.js";
import cameraRoutes from "./src/routes/cameraRoutes.js";
import teacherRoutes from "./src/routes/teacherRoutes.js";
import wellnessRoutes from "./src/routes/wellnessRoutes.js";
import teacherQuizRoutes from "./src/routes/teacherQuizRoutes.js";
// AI Feature Routes
import emotionRoutes from "./src/routes/emotionRoutes.js";
import hintRoutes from "./src/routes/hintRoutes.js";
import feedbackRoutes from "./src/routes/feedbackRoutes.js";
// Socket handler
import { initializeEmotionSocket } from "./src/socket/emotionSocket.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

import aiQuizRoutes from "./src/routes/aiQuizRoutes.js";
import wellnessAIRoutes from "./src/routes/wellnessAIRoutes.js";
import moodRoutes from "./src/routes/moodRoutes.js";
import helpSupportRoutes from "./src/routes/helpSupportRoutes.js";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to DB
connectDB();

// Initialize emotion tracking socket
initializeEmotionSocket(io);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Serve uploaded files
try {
  const uploadsPath = path.resolve(__dirname, "uploads");
  fs.mkdirSync(uploadsPath, { recursive: true });
  app.use("/uploads", express.static(uploadsPath));
  console.log("📁 Uploads directory:", uploadsPath);
} catch (err) {
  console.error("Failed to create uploads folder:", err);
}

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/camera", cameraRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/teacher-quizzes", teacherQuizRoutes);
// AI Feature Routes
app.use("/api/emotion", emotionRoutes);
app.use("/api/hint", hintRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes); 
app.use("/api/ai-quiz", aiQuizRoutes);
app.use("/api/wellness-ai", wellnessAIRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/help-support", helpSupportRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "EMEXA API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    cloudinary: {
      configured: !!(
        process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY
      ),
    },
    ai: {
      gemini: !!process.env.GEMINI_API_KEY,
      huggingface: !!process.env.HUGGING_FACE_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
    },
  });
});

app.get("/health", (req, res) => {
  const ifaces = os.networkInterfaces();
  return res.json({
    ok: true,
    host: req.hostname,
    uptime: process.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({
    ok: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

httpServer.listen(PORT, HOST, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 EMEXA Server Started Successfully!");
  console.log("=".repeat(50));
  console.log(`📍 Server URL: http://${HOST}:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `☁️  Cloudinary: ${
      process.env.CLOUDINARY_CLOUD_NAME
        ? "✅ " + process.env.CLOUDINARY_CLOUD_NAME
        : "❌ Not configured"
    }`
  );
  console.log(
    `🤖 AI Features: ${
      process.env.HF_API_KEY
        ? "✅ Hugging Face API configured"
        : "⚠️  HF_API_KEY not set"
    }`
  );
  console.log(`🔌 WebSocket: ✅ Socket.IO running on /emotion namespace`);
  console.log("=".repeat(50) + "\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM: closing server");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("\n👋 SIGINT: closing server");
  process.exit(0);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(1);
});
