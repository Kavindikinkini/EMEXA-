import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const byDay = await db.collection('emotionlogs').aggregate([
  { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 20 }
]).toArray();

console.log('Top 20 days by emotionlog volume:');
byDay.forEach(d => console.log(d._id, '->', d.count));

await mongoose.disconnect();
