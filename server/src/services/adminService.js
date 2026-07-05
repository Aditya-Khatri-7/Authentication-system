import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import RefreshToken from '../models/refreshTokenModel.js';
import AuditLog from '../models/auditLogModel.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import userRepository from '../repositories/userRepository.js';
import AppError from '../utils/appError.js';

class AdminService {
  /**
   * Retrieves paginated list of users with sorting, filtering, and searches
   */
  async getUsers(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Standard filter: do not return soft-deleted users
    const filter = { isDeleted: { $ne: true } };

    // 1. Search filter
    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // 2. Role filter
    if (query.role) {
      filter.role = query.role;
    }

    // 3. Status filter mapping
    if (query.status) {
      const now = new Date();
      if (query.status === 'DISABLED') {
        filter.isActive = false;
      } else if (query.status === 'LOCKED') {
        filter.accountLockedUntil = { $gt: now };
      } else if (query.status === 'PENDING_VERIFICATION') {
        filter.isEmailVerified = false;
        filter.isActive = true;
      } else if (query.status === 'ACTIVE') {
        filter.isActive = true;
        filter.isEmailVerified = true;
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { accountLockedUntil: null },
            { accountLockedUntil: { $lte: now } },
          ],
        });
      }
    }

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return {
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users,
    };
  }

  /**
   * Returns details of a specific user
   */
  async getUserById(id) {
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } }).select('-password');
    if (!user) {
      throw new AppError('User not found or has been deleted.', 404);
    }
    return {
      success: true,
      user,
    };
  }

  /**
   * Updates user roles, status, and permissions with audit trails
   */
  async updateUser(id, updateData, adminEmail, ip, browser) {
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const updates = {};
    const auditLogsToCreate = [];

    // 1. Role Change Update
    if (updateData.role && updateData.role !== user.role) {
      updates.role = updateData.role;
      auditLogsToCreate.push({
        email: user.email,
        action: 'ROLE_CHANGED',
        status: 'SUCCESS',
        ip,
        browser,
        details: `Role updated from ${user.role} to ${updateData.role} by admin ${adminEmail}`,
      });
    }

    // 2. Permission Change Update
    if (updateData.permissions && JSON.stringify(updateData.permissions) !== JSON.stringify(user.permissions)) {
      updates.permissions = updateData.permissions;
      auditLogsToCreate.push({
        email: user.email,
        action: 'PERMISSION_CHANGED',
        status: 'SUCCESS',
        ip,
        browser,
        details: `Permissions changed by admin ${adminEmail}`,
      });
    }

    // 3. Active Status Update
    if (updateData.isActive !== undefined && updateData.isActive !== user.isActive) {
      updates.isActive = updateData.isActive;
      if (updateData.isActive === false) {
        // Drop active refresh token sessions to log the user out
        await refreshTokenRepository.deleteByUserId(user._id);
        auditLogsToCreate.push({
          email: user.email,
          action: 'USER_DISABLED',
          status: 'SUCCESS',
          ip,
          browser,
          details: `Account disabled by admin ${adminEmail}`,
        });
      } else {
        auditLogsToCreate.push({
          email: user.email,
          action: 'USER_ENABLED',
          status: 'SUCCESS',
          ip,
          browser,
          details: `Account enabled by admin ${adminEmail}`,
        });
      }
    }

    // 4. FirstName Change
    if (updateData.firstName && updateData.firstName !== user.firstName) {
      updates.firstName = updateData.firstName;
      auditLogsToCreate.push({
        email: user.email,
        action: 'PROFILE_UPDATED',
        status: 'SUCCESS',
        ip,
        browser,
        details: `First name changed from ${user.firstName} to ${updateData.firstName} by admin ${adminEmail}`,
      });
    }

    // 5. LastName Change
    if (updateData.lastName && updateData.lastName !== user.lastName) {
      updates.lastName = updateData.lastName;
      auditLogsToCreate.push({
        email: user.email,
        action: 'PROFILE_UPDATED',
        status: 'SUCCESS',
        ip,
        browser,
        details: `Last name changed from ${user.lastName} to ${updateData.lastName} by admin ${adminEmail}`,
      });
    }

    // 6. Email Change
    if (updateData.email && updateData.email !== user.email) {
      updates.email = updateData.email;
      auditLogsToCreate.push({
        email: user.email,
        action: 'EMAIL_CHANGED',
        status: 'SUCCESS',
        ip,
        browser,
        details: `Email changed from ${user.email} to ${updateData.email} by admin ${adminEmail}`,
      });
    }

    // 7. Verification Status Update
    if (updateData.isEmailVerified !== undefined && updateData.isEmailVerified !== user.isEmailVerified) {
      updates.isEmailVerified = updateData.isEmailVerified;
      auditLogsToCreate.push({
        email: user.email,
        action: 'EMAIL_VERIFIED',
        status: 'SUCCESS',
        ip,
        browser,
        details: `Verification status updated to ${updateData.isEmailVerified} by admin ${adminEmail}`,
      });
    }

    // 8. Password Reset
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 12);
      updates.password = hashedPassword;
      // Invalidate active sessions since credentials changed
      await refreshTokenRepository.deleteByUserId(user._id);
      auditLogsToCreate.push({
        email: user.email,
        action: 'PASSWORD_RESET',
        status: 'SUCCESS',
        ip,
        browser,
        details: `Password reset by admin ${adminEmail}. Dropped active sessions.`,
      });
    }

    // Perform updates
    const updatedUser = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-password');

    // Persist Audits
    for (const log of auditLogsToCreate) {
      await auditLogRepository.create(log);
    }

    return {
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    };
  }

  /**
   * Performs soft deletion of a user record, invalidating all sessions
   */
  async softDeleteUser(id, adminEmail, ip, browser) {
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Soft delete
    await User.findByIdAndUpdate(id, {
      $set: {
        isDeleted: true,
        isActive: false,
      },
    });

    // Invalidate refresh tokens to force immediate logout
    await refreshTokenRepository.deleteByUserId(user._id);

    // Audit log
    await auditLogRepository.create({
      email: user.email,
      action: 'USER_DISABLED',
      status: 'SUCCESS',
      ip,
      browser,
      details: `Account soft deleted by admin ${adminEmail}`,
    });

    return {
      success: true,
      message: 'User soft-deleted successfully.',
    };
  }

  /**
   * Retrieves active dashboard statistics
   */
  async getStats() {
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true, isDeleted: { $ne: true } });
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false, isDeleted: { $ne: true } });
    
    // Count active refresh token sessions
    const activeSessions = await RefreshToken.countDocuments();

    // Count today's logins
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const totalLoginsToday = await AuditLog.countDocuments({
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      createdAt: { $gte: startOfToday },
    });

    return {
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        activeSessions,
        totalLoginsToday,
      },
    };
  }

  /**
   * Retrieves paginated system audit logs with search filter
   */
  async getAuditLogs(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      filter.$or = [
        { email: searchRegex },
        { action: searchRegex },
        { ip: searchRegex },
        { status: searchRegex },
        { details: searchRegex },
      ];
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    return {
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }
}

export default new AdminService();
