import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const start = new Date('2026-05-03T00:00:00Z');
const end = new Date('2026-05-11T00:00:00Z');
const negLabels = ['sad', 'angry', 'confused', 'anxious'];

const hints = await db.collection('hintusages').find({ timestamp: { $gte: start, $lt: end } }).toArray();
let facial = 0, inactivity = 0;
for (const h of hints) {
  const wStart = new Date(h.timestamp.getTime() - 60000);
  const m = await db.collection('emotionlogs').findOne({ sessionId: h.sessionId, emotion: { $in: negLabels }, timestamp: { $gte: wStart, $lte: h.timestamp } });
  if (m) facial++; else inactivity++;
}
console.log('Total hints in UAT window:', hints.length);
console.log('Facial-triggered:', facial);
console.log('Inactivity-triggered:', inactivity);

const attempts = await db.collection('quizattempts').find({ completedAt: { $gte: start, $lt: end } }).toArray();
const durations = attempts.map(a => a.createdAt && a.completedAt ? (new Date(a.completedAt) - new Date(a.createdAt)) / 60000 : null).filter(Boolean);
const avgDur = durations.reduce((s, d) => s + d, 0) / durations.length;
console.log('Avg session duration (min):', avgDur.toFixed(1), 'from', durations.length, 'of', attempts.length, 'attempts');

const quizIds = [...new Set(attempts.map(a => a.quizId?.toString()).filter(Boolean))];
const quizzes = await db.collection('quizzes').find({ _id: { $in: quizIds.map(id => new mongoose.Types.ObjectId(id)) } }).project({ title: 1, subject: 1, category: 1, questions: 1 }).toArray();
console.log('Quizzes used:', JSON.stringify(quizzes.map(q => ({ title: q.title, subject: q.subject, category: q.category, numQuestions: q.questions?.length })), null, 2));

await mongoose.disconnect();
