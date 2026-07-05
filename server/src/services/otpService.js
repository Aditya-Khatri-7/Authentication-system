import crypto from 'crypto';
import otpRepository from '../repositories/otpRepository.js';
import emailService from './emailService.js';
import AppError from '../utils/appError.js';

class OTPService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP
   */
  generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Creates a new OTP code, invalidates old ones, persists in DB, and fires the email
   */
  async createOTP(email, purpose) {
    const cleanEmail = email.toLowerCase().trim();
    
    // 1. Invalidate previous active unused OTPs for this email and purpose
    await otpRepository.invalidateOTP(cleanEmail, purpose);

    // 2. Generate secure OTP
    const otp = this.generateOTP();

    // 3. Define expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Save to database using Repository
    const otpDoc = await otpRepository.create({
      email: cleanEmail,
      otp,
      purpose,
      attempts: 0,
      isUsed: false,
      expiresAt,
    });

    // 5. Fire corresponding template email (non-blocking)
    try {
      if (purpose === 'EMAIL_VERIFICATION') {
        emailService.sendVerificationEmail(cleanEmail, otp);
      } else if (purpose === 'PASSWORD_RESET') {
        emailService.sendPasswordResetEmail(cleanEmail, otp);
      } else {
        emailService.sendOTPEmail(cleanEmail, otp, purpose);
      }
    } catch (err) {
      console.warn(`[OTP Error] Failed to trigger email delivery service: ${err.message}`);
    }

    return {
      otp,
      expiresAt,
    };
  }

  /**
   * Validates an OTP code, increments attempts, and handles brute-force locks
   */
  async validateOTP(email, otp, purpose, consume = true) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch active OTP doc from database
    const otpDoc = await otpRepository.findActiveOTP(cleanEmail, purpose);
    if (!otpDoc) {
      throw new AppError('Invalid or expired verification code.', 400);
    }

    // 2. Increment verification attempts
    otpDoc.attempts += 1;

    // 3. Max 5 verification attempts check
    if (otpDoc.attempts >= 5) {
      otpDoc.isUsed = true; // Invalidate OTP
      await otpDoc.save();
      throw new AppError('Verification code has been locked and invalidated due to too many failed attempts.', 400);
    }

    // Save attempts increment in database
    await otpDoc.save();

    // 4. Verify code match
    if (otpDoc.otp !== otp.trim()) {
      throw new AppError('Invalid verification code.', 400);
    }

    // 5. Mark OTP used on success if consume is true
    if (consume) {
      otpDoc.isUsed = true;
      await otpDoc.save();
    }

    return true;
  }
}

export default new OTPService();
