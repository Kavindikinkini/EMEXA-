import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const names = ['Punarji wickramasuriya', 'Nethmi dinesha', 'Praveen Alwis', 'Vihangi Pabasara Brahmana'];
for (const name of names) {
  const student = await db.collection('students').findOne({ name: new RegExp(name.split(' ')[0], 'i') });
  console.log(name, '-> found in students:', !!student, student ? student._id : '');
}

await mongoose.disconnect();
