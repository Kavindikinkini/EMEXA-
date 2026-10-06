import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const start = new Date('2026-05-13T00:00:00Z');
const end = new Date('2026-05-21T00:00:00Z');

const byDay = await db.collection('emotionlogs').aggregate([
  { $match: { timestamp: { $gte: start, $lt: end } } },
  { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      count: { $sum: 1 }
  }},
  { $sort: { _id: 1 } }
]).toArray();

console.log('May 13-20 by day:');
byDay.forEach(d => console.log(d._id, '->', d.count));

const total = await db.collection('emotionlogs').countDocuments({ timestamp: { $gte: start, $lt: end } });
const fallbackLike = await db.collection('emotionlogs').countDocuments({
  timestamp: { $gte: start, $lt: end }, confidence: 1.0, emotion: 'neutral'
});
const sessions = await db.collection('emotionlogs').distinct('sessionId', { timestamp: { $gte: start, $lt: end } });

console.log('Total in window:', total);
console.log('Fallback-signature count:', fallbackLike);
console.log('Distinct sessions:', sessions.length);

const attempts = await db.collection('quizattempts').countDocuments({ completedAt: { $gte: start, $lt: end } });
console.log('Quiz attempts completed in window:', attempts);

await mongoose.disconnect();
