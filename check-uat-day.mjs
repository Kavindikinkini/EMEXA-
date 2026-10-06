import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const start = new Date('2026-05-12T00:00:00Z');
const end = new Date('2026-05-15T00:00:00Z');

const total = await db.collection('emotionlogs').countDocuments({
  timestamp: { $gte: start, $lt: end }
});
const fallbackLike = await db.collection('emotionlogs').countDocuments({
  timestamp: { $gte: start, $lt: end },
  confidence: 1.0,
  emotion: 'neutral'
});

console.log('UAT-window emotionlogs total:', total);
console.log('UAT-window fallback-signature count:', fallbackLike);

// also check distinct sessionIds in that window, to sanity-check against ~50 attempts
const sessions = await db.collection('emotionlogs').distinct('sessionId', {
  timestamp: { $gte: start, $lt: end }
});
console.log('Distinct sessionIds in window:', sessions.length);

await mongoose.disconnect();
