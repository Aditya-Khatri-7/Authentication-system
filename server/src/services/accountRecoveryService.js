import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import otpService from './otpService.js';
import emailService from './emailService.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import AppError from '../utils/appError.js';

class AccountRecoveryService {
  /**
   * Generates a reset code and sends it via email. Always returns generic response.
   */
  async forgotPassword(email, ip, browser) {
    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await userRepository.findByEmail(cleanEmail);
      if (!user) {
        // Audit request as FAILED for security mapping, but do not leak to client
        await auditLogRepository.create({
          email: cleanEmail,
          action: 'PASSWORD_RESET_REQUEST',
          status: 'FAILED',
          ip,
          browser,
        });
        return {
          success: true,
          message: 'If that email address exists in our database, we will send an OTP verification code shortly.',
        };
      }

      // Generate and save PASSWORD_RESET OTP code
      await otpService.createOTP(cleanEmail, 'PASSWORD_RESET');

      // Create Success Audit Log
      await auditLogRepository.create({
        email: cleanEmail,
        action: 'PASSWORD_RESET_REQUEST',
        status: 'SUCCESS',
        ip,
        browser,
      });
    } catch (error) {
      console.warn(`[Forgot Password Alert] Process failed for email: ${cleanEmail}. Error: ${error.message}`);
    }

    return {
      success: true,
      message: 'If that email address exists in our database, we will send an OTP verification code shortly.',
    };
  }

  /**
   * Verifies the OTP code validity without consuming it (allows UI validation checks)
   */
  async verifyResetOtp(email, otp) {
    const cleanEmail = email.toLowerCase().trim();
    
    // Call validateOTP with consume = false
    await otpService.validateOTP(cleanEmail, otp, 'PASSWORD_RESET', false);

    return {
      success: true,
      message: 'OTP code verified successfully.',
    };
  }

  /**
   * Consumes OTP, hashes new password, updates user model, and clears user sessions
   */
  async resetPassword(email, otp, newPassword, ip, browser) {
    const cleanEmail = email.toLowerCase().trim();

    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // 1. Validate OTP and consume it
    await otpService.validateOTP(cleanEmail, otp, 'PASSWORD_RESET', true);

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Update User schema fields
    await userRepository.update(user._id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    // 4. Force logout across all active sessions/devices by dropping user's refresh tokens
    await refreshTokenRepository.deleteByUserId(user._id);

    // 5. Create Success Audit Log
    await auditLogRepository.create({
      email: cleanEmail,
      action: 'PASSWORD_RESET_SUCCESS',
      status: 'SUCCESS',
      ip,
      browser,
    });

    // 6. Send Password Changed Email notification
    try {
      await emailService.sendPasswordChangedEmail(cleanEmail, `${user.firstName} ${user.lastName}`, ip);
    } catch (err) {
      console.warn(`[SMTP Warning] Failed to send password reset notification email: ${err.message}`);
    }

    return {
      success: true,
      message: 'Password has been reset successfully. All active sessions have been forced to log out.',
    };
  }

  /**
   * Updates an authenticated user's password, dropping all active tokens
   */
  async changePassword(userId, currentPassword, newPassword, ip, browser) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // 1. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Incorrect current password.', 400);
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Update User
    await userRepository.update(user._id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    // 4. Invalidate all Refresh Tokens (forces logout from every device)
    await refreshTokenRepository.deleteByUserId(user._id);

    // 5. Create Audit Log
    await auditLogRepository.create({
      email: user.email,
      action: 'PASSWORD_CHANGE',
      status: 'SUCCESS',
      ip,
      browser,
    });

    // 6. Send Security Alert Email
    try {
      await emailService.sendSecurityAlertEmail(
        user.email,
        `Your account password has been updated. Location/IP: ${ip}. If you did not initiate this change, contact our technical security team immediately.`
      );
    } catch (err) {
      console.warn(`[SMTP Warning] Failed to send security alert email: ${err.message}`);
    }

    return {
      success: true,
      message: 'Password changed successfully. All other active sessions have been signed out.',
    };
  }
}

export default new AccountRecoveryService();
