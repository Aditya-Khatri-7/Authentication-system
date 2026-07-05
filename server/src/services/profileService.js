import User from '../models/userModel.js';
import auditLogRepository from '../repositories/auditLogRepository.js';
import AppError from '../utils/appError.js';

class ProfileService {
  /**
   * Updates standard profile details (firstName, lastName, phone)
   */
  async updateProfile(userId, updateData, ip, browser) {
    const { firstName, lastName, phone } = updateData;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: { $ne: true } },
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Create Audit Log
    await auditLogRepository.create({
      email: user.email,
      action: 'PROFILE_UPDATED',
      status: 'SUCCESS',
      ip,
      browser,
      details: 'General profile details updated.',
    });

    return {
      success: true,
      message: 'Profile updated successfully.',
      user,
    };
  }

  /**
   * Updates avatar URL path
   */
  async updateAvatar(userId, avatarUrl, ip, browser) {
    if (avatarUrl === undefined) {
      throw new AppError('Avatar URL is required.', 400);
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: { $ne: true } },
      { $set: { avatar: avatarUrl } },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    await auditLogRepository.create({
      email: user.email,
      action: 'PROFILE_UPDATED',
      status: 'SUCCESS',
      ip,
      browser,
      details: 'Avatar URL updated.',
    });

    return {
      success: true,
      message: 'Avatar updated successfully.',
      user,
    };
  }

  /**
   * Updates user preference keys
   */
  async updatePreferences(userId, preferences, ip, browser) {
    if (!preferences || typeof preferences !== 'object') {
      throw new AppError('Preferences object is required.', 400);
    }

    // Convert preferences object to keys for Map storage
    const updatePayload = {};
    Object.keys(preferences).forEach(key => {
      updatePayload[`preferences.${key}`] = preferences[key];
    });

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: { $ne: true } },
      { $set: updatePayload },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    await auditLogRepository.create({
      email: user.email,
      action: 'PROFILE_UPDATED',
      status: 'SUCCESS',
      ip,
      browser,
      details: 'Preferences settings updated.',
    });

    return {
      success: true,
      message: 'Preferences updated successfully.',
      user,
    };
  }
}

export default new ProfileService();
