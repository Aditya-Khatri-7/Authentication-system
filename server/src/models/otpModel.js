import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required for OTP'],
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    trim: true,
  },
  purpose: {
    type: String,
    required: [true, 'OTP purpose is required'],
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION'],
    index: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // Auto expires at the exact timestamp in expiresAt
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
