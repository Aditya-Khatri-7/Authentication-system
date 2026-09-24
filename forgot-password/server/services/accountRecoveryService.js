import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import otpService from './otpService.js';
import emailService from './emailService.js';

class AccountRecoveryService {
  /**
   * Request password reset code
   */
  async forgotPassword(email) {
    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await User.findOne({ email: cleanEmail });
      
      // Always generate OTP if user exists
      if (user) {
        await otpService.createOTP(cleanEmail, 'PASSWORD_RESET');
      }
    } catch (error) {
      console.warn(`[Forgot Password Alert] Error processing for ${cleanEmail}: ${error.message}`);
    }

    // Always return generic response to prevent email enumeration attacks
    return {
      success: true,
      message: 'If that email address exists in our system, an OTP code has been sent.',
    };
  }

  /**
   * Verify OTP code without consuming it
   */
  async verifyResetOtp(email, otp) {
    const cleanEmail = email.toLowerCase().trim();
    await otpService.validateOTP(cleanEmail, otp, 'PASSWORD_RESET', false);

    return {
      success: true,
      message: 'OTP code verified successfully.',
    };
  }

  /**
   * Reset user password using verified OTP code
   */
  async resetPassword(email, otp, newPassword) {
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    // 1. Consume OTP code
    await otpService.validateOTP(cleanEmail, otp, 'PASSWORD_RESET', true);

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Update User document
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // 4. Send email notification
    try {
      await emailService.sendPasswordChangedEmail(cleanEmail);
    } catch (err) {
      console.warn(`[SMTP Warning] Failed to send password reset completion notice: ${err.message}`);
    }

    return {
      success: true,
      message: 'Password has been reset successfully.',
    };
  }
}

export default new AccountRecoveryService();
