import crypto from 'crypto';

/**
 * Standardizes success responses and injects requestId tracking
 */
export const responseMiddleware = (req, res, next) => {
  // Generate tracking ID for request tracing (UUIDv4)
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  // Success helper wrapper
  res.success = (message, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };

  next();
};
