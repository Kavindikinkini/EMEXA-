// backend/src/routes/reflectionRoutes.js
import express from 'express';
import {
  submitReflection,
  getMyJournal,
  checkReflection,
  getStudentJournal
} from '../controllers/selfReflectionController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/',                  protect, authorize('student'),          submitReflection);
router.get('/my-journal',         protect, authorize('student'),          getMyJournal);
router.get('/check/:attemptId',   protect, authorize('student'),          checkReflection);
router.get('/student/:userId',    protect, authorize('teacher', 'admin'), getStudentJournal);

export default router;