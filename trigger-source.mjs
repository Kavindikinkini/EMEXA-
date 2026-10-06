import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const start = new Date('2026-05-03T00:00:00Z');
const end = new Date('2026-05-11T00:00:00Z');

// Negative-label classifications in the UAT window
const negLabels = ['sad', 'angry', 'confused', 'anxious'];
const negClassifications = await db.collection('emotionlogs').countDocuments({
  timestamp: { $gte: start, $lt: end },
  emotion: { $in: negLabels }
});
console.log('Negative-label classifications in UAT window:', negClassifications);

// Total hints issued in the same window
const hintsInWindow = await db.collection('hintusages').countDocuments({
  timestamp: { $gte: start, $lt: end }
});
console.log('Hints issued in UAT window:', hintsInWindow);

// For each hint, check if a negative classification exists for the same session
// within 60s before the hint timestamp (facial-triggered) vs not (inactivity-triggered)
const hints = await db.collection('hintusages').find({
  timestamp: { $gte: start, $lt: end }
}).toArray();

let facialTriggered = 0, inactivityTriggered = 0;
for (const hint of hints) {
  const windowStart = new Date(hint.timestamp.getTime() - 60000);
  const match = await db.collection('emotionlogs').findOne({
    sessionId: hint.sessionId,
    emotion: { $in: negLabels },
    timestamp: { $gte: windowStart, $lte: hint.timestamp }
  });
  if (match) facialTriggered++; else inactivityTriggered++;
}
console.log('Hints matched to a facial negative-label within 60s:', facialTriggered);
console.log('Hints with no matching facial trigger (likely inactivity):', inactivityTriggered);

await mongoose.disconnect();
