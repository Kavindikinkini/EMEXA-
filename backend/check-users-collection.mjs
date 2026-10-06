import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

console.log('--- All collections and their counts ---');
const collections = await db.listCollections().toArray();
for (const c of collections) {
  const count = await db.collection(c.name).countDocuments();
  console.log(c.name, '->', count);
}

console.log('\n--- users collection sample (if it has data) ---');
const usersSample = await db.collection('users').find({}).project({ name: 1, email: 1, role: 1, createdAt: 1 }).limit(20).toArray();
usersSample.forEach(u => console.log(u.name, '|', u.email, '|', u.role, '|', u.createdAt));

console.log('\n--- teachers collection sample ---');
const teachersSample = await db.collection('teachers').find({}).project({ name: 1, email: 1, createdAt: 1 }).limit(15).toArray();
teachersSample.forEach(t => console.log(t.name, '|', t.email, '|', t.createdAt));

await mongoose.disconnect();
