import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

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
