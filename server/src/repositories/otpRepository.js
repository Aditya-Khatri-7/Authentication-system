import OTP from '../models/otpModel.js';

class OTPRepository {
  async create(otpData) {
    const otpDoc = new OTP(otpData);
    return await otpDoc.save();
  }

  async deleteByEmail(email) {
    return await OTP.deleteMany({ email });
  }

  async findByEmailAndOtp(email, otp) {
    return await OTP.findOne({ email, otp });
  }

  /**
   * Finds the latest active (unused and unexpired) OTP document for a specific purpose
   */
  async findActiveOTP(email, purpose) {
    return await OTP.findOne({
      email: email.toLowerCase().trim(),
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  /**
   * Invalidates (deletes) all active, unused OTPs for an email and purpose
   */
  async invalidateOTP(email, purpose) {
    return await OTP.deleteMany({
      email: email.toLowerCase().trim(),
      purpose,
      isUsed: false,
    });
  }

  /**
   * Standard updates for an OTP document
   */
  async update(otpId, updateData) {
    return await OTP.findByIdAndUpdate(otpId, updateData, { new: true });
  }
}

export default new OTPRepository();
