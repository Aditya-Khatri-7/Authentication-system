import RefreshToken from '../models/refreshTokenModel.js';
import User from '../models/userModel.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import AppError from '../utils/appError.js';

class SessionService {
  /**
   * Retrieves all active sessions (unexpired and populated with user metadata)
   */
  async getActiveSessions() {
    const sessions = await RefreshToken.find({
      expiresAt: { $gt: new Date() },
    }).populate({
      path: 'userId',
      match: { isDeleted: { $ne: true } },
      select: 'firstName lastName email role',
    });

    // Exclude sessions where the linked user was soft deleted or doesn't match
    const activeSessions = sessions.filter(s => s.userId !== null);

    return {
      success: true,
      sessions: activeSessions.map(s => ({
        id: s._id,
        userId: s.userId._id,
        name: `${s.userId.firstName} ${s.userId.lastName}`,
        email: s.userId.email,
        role: s.userId.role,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    };
  }

  /**
   * Terminates a specific active session
   */
  async terminateSession(sessionId, adminEmail, ip, browser) {
    const session = await RefreshToken.findById(sessionId).populate('userId');
    if (!session) {
      throw new AppError('Session not found or has already expired.', 404);
    }

    await RefreshToken.deleteOne({ _id: sessionId });

    // Create Audit Log
    const userEmail = session.userId ? session.userId.email : 'unknown';
    await auditLogRepository.create({
      email: userEmail,
      action: 'SESSION_TERMINATED',
      status: 'SUCCESS',
      ip,
      browser,
      details: `Session id ${sessionId} terminated by admin ${adminEmail}`,
    });

    return {
      success: true,
      message: 'Session terminated successfully.',
    };
  }

  /**
   * Terminates all active sessions for a specific user
   */
  async terminateAllSessionsForUser(userId, adminEmail, ip, browser) {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const deleteResult = await RefreshToken.deleteMany({ userId });

    // Create Audit Log
    await auditLogRepository.create({
      email: user.email,
      action: 'SESSION_TERMINATED',
      status: 'SUCCESS',
      ip,
      browser,
      details: `All active sessions (${deleteResult.deletedCount}) terminated by admin ${adminEmail}`,
    });

    return {
      success: true,
      message: 'All sessions for this user have been terminated successfully.',
    };
  }
}

export default new SessionService();
