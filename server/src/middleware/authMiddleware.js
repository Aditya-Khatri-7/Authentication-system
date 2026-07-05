import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import AppError from '../utils/appError.js';

/**
 * Middleware to verify access JWT tokens in Bearer headers
 */
export const verifyJWT = async (req, res, next) => {
  let token;

  // Extract token from Bearer scheme
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access token is missing or not provided', 401));
  }

  try {
    // Verify signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and ensure they exist and are active
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return next(new AppError('The user associated with this token no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account is locked or inactive', 403));
    }

    // Attach user payload to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token has expired', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Access token is invalid or malformed', 401));
    }
    return next(error);
  }
};

/**
 * Middleware to protect routes that require Admin roles
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403);
    next(new AppError('Access denied: Administrator permissions required', 403));
  }
};
