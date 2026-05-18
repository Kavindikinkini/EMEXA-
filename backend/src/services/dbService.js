import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;
  console.log('🔍 MONGO_URI from env:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
  console.log('🔍 Using URI:', mongoUri ? 'SET' : 'NOT SET');
  if (!mongoUri) {
    console.log('⚠️  MongoDB connection skipped - No MONGO_URI configured');
    console.log('💡 To connect MongoDB:');
    console.log('   1. Create free account: https://www.mongodb.com/cloud/atlas/register');
    console.log('   2. Get connection string and add to backend/.env file');
    console.log('   3. Restart server\n');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will continue without database\n');
    // Don't throw - let server continue without DB
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
    throw err;
  }
};

export default { connectDB, closeDB };
