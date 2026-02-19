import express from 'express';
import cameraController from '../controllers/cameraController.js';

const router = express.Router();

// POST /api/camera/frame
router.post('/frame', cameraController.postFrame);

export default router;
