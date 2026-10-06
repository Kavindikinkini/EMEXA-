import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const start = new Date('2026-05-01T00:00:00Z');
const end = new Date('2026-06-01T00:00:00Z');

const byDay = await db.collection('emotionlogs').aggregate([
  { $match: { timestamp: { $gte: start, $lt: end } } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]).toArray();
console.log('All of May 2026 by day:');
byDay.forEach(d => console.log(d._id, '->', d.count));

// all quizattempts in May, completed or not
const allAttempts = await db.collection('quizattempts').countDocuments({ createdAt: { $gte: start, $lt: end } });
const completedAttempts = await db.collection('quizattempts').countDocuments({ completedAt: { $gte: start, $lt: end } });
console.log('All May quizattempts (created):', allAttempts);
console.log('Completed May quizattempts:', completedAttempts);

await mongoose.disconnect();
