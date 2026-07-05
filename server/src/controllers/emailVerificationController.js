import emailVerificationService from '../services/emailVerificationService.js';

class EmailVerificationController {
  /**
   * Handles POST /api/auth/send-verification (Authenticated route)
   */
  async sendVerification(req, res, next) {
    try {
      const email = req.user.email;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await emailVerificationService.sendVerification(email, ip, browser);
      return res.success(result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await emailVerificationService.verifyEmail(email, otp, ip, browser);
      return res.success(result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/resend-otp
   */
  async resendOTP(req, res, next) {
    try {
      const { email, purpose } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await emailVerificationService.resendOTP(email, purpose, ip, browser);
      return res.success(result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/resend-verification (Authenticated route)
   */
  async resendVerification(req, res, next) {
    try {
      const email = req.user.email;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await emailVerificationService.resendVerification(email, ip, browser);
      return res.success(result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new EmailVerificationController();
