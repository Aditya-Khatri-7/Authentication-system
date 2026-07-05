import User from '../models/userModel.js';

class UserRepository {
  /**
   * Finds an active (non-deleted) user by email
   */
  async findByEmail(email) {
    return await User.findOne({ 
      email: email.toLowerCase().trim(), 
      isDeleted: { $ne: true } 
    });
  }

  /**
   * Creates a new user record
   */
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  /**
   * Finds an active (non-deleted) user by ID
   */
  async findById(userId) {
    return await User.findOne({ 
      _id: userId, 
      isDeleted: { $ne: true } 
    });
  }

  /**
   * Updates an active (non-deleted) user
   */
  async update(userId, updateData) {
    return await User.findOneAndUpdate(
      { _id: userId, isDeleted: { $ne: true } }, 
      updateData, 
      { new: true }
    );
  }
}

export default new UserRepository();
