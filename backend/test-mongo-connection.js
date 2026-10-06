// test-mongo-connection.js
// Run from backend/: node test-mongo-connection.js
// Shows the REAL underlying error, not server.js's generic wrapper message.

import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGO_URI;

console.log('URI found:', uri ? 'yes' : 'NO — check your .env file');
if (uri) {
  // Print a redacted version so we can sanity-check the format without
  // exposing the real password
  console.log('URI shape:', uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@'));
}

console.log('\nAttempting connection...\n');

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('✅ Connected successfully!');
  console.log('Connected to database:', mongoose.connection.name);
  await mongoose.disconnect();
} catch (error) {
  console.log('❌ Connection failed. Full error below:\n');
  console.log(error);
}
