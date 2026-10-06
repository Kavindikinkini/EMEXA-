import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const start = new Date('2026-05-03T00:00:00Z');
const end = new Date('2026-05-11T00:00:00Z');

// Quiz subjects/titles used during UAT
const attempts = await db.collection('quizattempts').find({
  completedAt: { $gte: start, $lt: end }
}).toArray();

const quizIds = [...new Set(attempts.map(a => a.quizId?.toString()).filter(Boolean))];
const quizzes = await db.collection('quizzes').find({
  _id: { $in: quizIds.map(id => new mongoose.Types.ObjectId(id)) }
}).project({ title: 1, subject: 1, category: 1, questions: 1 }).toArray();

console.log('Quizzes used during UAT:', quizzes.map(q => ({
  title: q.title, subject: q.subject, category: q.category, numQuestions: q.questions?.length
})));

// Session duration: createdAt vs completedAt per attempt
const durations = attempts.map(a => {
  if (!a.createdAt || !a.completedAt) return null;
  return (new Date(a.completedAt) - new Date(a.createdAt)) / 1000 / 60; // minutes
}).filter(Boolean);

const avgDuration = durations.reduce((s, d) => s + d, 0) / durations.length;
console.log('Average session duration (minutes):', avgDuration.toFixed(1));
console.log('Number of timed attempts:', durations.length, 'of', attempts.length, 'total');

await mongoose.disconnect();
