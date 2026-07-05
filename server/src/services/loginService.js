import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import tokenService from './tokenService.js';
import AppError from '../utils/appError.js';

class LoginService {
  /**
   * Main login flow executing account lock checks, credentials verification,
   * failed attempts increments, and session token generation.
   */
  async loginUser(email, password, ip, browser, loginType = 'USER') {
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    // 1. Find user by email
    const user = await userRepository.findByEmail(cleanEmail);

    // 2. If user does not exist, return generic error (avoiding user existence leaks)
    if (!user) {
      // Create a FAILED audit log
      await auditLogRepository.create({
        email: cleanEmail,
        action: 'LOGIN_FAILED',
        status: 'FAILED',
        ip,
        browser,
      });
      throw new AppError('Invalid email or password', 401);
    }

    // 2.5 Enforce admin portal boundary checks
    if (loginType === 'ADMIN') {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
      if (!allowedRoles.includes(user.role)) {
        await auditLogRepository.create({
          email: cleanEmail,
          action: 'LOGIN_ADMIN_ACCESS_DENIED',
          status: 'FAILED',
          ip,
          browser,
          details: 'Access blocked: User account does not hold administrator permissions.'
        });
        throw new AppError('Access denied: Your account does not have administrator privileges.', 403);
      }
    }

    // 3. Check if account is currently locked
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      const remainingMs = user.accountLockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      throw new AppError(
        `Account temporarily locked. Try again in ${remainingMinutes} minutes.`,
        423
      );
    }

    // 4. Verify password using bcrypt.compare()
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment failedLoginAttempts
      const newAttempts = user.failedLoginAttempts + 1;
      const updateData = { failedLoginAttempts: newAttempts };

      // Create FAILED login audit log
      await auditLogRepository.create({
        email: cleanEmail,
        action: 'LOGIN_FAILED',
        status: 'FAILED',
        ip,
        browser,
      });

      // 5. Check if attempts reached 5 to lock the account
      if (newAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lockout
        updateData.accountLockedUntil = lockoutTime;

        await userRepository.update(user._id, updateData);

        // Create lock audit log
        await auditLogRepository.create({
          email: cleanEmail,
          action: 'ACCOUNT_LOCKED',
          status: 'FAILED',
          ip,
          browser,
        });

        throw new AppError('Account temporarily locked. Please try again after 30 minutes.', 423);
      }

      // Save updated attempts counter
      await userRepository.update(user._id, updateData);

      throw new AppError('Invalid email or password', 401);
    }

    // 6. Successful Login: reset attempts and lockouts
    await userRepository.update(user._id, {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLogin: new Date(),
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = await tokenService.generateRefreshToken(user);

    // Create SUCCESS audit log
    await auditLogRepository.create({
      email: cleanEmail,
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      ip,
      browser,
    });

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        isEmailVerified: user.isEmailVerified,
        lastLogin: new Date(),
      },
      accessToken,
      refreshToken,
    };
  }
}

export default new LoginService();
