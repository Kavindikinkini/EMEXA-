import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const total = await db.collection('emotionlogs').countDocuments();
const fallbackLike = await db.collection('emotionlogs').countDocuments({ confidence: 1.0, emotion: 'neutral' });
console.log('Total logs:', total);
console.log('Exact confidence=1.0 neutral (fallback signature):', fallbackLike);

await mongoose.disconnect();
