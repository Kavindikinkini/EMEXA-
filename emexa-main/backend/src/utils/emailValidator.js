import mongoose from 'mongoose';
import Student from './models/student.js';
import Teacher from './models/teacher.js';

/**
 * Email Uniqueness Validator
 * Ensures email is unique across both Student and Teacher collections
 */
export class EmailValidator {
  static async isEmailUnique(email, excludeId = null) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check students collection
    const studentQuery = { email: normalizedEmail };
    if (excludeId) studentQuery._id = { $ne: excludeId };
    const existingStudent = await Student.findOne(studentQuery);
    
    // Check teachers collection
    const teacherQuery = { email: normalizedEmail };
    if (excludeId) teacherQuery._id = { $ne: excludeId };
    const existingTeacher = await Teacher.findOne(teacherQuery);
    
    return !existingStudent && !existingTeacher;
  }

  static async validateUniqueEmail(email, excludeId = null) {
    const isUnique = await this.isEmailUnique(email, excludeId);
    if (!isUnique) {
      throw new Error('Email already registered');
    }
    return true;
  }
}

export default EmailValidator;
