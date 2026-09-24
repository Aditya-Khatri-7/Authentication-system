import express from 'express';
import accountRecoveryService from '../services/accountRecoveryService.js';
import otpService from '../services/otpService.js';
import {
  validateForgotPassword,
  validateVerifyResetOtp,
  validateResetPassword,
} from '../validators/forgotPasswordValidator.js';

const router = express.Router();

// Request password reset OTP
router.post('/forgot-password', validateForgotPassword, async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await accountRecoveryService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Verify reset OTP code
router.post('/verify-reset-otp', validateVerifyResetOtp, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await accountRecoveryService.verifyResetOtp(email, otp);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Resend OTP code
router.post('/resend-otp', validateForgotPassword, async (req, res, next) => {
  try {
    const { email } = req.body;
    await otpService.createOTP(email, 'PASSWORD_RESET');
    res.status(200).json({
      success: true,
      message: 'A fresh OTP code has been generated and sent to your email.',
    });
  } catch (error) {
    next(error);
  }
});

// Reset Password
router.post('/reset-password', validateResetPassword, async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await accountRecoveryService.resetPassword(email, otp, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
