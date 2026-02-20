import Student from '../models/student.js';

class StudentRepository {
  async create(studentData) {
    return await Student.create(studentData);
  }

  async findById(id) {
    return await Student.findById(id);
  }

  async findByEmail(email) {
    // include password for authentication checks
    // Normalize email to lowercase for case-insensitive search
    const normalizedEmail = email.toLowerCase().trim();
    return await Student.findOne({ email: normalizedEmail }).select('+password');
  }

  async findByStudentId(studentId) {
    return await Student.findOne({ studentId });
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const students = await Student.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(filter);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, updateData) {
    return await Student.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await Student.findByIdAndDelete(id);
  }

  async updateLastLogin(id) {
    return await Student.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async enrollInCourse(studentId, courseId) {
    return await Student.findByIdAndUpdate(
      studentId,
      { $addToSet: { enrolledCourses: courseId } },
      { new: true }
    );
  }
}

export default new StudentRepository();
