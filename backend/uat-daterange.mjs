import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const range = await db.collection('emotionlogs').aggregate([
  { $group: { _id: null, min: { $min: '$timestamp' }, max: { $max: '$timestamp' }, count: { $sum: 1 } } }
]).toArray();
console.log('emotionlogs full range:', range);

await mongoose.disconnect();
