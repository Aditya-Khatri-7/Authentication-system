import { ROLE_PERMISSIONS } from '../config/roles.js';
import AppError from '../utils/appError.js';

/**
 * Middleware to restrict route access by role
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient role permissions.',
      });
    }

    next();
  };
};

/**
 * Middleware to restrict route access by permissions
 */
export const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const userPermissions = req.user.permissions;
    const defaultPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    // If permissions array exists on user and contains elements, it overrides default permissions
    const effectivePermissions = Array.isArray(userPermissions) && userPermissions.length > 0
      ? userPermissions
      : defaultPermissions;

    const hasAllPermissions = requiredPermissions.every(permission => 
      effectivePermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions.',
      });
    }

    next();
  };
};
