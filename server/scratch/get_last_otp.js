import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OTP from '../src/models/otpModel.js';

dotenv.config();

const getLastOtp = async () => {
  try {
    const primaryURI = process.env.MONGODB_URI;
    const fallbackURI = 'mongodb://127.0.0.1:27017/mern-auth-system';
    
    try {
      await mongoose.connect(primaryURI, { serverSelectionTimeoutMS: 2000 });
    } catch {
      await mongoose.connect(fallbackURI);
    }

    const doc = await OTP.findOne().sort({ createdAt: -1 });
    if (doc) {
      console.log(`LAST_OTP_FOUND:${doc.otp}:${doc.email}:${doc.purpose}`);
    } else {
      console.log('NO_OTP_FOUND');
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

getLastOtp();
