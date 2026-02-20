import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the users collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check if admin exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('⚠️  Deleting existing admin...');
      await usersCollection.deleteOne({ email: 'admin@example.com' });
    }

    // Hash password properly
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Password hashed:', hashedPassword);

    // Create admin document
    const adminDoc = {
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'Admin',
      status: 'Active',
      dateAdded: new Date()
    };

    // Insert admin
    const result = await usersCollection.insertOne(adminDoc);
    console.log('✅ Admin created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID:', result.insertedId);

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();