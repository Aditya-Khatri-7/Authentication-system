import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController.js';
import emailVerificationController from '../controllers/emailVerificationController.js';
import { 
  validateRegister, 
  validateLogin,
  validateForgotPassword,
  validateVerifyResetOtp,
  validateResetPassword,
  validateChangePassword
} from '../validators/authValidator.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Specific rate limiter for login requests to protect against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific rate limiter for resending OTPs (max 1 request per 60 seconds)
const resendOtpLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds window
  max: 1, // Limit each IP to 1 request per 60s
  message: {
    success: false,
    message: 'Please wait 60 seconds before requesting another verification code.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific rate limiter for forgot-password requests (max 5 requests per 15 minutes)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific rate limiter for OTP verification check endpoints (max 15 requests per 15 minutes)
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many verification attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration route
router.post('/register', validateRegister, authController.register);

// Login route with brute-force rate limiting
router.post('/login', loginLimiter, validateLogin, authController.login);

// Token refresh route
router.post('/refresh-token', authController.refreshToken);

// Logout route
router.post('/logout', authController.logout);

// Protected profile route
router.get('/me', verifyJWT, authController.me);

// Send verification OTP email (Authenticated route)
router.post('/send-verification', verifyJWT, emailVerificationController.sendVerification);

// Verify email address route
router.post('/verify-email', emailVerificationController.verifyEmail);

// Resend verification OTP route with 60s rate limiting
router.post('/resend-otp', resendOtpLimiter, emailVerificationController.resendOTP);

// Resend email verification OTP route (Authenticated route, 60s rate limiting)
router.post('/resend-verification', verifyJWT, resendOtpLimiter, emailVerificationController.resendVerification);

// Forgot password route
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, authController.forgotPassword);

// Verify reset password OTP route
router.post('/verify-reset-otp', otpVerifyLimiter, validateVerifyResetOtp, authController.verifyResetOtp);

// Reset password route
router.post('/reset-password', otpVerifyLimiter, validateResetPassword, authController.resetPassword);

// Change password route (Authenticated route)
router.post('/change-password', verifyJWT, validateChangePassword, authController.changePassword);

export default router;
