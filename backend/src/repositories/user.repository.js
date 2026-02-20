import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// If a MongoDB URI is not set, use an in-memory repository for local dev/testing.
const useInMemory = !(process.env.MONGO_URI || process.env.MONGODB_URI);

let repository = null;

if (!useInMemory) {
  class UserRepository {
    async create(userData) {
      return await User.create(userData);
    }

    async findById(id) {
      return await User.findById(id);
    }

    async findByEmail(email) {
      // include password for authentication checks
      return await User.findOne({ email }).select('+password');
    }

    async findAll(filter = {}, options = {}) {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    async update(id, updateData) {
      return await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    }

    async delete(id) {
      return await User.findByIdAndDelete(id);
    }

    async updateLastLogin(id) {
      return await User.findByIdAndUpdate(id, { lastLogin: new Date() });
    }
  }

  repository = new UserRepository();
} else {
  // Simple in-memory user store for dev without MongoDB.
  const users = new Map();

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function createUserObject(stored) {
    // create methods similar to Mongoose document
    return {
      ...stored,
      comparePassword: async (plain) => {
        return bcrypt.compare(plain, stored.password);
      },
      generateAuthToken: function () {
        const secret = process.env.JWT_SECRET || 'dev_secret';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        return jwt.sign({ id: stored._id }, secret, { expiresIn });
      },
    };
  }

  class InMemoryUserRepository {
    async create(userData) {
      const id = genId();
      const hashed = await bcrypt.hash(userData.password, 10);
      const now = new Date();
      const stored = {
        _id: id,
        name: userData.name,
        email: userData.email,
        password: hashed,
        role: userData.role || 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      users.set(id, stored);
      return createUserObject(stored);
    }

    async findById(id) {
      const u = users.get(id);
      if (!u) return null;
      return createUserObject(u);
    }

    async findByEmail(email) {
      for (const u of users.values()) {
        if (u.email === email) return createUserObject(u);
      }
      return null;
    }

    async findAll(filter = {}, options = {}) {
      const all = Array.from(users.values()).map((u) => ({ ...u }));
      const total = all.length;
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;
      const paged = all.slice(skip, skip + limit);
      return {
        users: paged,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    async update(id, updateData) {
      const u = users.get(id);
      if (!u) return null;
      const merged = { ...u, ...updateData, updatedAt: new Date() };
      users.set(id, merged);
      return createUserObject(merged);
    }

    async delete(id) {
      const existed = users.has(id);
      users.delete(id);
      return existed;
    }

    async updateLastLogin(id) {
      const u = users.get(id);
      if (!u) return null;
      u.lastLogin = new Date();
      users.set(id, u);
      return createUserObject(u);
    }
  }

  repository = new InMemoryUserRepository();
}

export default repository;