import adminService from '../services/adminService.js';
import sessionService from '../services/sessionService.js';
import AppError from '../utils/appError.js';

class AdminController {
  /**
   * GET /api/admin/users
   */
  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      return res.success('Users list retrieved successfully', {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        users: result.users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const result = await adminService.getUserById(req.params.id);
      return res.success('User retrieved successfully', { user: result.user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { role, permissions, isActive, firstName, lastName, email, isEmailVerified, password } = req.body;
      const adminEmail = req.user.email;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      // Validate that at least one field is provided for update
      if (
        role === undefined &&
        permissions === undefined &&
        isActive === undefined &&
        firstName === undefined &&
        lastName === undefined &&
        email === undefined &&
        isEmailVerified === undefined &&
        password === undefined
      ) {
        throw new AppError('At least one field to update must be provided.', 400);
      }

      const result = await adminService.updateUser(
        req.params.id,
        { role, permissions, isActive, firstName, lastName, email, isEmailVerified, password },
        adminEmail,
        ip,
        browser
      );

      return res.success('User updated successfully', { user: result.user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/users/:id (Soft delete only)
   */
  async softDeleteUser(req, res, next) {
    try {
      const adminEmail = req.user.email;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      await adminService.softDeleteUser(req.params.id, adminEmail, ip, browser);
      return res.success('User soft-deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/sessions
   */
  async getActiveSessions(req, res, next) {
    try {
      const result = await sessionService.getActiveSessions();
      return res.success('Active sessions list retrieved successfully', { sessions: result.sessions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/sessions/:id
   */
  async terminateSession(req, res, next) {
    try {
      const adminEmail = req.user.email;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      await sessionService.terminateSession(req.params.id, adminEmail, ip, browser);
      return res.success('Session terminated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/sessions (Terminates all sessions for a specific user)
   */
  async terminateUserSessions(req, res, next) {
    try {
      const userId = req.body.userId || req.query.userId;
      if (!userId) {
        throw new AppError('User ID is required to terminate sessions.', 400);
      }

      const adminEmail = req.user.email;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      await sessionService.terminateAllSessionsForUser(userId, adminEmail, ip, browser);
      return res.success('All sessions for user terminated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stats
   */
  async getStats(req, res, next) {
    try {
      const result = await adminService.getStats();
      return res.success('Statistics retrieved successfully', result.stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const result = await adminService.getAuditLogs(req.query);
      return res.success('Audit logs retrieved successfully', {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        logs: result.logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
