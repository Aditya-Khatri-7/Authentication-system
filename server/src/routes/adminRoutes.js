import express from 'express';
import adminController from '../controllers/adminController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { authorizePermissions } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

// Get users list (paginated, sortable, searchable, filterable)
router.get('/users', verifyJWT, authorizePermissions('users.read'), adminController.getUsers);

// Get specific user detail
router.get('/users/:id', verifyJWT, authorizePermissions('users.read'), adminController.getUserById);

// Update user roles, permissions, or activity status
router.patch('/users/:id', verifyJWT, authorizePermissions('users.update'), adminController.updateUser);

// Soft delete user and drop active sessions
router.delete('/users/:id', verifyJWT, authorizePermissions('users.delete'), adminController.softDeleteUser);

// View active web sessions
router.get('/sessions', verifyJWT, authorizePermissions('sessions.manage'), adminController.getActiveSessions);

// Terminate specific user session by refresh token ID
router.delete('/sessions/:id', verifyJWT, authorizePermissions('sessions.manage'), adminController.terminateSession);

// Terminate all sessions for a user
router.delete('/sessions', verifyJWT, authorizePermissions('sessions.manage'), adminController.terminateUserSessions);

// Get system statistics for admin dashboard
router.get('/stats', verifyJWT, authorizePermissions('users.read'), adminController.getStats);

// Get paginated system audit logs
router.get('/audit-logs', verifyJWT, authorizePermissions('users.read'), adminController.getAuditLogs);

export default router;
