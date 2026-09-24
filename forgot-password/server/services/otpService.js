import crypto from 'crypto';
import OTP from '../models/OTP.js';
import emailService from './emailService.js';

class OTPService {
  /**
   * Generates a secure 6-digit numeric OTP
   */
  generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Generates, saves, and emails a new OTP code
   */
  async createOTP(email, purpose = 'PASSWORD_RESET') {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Invalidate previous active unused OTPs for this email and purpose
    await OTP.updateMany(
      { email: cleanEmail, purpose, isUsed: false },
      { $set: { isUsed: true } }
    );

    // 2. Generate secure 6-digit OTP
    const otp = this.generateOTP();

    // 3. Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Save to database
    await OTP.create({
      email: cleanEmail,
      otp,
      purpose,
      attempts: 0,
      isUsed: false,
      expiresAt,
    });

    // Output OTP directly to terminal console for instant dev testing
    console.log(`\n======================================================`);
    console.log(`🔑 [DEV LOG] OTP Code for ${cleanEmail}: ${otp}`);
    console.log(`======================================================\n`);

    // 5. Fire corresponding email template
    try {
      emailService.sendPasswordResetEmail(cleanEmail, otp);
    } catch (err) {
      console.warn(`[OTP Error] Failed to trigger email delivery: ${err.message}`);
    }

    return { otp, expiresAt };
  }

  /**
   * Validates OTP code correctness, checks expiry and max attempt limits
   */
  async validateOTP(email, otp, purpose = 'PASSWORD_RESET', consume = true) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch active unused non-expired OTP record
    const otpDoc = await OTP.findOne({
      email: cleanEmail,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      const error = new Error('Invalid or expired verification code.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Increment attempt counter
    otpDoc.attempts += 1;

    // 3. Lock after 5 failed attempts
    if (otpDoc.attempts >= 5) {
      otpDoc.isUsed = true;
      await otpDoc.save();
      const error = new Error('Verification code has been locked due to too many failed attempts.');
      error.statusCode = 400;
      throw error;
    }

    await otpDoc.save();

    // 4. Check if code matches
    if (otpDoc.otp !== otp.trim()) {
      const error = new Error('Invalid verification code.');
      error.statusCode = 400;
      throw error;
    }

    // 5. Consume OTP if requested
    if (consume) {
      otpDoc.isUsed = true;
      await otpDoc.save();
    }

    return true;
  }
}

export default new OTPService();
