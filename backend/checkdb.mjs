import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

// Check attempts over time for a student
const attempts = await db.collection('quizattempts')
  .find({}).sort({ completedAt: -1 }).limit(5).toArray();
console.log('Recent attempts fields:', JSON.stringify(attempts[0], null, 2));

// Check emotion logs count
const emotionCount = await db.collection('emotionlogs').countDocuments();
console.log('Total emotion logs:', emotionCount);

// Check hint usages
const hintCount = await db.collection('hintusages').countDocuments();
console.log('Total hint usages:', hintCount);
const hint = await db.collection('hintusages').findOne({});
console.log('Hint usage fields:', JSON.stringify(hint, null, 2));

await mongoose.disconnect();
const attempt = await db.collection('quizattempts').findOne({});
console.log('userId:', attempt?.userId);

// Check students collection
const student = await db.collection('students').findOne({ _id: attempt?.userId });
console.log('Found in students:', student?.name, student?.email);

// Check users collection count
const userCount = await db.collection('users').countDocuments({ role: 'student' });
const studentCount = await db.collection('students').countDocuments();
console.log('Users with role=student:', userCount);
console.log('Students collection count:', studentCount);
