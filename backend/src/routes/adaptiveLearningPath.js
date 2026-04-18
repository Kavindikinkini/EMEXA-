import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import {
  logEmotionSession,
  getLearningPath,
  getEmotionHistory,
  getTopicSummary,
  getBestStudyTime,
  rebuildPath,
} from "../controllers/adaptiveLearningPathController.js";
router.use(protect);

router.post("/session", logEmotionSession);       // log end-of-quiz emotion data
router.get("/", getLearningPath);                 // get full adaptive path
router.get("/emotion-history", getEmotionHistory); // chart data per topic
router.get("/topic-summary", getTopicSummary);    // aggregated topic stats
router.get("/best-time", getBestStudyTime);       // optimal study time
router.post("/rebuild", rebuildPath);             // manual rebuild

export default router;