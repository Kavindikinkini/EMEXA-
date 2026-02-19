import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/emexa_dev';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to', uri);
  const res = await User.updateMany({ role: { $exists: false } }, { $set: { role: 'student' } });
  console.log('updateMany result:', res.nModified || res.modifiedCount || res);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
