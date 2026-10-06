import EmotionLog from '../models/emotionLog.js';
import { classifyEmotion } from '../utils/emotionClassifier.js';

// Create a WebSocket server that receives webcam snapshots
// every 1 minute, sends them to the emotion detection API,
// and stores only emotion label and timestamp in MongoDB.

export const initializeEmotionSocket = (io) => {
  // Create a namespace for emotion tracking
  const emotionNamespace = io.of('/emotion');

  emotionNamespace.on('connection', (socket) => {
    console.log(`✅ Emotion socket connected: ${socket.id}`);

    // Handle emotion snapshot
    socket.on('emotion-snapshot', async (data) => {
      try {
        const { image, userId, sessionId, questionIndex, quizId } = data;

        if (!image || !userId || !sessionId || questionIndex === undefined) {
          socket.emit('emotion-error', {
            message: 'Missing required fields'
          });
          return;
        }

        // Convert base64 to buffer, keeping the real MIME type from the
        // data URL (the HF API rejects requests with no content type)
        const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
        const mimeType = match ? match[1] : 'image/jpeg';
        const base64Data = match ? match[2] : image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Call the REAL Hugging Face emotion recognition — same shared
        // function and label/friction mapping emotionController.js uses.
        // No random fallback.
        try {
          const { emotion, confidence, frictionScore, isFallback } =
            await classifyEmotion(imageBuffer, mimeType);

          if (isFallback) {
            console.warn('⚠️ HF_API_KEY not configured — using neutral default, not a live reading');
          }

          // Save to database (NOT the image) — same fields as the REST
          // controller so heatmap/analytics queries see consistent data
          // regardless of which entry point produced them.
          const emotionLog = new EmotionLog({
            userId,
            sessionId,
            questionIndex,
            quizId: quizId || null,
            emotion,
            confidence,
            frictionScore,
            timestamp: new Date()
          });

          await emotionLog.save();

          // Send result back to client
          socket.emit('emotion-detected', {
            emotion,
            confidence,
            questionIndex,
            timestamp: emotionLog.timestamp
          });

          console.log(`😊 Emotion detected for user ${userId}: ${emotion} (${Math.round(confidence * 100)}%)`);
        } catch (classificationError) {
          // Real classification failed or timed out — this is an
          // unknown/no-classification state, NOT a fabricated label.
          // Skip the trigger cycle; do not emit a fake result.
          console.log(`⚠️ Emotion classification skipped: ${classificationError.message}`);
          socket.emit('emotion-error', {
            message: 'Emotion classification unavailable for this frame'
          });
        }
      } catch (error) {
        console.error('Emotion detection error:', error);
        socket.emit('emotion-error', {
          message: 'Error processing emotion',
          error: error.message
        });
      }
    });

    // Handle join session room
    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
      console.log(`User joined session: ${sessionId}`);
    });

    // Handle leave session room
    socket.on('leave-session', (sessionId) => {
      socket.leave(sessionId);
      console.log(`User left session: ${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Emotion socket disconnected: ${socket.id}`);
    });
  });

  return emotionNamespace;
};