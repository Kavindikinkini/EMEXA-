import jwt from 'jsonwebtoken';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import User from '../models/user.js';

/**
 * authenticateToken - Main authentication middleware
 * Verifies JWT and attaches user to request
 * This is an alias for the protect middleware
 */
export const authenticateToken = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this route. No token provided.' 
      });
    }

    try {
      // Verify token
      const secret = process.env.JWT_SECRET || 'dev_secret';
      const decoded = jwt.verify(token, secret);

      console.log('🔐 Token decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });

      // Try to find user in Student, Teacher, or User collections
      let user = await Student.findById(decoded.id).select('-password');
      
      if (!user) {
        user = await Teacher.findById(decoded.id).select('-password');
      }
      
      if (!user) {
        user = await User.findById(decoded.id).select('-password');
      }

      if (!user) {
        console.log('❌ User not found for token ID:', decoded.id);
        return res.status(401).json({ 
          success: false,
          message: 'User no longer exists' 
        });
      }

      console.log('✅ User authenticated:', { id: user._id, role: user.role });

      // Set both req.user and req.userId for compatibility
      req.user = user;
      req.userId = decoded.id;

      next();
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token expired. Please login again.' 
        });
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this route' 
      });
    }
  } catch (error) {
    console.error('❌ Authenticate token error:', error);
    next(error);
  }
};

/**
 * Protect middleware - Verifies JWT and finds user
 * Sets req.user and req.userId for downstream use
 * (Alias for authenticateToken for backward compatibility)
 */
export const protect = authenticateToken;

/**
 * Authorize middleware - Ensures user has required role(s)
 * Use after protect/authenticateToken middleware
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    const userRole = req.user.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ Authorization failed. User role: ${req.user.role}, Required: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    console.log(`✅ Authorization passed for role: ${req.user.role}`);
    next();
  };
};

/**
 * Simple auth middleware for dashboard routes
 * Alternative to protect middleware
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const secret = process.env.JWT_SECRET || 'dev_secret';
    const decoded = jwt.verify(token, secret);

    req.userId = decoded.id;
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * Verify Admin middleware - For protecting admin-only routes
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const decoded = jwt.verify(token, secret);

    // Get user from User collection
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if user is admin (case-insensitive)
    const userRole = user.role?.toLowerCase();
    if (userRole !== 'admin') {
      console.log(`❌ Admin verification failed. User role: ${user.role}`);
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }

    console.log('✅ Admin verified:', user.email);

    // Attach user info to request
    req.user = user;
    req.userId = decoded.id;
    next();

  } catch (error) {
    console.error('❌ Admin verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error verifying token' 
    });
  }
};

/**
 * Convenience middleware for specific roles
 */
export const requireTeacher = authorize('teacher');
export const requireStudent = authorize('student');
export const requireAdmin = authorize('admin');

// Default export for backward compatibility
export default protect;