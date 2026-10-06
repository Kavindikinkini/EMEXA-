import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const start = new Date('2026-05-18T00:00:00Z');
const end = new Date('2026-05-20T00:00:00Z');
const negLabels = ['sad', 'angry', 'confused', 'anxious'];

const hints = await db.collection('hintusages').find({ timestamp: { $gte: start, $lt: end } }).toArray();
let facial = 0, inactivity = 0;
for (const h of hints) {
  const wStart = new Date(h.timestamp.getTime() - 60000);
  const m = await db.collection('emotionlogs').findOne({ sessionId: h.sessionId, emotion: { $in: negLabels }, timestamp: { $gte: wStart, $lte: h.timestamp } });
  if (m) facial++; else inactivity++;
}
console.log('--- TRIGGER SOURCE ---');
console.log('Total hints in demo window:', hints.length);
console.log('Facial-triggered:', facial);
console.log('Inactivity-triggered:', inactivity);

console.log('');
console.log('--- HINT SAMPLE ---');
const allHints = await db.collection('hintusages').find({}).project({ sessionId: 1, questionIndex: 1, hintText: 1, deduction: 1, timeSpentBeforeHint: 1 }).limit(71).toArray();
console.log('Total hints available in DB:', allHints.length);
console.log(JSON.stringify(allHints, null, 2));

await mongoose.disconnect();
