import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

console.log('--- Sample of actual student names in DB (first 15) ---');
const sample = await db.collection('students').find({}).project({ name: 1, email: 1, createdAt: 1 }).limit(15).toArray();
sample.forEach(s => console.log(s.name, '|', s.email, '|', s.createdAt));

console.log('\n--- Total students in DB ---');
console.log(await db.collection('students').countDocuments());

console.log('\n--- Punarji: full record ---');
const p = await db.collection('students').findOne({ name: /Punarji/i });
console.log(JSON.stringify(p, null, 2));

console.log('\n--- Punarji: any quiz attempts? ---');
if (p) {
  const attempts = await db.collection('quizattempts').find({ userId: p._id }).toArray();
  console.log('Attempts found:', attempts.length);
  attempts.forEach(a => console.log(a.completedAt, a.quizId));
}

await mongoose.disconnect();
