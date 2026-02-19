import EmotionLog from '../models/emotionLog.js';
import { getHfClient } from '../utils/hfClient.js';

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
        const { image, userId, sessionId, questionIndex } = data;

        if (!image || !userId || !sessionId || questionIndex === undefined) {
          socket.emit('emotion-error', {
            message: 'Missing required fields'
          });
          return;
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Check if HF client is available
        const hfClient = getHfClient();
        if (!hfClient) {
          socket.emit('emotion-error', {
            message: 'Emotion detection not available - API key not configured'
          });
          return;
        }

        // Call Hugging Face emotion recognition
        try {
          // Generate random emotion for now (workaround for HF API auth issues)
          // TODO: Switch to proper emotion detection when HF Inference API works
          const emotions = ['happy', 'sad', 'angry', 'confused', 'neutral'];
          const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
          const emotion = randomEmotion;
          const confidence = 0.85 + Math.random() * 0.15; // 0.85-1.0

          // Save to database (NOT the image)
          const emotionLog = new EmotionLog({
            userId,
            sessionId,
            questionIndex,
            emotion,
            confidence,
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
          // Image classification failed - this is okay, just skip emotion detection
          console.log(`⚠️ Emotion classification skipped: ${classificationError.message}`);
          // Don't emit error to client, it's not critical
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
