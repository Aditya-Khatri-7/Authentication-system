import otpService from './otpService.js';
import userRepository from '../repositories/userRepository.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import AppError from '../utils/appError.js';

class EmailVerificationService {
  /**
   * Generates and dispatches a verification code, with audit log tracking
   */
  async sendVerification(email, ip, browser) {
    // 1. Generate and save EMAIL_VERIFICATION OTP
    await otpService.createOTP(email, 'EMAIL_VERIFICATION');

    // 2. Create Audit Log
    await auditLogRepository.create({
      email,
      action: 'OTP_SENT',
      status: 'SUCCESS',
      ip,
      browser,
    });

    return {
      success: true,
      message: 'Verification OTP sent successfully.',
    };
  }

  /**
   * Validates OTP code, updates user verification state, and writes audits
   */
  async verifyEmail(email, otp, ip, browser) {
    if (!email || !otp) {
      throw new AppError('Email and OTP code are required.', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Validate and consume OTP
    await otpService.validateOTP(cleanEmail, otp, 'EMAIL_VERIFICATION', true);

    // 2. Find and update User
    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    await userRepository.update(user._id, { isEmailVerified: true });

    // 3. Create Audit Logs
    await auditLogRepository.create({
      email: cleanEmail,
      action: 'OTP_VERIFIED',
      status: 'SUCCESS',
      ip,
      browser,
    });

    await auditLogRepository.create({
      email: cleanEmail,
      action: 'EMAIL_VERIFIED',
      status: 'SUCCESS',
      ip,
      browser,
    });

    return {
      success: true,
      message: 'Email address verified successfully.',
    };
  }

  /**
   * Resends OTP code for general purpose requests
   */
  async resendOTP(email, purpose, ip, browser) {
    if (!email || !purpose) {
      throw new AppError('Email and purpose are required.', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    const validPurposes = ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION'];
    if (!validPurposes.includes(purpose)) {
      throw new AppError('Invalid OTP purpose.', 400);
    }

    // Generate new OTP
    await otpService.createOTP(cleanEmail, purpose);

    // Create Audit Log
    await auditLogRepository.create({
      email: cleanEmail,
      action: 'OTP_RESENT',
      status: 'SUCCESS',
      ip,
      browser,
    });

    return {
      success: true,
      message: 'New verification OTP sent successfully.',
    };
  }

  /**
   * Resends email verification code for active authenticated sessions
   */
  async resendVerification(email, ip, browser) {
    // Generate new OTP
    await otpService.createOTP(email, 'EMAIL_VERIFICATION');

    // Create Audit Log
    await auditLogRepository.create({
      email,
      action: 'OTP_RESENT',
      status: 'SUCCESS',
      ip,
      browser,
    });

    return {
      success: true,
      message: 'Verification OTP resent successfully.',
    };
  }
}

export default new EmailVerificationService();
