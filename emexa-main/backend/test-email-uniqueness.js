/**
 * Email Uniqueness Test Script
 * Run this to verify email uniqueness works across Student and Teacher collections
 * 
 * Usage: node backend/test-email-uniqueness.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './src/models/student.js';
import Teacher from './src/models/teacher.js';
import studentRepository from './src/repositories/student.repository.js';
import teacherRepository from './src/repositories/teacher.repository.js';

dotenv.config();

const testEmailUniqueness = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.log('❌ No MONGO_URI found. Set it in .env file');
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'test@example.com';

    // Clean up any existing test data
    await Student.deleteMany({ email: testEmail });
    await Teacher.deleteMany({ email: testEmail });
    console.log('🧹 Cleaned up test data\n');

    // Test 1: Register student
    console.log('Test 1: Creating student with email:', testEmail);
    const student = await Student.create({
      name: 'Test Student',
      email: testEmail,
      password: 'password123',
    });
    console.log('✅ Student created:', student.studentId, '\n');

    // Test 2: Try to register teacher with SAME email
    console.log('Test 2: Trying to create teacher with SAME email:', testEmail);
    const existingStudent = await studentRepository.findByEmail(testEmail);
    const existingTeacher = await teacherRepository.findByEmail(testEmail);
    
    if (existingStudent || existingTeacher) {
      console.log('✅ Email uniqueness check PASSED - Email already exists!');
      console.log('   Found in:', existingStudent ? 'Student collection' : 'Teacher collection');
    } else {
      console.log('❌ Email uniqueness check FAILED - Should have detected existing email');
    }
    console.log('');

    // Test 3: Try with different case
    console.log('Test 3: Checking case-insensitive email (TEST@EXAMPLE.COM)');
    const existingCaseInsensitive = await studentRepository.findByEmail('TEST@EXAMPLE.COM');
    if (existingCaseInsensitive) {
      console.log('✅ Case-insensitive check PASSED - Found existing email');
    } else {
      console.log('❌ Case-insensitive check FAILED - Should find email regardless of case');
    }
    console.log('');

    // Cleanup
    await Student.deleteMany({ email: testEmail });
    await Teacher.deleteMany({ email: testEmail });
    console.log('🧹 Cleaned up test data');

    console.log('\n✨ All tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testEmailUniqueness();
