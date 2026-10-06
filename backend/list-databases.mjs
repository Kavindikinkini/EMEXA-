import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const admin = mongoose.connection.db.admin();
const result = await admin.listDatabases();
console.log('Databases on this cluster:');
result.databases.forEach(d => console.log(d.name, '->', (d.sizeOnDisk / 1024 / 1024).toFixed(1), 'MB'));

await mongoose.disconnect();
