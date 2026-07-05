import profileService from '../services/profileService.js';
import AppError from '../utils/appError.js';

class ProfileController {
  /**
   * GET /api/profile
   */
  async getProfile(req, res, next) {
    try {
      // req.user is already populated by verifyJWT middleware without password.
      return res.success('User profile retrieved successfully', {
        user: {
          id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          phone: req.user.phone,
          role: req.user.role,
          avatar: req.user.avatar,
          preferences: req.user.preferences,
          isActive: req.user.isActive,
          isEmailVerified: req.user.isEmailVerified,
          permissions: req.user.permissions || [],
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/profile
   */
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;
      const userId = req.user._id;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      if (!firstName && !lastName && phone === undefined) {
        throw new AppError('At least one field to update (firstName, lastName, phone) must be provided.', 400);
      }

      const result = await profileService.updateProfile(
        userId,
        { firstName, lastName, phone },
        ip,
        browser
      );

      return res.success('Profile updated successfully', { user: result.user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/profile/avatar
   */
  async updateAvatar(req, res, next) {
    try {
      const { avatarUrl } = req.body;
      const userId = req.user._id;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await profileService.updateAvatar(userId, avatarUrl, ip, browser);
      return res.success('Avatar updated successfully', { user: result.user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/profile/preferences
   */
  async updatePreferences(req, res, next) {
    try {
      const { preferences } = req.body;
      const userId = req.user._id;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const browser = req.headers['user-agent'] || 'unknown';

      const result = await profileService.updatePreferences(userId, preferences, ip, browser);
      return res.success('Preferences updated successfully', { user: result.user });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProfileController();
