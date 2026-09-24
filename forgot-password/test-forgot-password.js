import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './server/models/User.js';
import OTP from './server/models/OTP.js';
import forgotPasswordRoutes from './server/routes/forgotPasswordRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', forgotPasswordRoutes);

async function runTest() {
  console.log('🧪 [Test] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ [Test] MongoDB connected successfully.');

  const testEmail = 'test-recovery@example.com';
  const testPassword = 'Password@123';
  const newTestPassword = 'NewPassword@999';

  // 1. Clean up existing test data & create a test user
  console.log(`🧹 [Test] Cleaning up any old test data for ${testEmail}...`);
  await User.deleteOne({ email: testEmail });
  await OTP.deleteMany({ email: testEmail });

  console.log('👤 [Test] Creating mock user in DB...');
  const hashedPassword = await bcrypt.hash(testPassword, 12);
  const user = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: testEmail,
    password: hashedPassword,
  });
  console.log(`✅ [Test] Mock user created. ID: ${user._id}`);

  // Start temporary Express server to handle API calls
  const server = app.listen(5001, async () => {
    console.log('🚀 [Test] Temporary Express server running on port 5001.');

    try {
      // 2. Trigger Forgot Password request
      console.log('📧 [Test] Sending POST /api/auth/forgot-password...');
      const reqReset = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const resetResult = await reqReset.json();
      console.log('📨 [Test] Response:', resetResult);

      if (!resetResult.success) {
        throw new Error('Forgot password request failed.');
      }

      // 3. Fetch OTP from DB (simulating checking email inbox)
      console.log('🔍 [Test] Retrieving OTP code directly from database...');
      const otpDoc = await OTP.findOne({ email: testEmail, isUsed: false }).sort({ createdAt: -1 });
      if (!otpDoc) {
        throw new Error('No OTP document found in MongoDB.');
      }
      console.log(`🔑 [Test] Found OTP: "${otpDoc.otp}"`);

      // 4. Verify OTP Code
      console.log('🛡️ [Test] Sending POST /api/auth/verify-reset-otp...');
      const reqVerify = await fetch('http://localhost:5001/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, otp: otpDoc.otp }),
      });
      const verifyResult = await reqVerify.json();
      console.log('📨 [Test] Response:', verifyResult);

      if (!verifyResult.success) {
        throw new Error('OTP verification failed.');
      }

      // 5. Submit Password Reset
      console.log('🔒 [Test] Sending POST /api/auth/reset-password...');
      const reqUpdate = await fetch('http://localhost:5001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          otp: otpDoc.otp,
          newPassword: newTestPassword,
        }),
      });
      const updateResult = await reqUpdate.json();
      console.log('📨 [Test] Response:', updateResult);

      if (!updateResult.success) {
        throw new Error('Password reset submission failed.');
      }

      // 6. Verify User's Password is now updated in DB
      console.log('🔑 [Test] Verifying new password against DB record...');
      const updatedUser = await User.findOne({ email: testEmail });
      const passwordMatch = await bcrypt.compare(newTestPassword, updatedUser.password);
      
      if (passwordMatch) {
        console.log('\n🌟🌟🌟 [SUCCESS] FORGOT PASSWORD FEATURE SYSTEM WORKS PERFECTLY! 🌟🌟🌟\n');
      } else {
        throw new Error('Password does not match the newly set password.');
      }

    } catch (err) {
      console.error('❌ [Test Error] Verification failed:', err.message);
    } finally {
      // Cleanup database
      console.log('🧹 [Test] Cleaning up database test records...');
      await User.deleteOne({ email: testEmail });
      await OTP.deleteMany({ email: testEmail });

      server.close();
      await mongoose.disconnect();
      console.log('🔌 [Test] Database disconnected. Test complete.');
    }
  });
}

runTest();
