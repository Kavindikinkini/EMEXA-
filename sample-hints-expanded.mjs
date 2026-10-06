import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const sample = await db.collection('hintusages').aggregate([
  { $sample: { size: 50 } },
  { $project: { sessionId: 1, questionIndex: 1, hintText: 1, deduction: 1, timeSpentBeforeHint: 1 } }
]).toArray();

console.log(JSON.stringify(sample, null, 2));

await mongoose.disconnect();
