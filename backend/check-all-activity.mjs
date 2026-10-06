import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const byDay = await db.collection('quizattempts').aggregate([
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 25 }
]).toArray();
console.log('Top 25 days by quiz-attempt volume:');
byDay.forEach(d => console.log(d._id, '->', d.count));

const hintByDay = await db.collection('hintusages').aggregate([
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 15 }
]).toArray();
console.log('\nTop 15 days by hint-usage volume:');
hintByDay.forEach(d => console.log(d._id, '->', d.count));

await mongoose.disconnect();
