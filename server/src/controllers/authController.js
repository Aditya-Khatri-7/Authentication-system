import registrationService from '../services/registrationService.js';
import loginService from '../services/loginService.js';
import tokenService from '../services/tokenService.js';
import accountRecoveryService from '../services/accountRecoveryService.js';

class AuthController {
  /**
   * Handles POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, password, phone, captchaToken } = req.body;

      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await registrationService.registerUser(
        { firstName, lastName, email, password, phone, captchaToken },
        ip,
        browser
      );

      return res.success(result.message, { user: result.user }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password, loginType, captchaToken } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await loginService.loginUser(email, password, captchaToken, ip, browser, loginType);

      // Set HTTP Only Cookie for Refresh Token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });

      return res.success('Login successful', {
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await tokenService.rotateRefreshToken(token, ip, browser);

      // Reset rotated token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.success('Token rotated successfully', {
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const email = req.user?.email;

      await tokenService.logout(token, email, ip, browser);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      });

      return res.success('Logout successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles GET /api/auth/me
   */
  async me(req, res, next) {
    try {
      return res.success('User profile retrieved successfully', {
        user: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          role: req.user.role,
          permissions: req.user.permissions || [],
          isEmailVerified: req.user.isEmailVerified,
          lastLogin: req.user.lastLogin,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email, captchaToken } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await accountRecoveryService.forgotPassword(email, captchaToken, ip, browser);
      return res.success(result.message, result.data || {});
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/verify-reset-otp
   */
  async verifyResetOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await accountRecoveryService.verifyResetOtp(email, otp);
      return res.success(result.message, result.data || {});
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await accountRecoveryService.resetPassword(email, otp, newPassword, ip, browser);
      return res.success(result.message, result.data || {});
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';
      const userId = req.user._id;

      const result = await accountRecoveryService.changePassword(userId, currentPassword, newPassword, ip, browser);
      return res.success(result.message, result.data || {});
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
