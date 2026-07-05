import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import otpRepository from '../repositories/otpRepository.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import emailService from './emailService.js';
import AppError from '../utils/appError.js';
import { verifyRecaptcha } from '../utils/verifyRecaptcha.js';

class RegistrationService {
  /**
   * Orchestrates the complete user registration business flow
   */
  async registerUser(userData, ip, browser) {
    const { firstName, lastName, email, password, phone, captchaToken } = userData;

    // Verify Cloudflare Turnstile token
    await verifyRecaptcha(captchaToken);

    // 1. Check whether email already exists
    const userExists = await userRepository.findByEmail(email);
    if (userExists) {
      // Create a FAILED audit log for security tracking on duplicate registration attempt
      await auditLogRepository.create({
        email,
        action: 'REGISTER',
        status: 'FAILED',
        ip,
        browser,
      });
      throw new AppError('Email already registered', 409);
    }

    // 2. Hash password using bcrypt with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create new user with default values and store using UserRepository
    const newUser = await userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: 'USER',
      isActive: true,
      isEmailVerified: false,
      failedLoginAttempts: 0,
    });

    // 4. Generate random six digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Store OTP document using OTP Repository (and clear any prior pending OTPs for this email)
    await otpRepository.deleteByEmail(email);
    await otpRepository.create({
      email,
      otp,
      purpose: 'EMAIL_VERIFICATION',
      isUsed: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    });

    // 6. Send verification email via EmailService
    // Runs in the background (fire-and-forget) to keep registration response fast.
    // Nodemailer check on credentials happens inside EmailService.
    emailService.sendVerificationOTP(email, otp);

    // 7. Create a SUCCESS Audit Log
    await auditLogRepository.create({
      email,
      action: 'REGISTER',
      status: 'SUCCESS',
      ip,
      browser,
    });

    // 8. Return registration success payload excluding password
    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
    };
  }
}

export default new RegistrationService();
