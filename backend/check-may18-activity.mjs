import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const start = new Date('2026-05-18T00:00:00Z');
const end = new Date('2026-05-20T00:00:00Z');

const attempts = await db.collection('quizattempts').find({ completedAt: { $gte: start, $lt: end } }).toArray();
console.log('Quiz attempts May 18-19:', attempts.length);

const userIds = [...new Set(attempts.map(a => a.userId?.toString()).filter(Boolean))];
console.log('Distinct userIds:', userIds.length);

const students = await db.collection('students').find({ _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } }).project({ name: 1, email: 1 }).toArray();
students.forEach(s => console.log(s.name, '|', s.email));

console.log('\nAttempts per user:');
for (const uid of userIds) {
  const count = attempts.filter(a => a.userId?.toString() === uid).length;
  const student = students.find(s => s._id.toString() === uid);
  console.log(student?.name || uid, '->', count, 'attempts');
}

await mongoose.disconnect();
