import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Allow bypass in development when explicitly enabled
    const allowBypass = process.env.NODE_ENV !== 'production' && (process.env.ALLOW_DEV_AUTH_BYPASS ?? 'false') === 'true';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (allowBypass) {
        console.warn('⚠️ Auth bypass enabled in development mode');
        return next();
      }
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'dev_secret';
    
    try {
      const decoded = jwt.verify(token, secret);

      // CRITICAL: Set req.userId from the decoded token
      // Try multiple possible field names
      req.userId = decoded.id || decoded._id || decoded.userId || decoded.user_id;
      req.userRole = decoded.role;

      console.log('✅ Token verified - userId:', req.userId, 'role:', req.userRole);
      console.log('🔍 Decoded token:', JSON.stringify(decoded, null, 2));

      if (!req.userId) {
        console.error('❌ Token decoded but no user ID found. Decoded payload:', decoded);
        return res.status(401).json({ message: 'Invalid token format - no user ID' });
      }

      next();
    } catch (verifyError) {
      console.error('❌ JWT verification failed:', verifyError.message);
      
      if (verifyError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      return res.status(401).json({ message: 'Token verification failed' });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Optional: Middleware to check specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ message: 'User role not found' });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: `Role '${req.userRole}' is not authorized to access this route` 
      });
    }

    next();
  };
};