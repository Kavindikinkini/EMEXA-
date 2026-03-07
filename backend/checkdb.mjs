import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const tquizzes = await db.collection('teacherquizzes').find({}).project({title:1, teacherId:1}).toArray();
console.log('All teacher quizzes:', JSON.stringify(tquizzes, null, 2));
await mongoose.disconnect();
