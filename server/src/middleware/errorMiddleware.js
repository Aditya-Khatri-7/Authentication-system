import logger from '../utils/logger.js';

// 404 Not Found handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message;

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found';
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Mongoose duplicate key error (e.g., unique email already exists)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Log structured error details
  logger.error(message, {
    requestId: req.id,
    statusCode,
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      statusCode,
      details: process.env.NODE_ENV === 'production' ? 'An internal error occurred' : err.stack,
    },
    requestId: req.id || 'unknown',
  });
};
