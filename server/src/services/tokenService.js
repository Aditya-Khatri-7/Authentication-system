import jwt from 'jsonwebtoken';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import userRepository from '../repositories/userRepository.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import AppError from '../utils/appError.js';

class TokenService {
  /**
   * Generates a short-lived access token (expires in 15 minutes)
   */
  generateAccessToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    });
  }

  /**
   * Generates a long-lived refresh token, stores it in the database, and returns it
   */
  async generateRefreshToken(user) {
    const payload = {
      id: user._id,
      jti: Math.random().toString(36).substring(2) + Date.now().toString(36), // Avoid token collision within the same second
    };

    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save refresh token record
    await refreshTokenRepository.create({
      token,
      userId: user._id,
      expiresAt,
    });

    return token;
  }

  /**
   * Performs refresh token rotation: verifies, deletes old token, and returns new tokens
   */
  async rotateRefreshToken(oldToken, ip = 'unknown', browser = 'unknown') {
    if (!oldToken) {
      throw new AppError('Refresh token is required', 401);
    }

    try {
      // 1. Verify token signature and expiration
      const decoded = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);

      // 2. Query token in database to check revocation state
      const tokenDoc = await refreshTokenRepository.findByToken(oldToken);
      if (!tokenDoc) {
        // If token isn't in database, it may have been revoked or reused.
        // For security, revoke all tokens for this user
        await refreshTokenRepository.deleteByUserId(decoded.id);
        throw new AppError('Refresh token has been revoked or is invalid', 401);
      }

      // 3. Find the user
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AppError('User account associated with this token is invalid', 401);
      }

      // 4. Delete the old refresh token (revocation)
      await refreshTokenRepository.deleteByToken(oldToken);

      // 5. Generate new pair
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user);

      // 6. Audit token refresh
      await auditLogRepository.create({
        email: user.email,
        action: 'TOKEN_REFRESH',
        status: 'SUCCESS',
        ip,
        browser,
      });

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token has expired, please log in again', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Refresh token is invalid', 401);
      }
      throw error;
    }
  }

  /**
   * Revokes a refresh token and logs the logout event
   */
  async logout(token, email, ip, browser) {
    let cleanEmail = email;

    // Fallback: extract email from token if user isn't authorized but token exists
    if (!cleanEmail && token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          const user = await userRepository.findById(decoded.id);
          cleanEmail = user?.email;
        }
      } catch (_) {}
    }

    if (token) {
      await refreshTokenRepository.deleteByToken(token);
    }

    // Audit logout
    if (cleanEmail) {
      await auditLogRepository.create({
        email: cleanEmail,
        action: 'LOGOUT',
        status: 'SUCCESS',
        ip,
        browser,
      });
    }

    return { success: true };
  }
}

export default new TokenService();
