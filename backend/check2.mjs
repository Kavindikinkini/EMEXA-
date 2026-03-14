
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const all = await db.collection('teacherquizzes').find({ status: { $ne: 'draft' }, isDeleted: false }).toArray();
  console.log('Non-draft quizzes:', all.length);
  all.forEach(q => console.log(q._id, '|', q.title, '| status:', q.status));
  await mongoose.disconnect();
}
run().catch(console.error);
