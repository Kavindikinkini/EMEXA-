import Teacher from '../models/teacher.js';

class TeacherRepository {
  async create(teacherData) {
    return await Teacher.create(teacherData);
  }

  async findById(id) {
    return await Teacher.findById(id);
  }

  async findByEmail(email) {
    // include password for authentication checks
    // Normalize email to lowercase for case-insensitive search
    const normalizedEmail = email.toLowerCase().trim();
    return await Teacher.findOne({ email: normalizedEmail }).select('+password');
  }

  async findByTeacherId(teacherId) {
    return await Teacher.findOne({ teacherId });
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const teachers = await Teacher.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Teacher.countDocuments(filter);

    return {
      teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, updateData) {
    return await Teacher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await Teacher.findByIdAndDelete(id);
  }

  async updateLastLogin(id) {
    return await Teacher.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async assignCourse(teacherId, courseId) {
    return await Teacher.findByIdAndUpdate(
      teacherId,
      { $addToSet: { courses: courseId } },
      { new: true }
    );
  }
}

export default new TeacherRepository();
