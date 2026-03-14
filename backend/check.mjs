
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const count = await db.collection('teacherquizzes').countDocuments();
  console.log('Total docs:', count);
  const all = await db.collection('teacherquizzes').find({}).limit(5).toArray();
  all.forEach(q => console.log(q._id, q.title, 'deleted:', q.isDeleted, 'status:', q.status));
  await mongoose.disconnect();
}
run().catch(console.error);
