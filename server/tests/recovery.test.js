import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/userModel.js';
import OTP from '../src/models/otpModel.js';
import RefreshToken from '../src/models/refreshTokenModel.js';

const API_URL = 'http://localhost:5000/api/auth';
const email = 'aditya.test@auth.local';
const initialPassword = 'Auth@12345';
const newPassword = 'NewSecure@Password123';
const finalPassword = 'FinalSecure@Password99';

export const runRecoveryTests = async () => {
  console.log('--- RUNNING ACCOUNT RECOVERY INTEGRATION TESTS ---');

  // Verify test user is active and has initial password set
  const hashedInitPwd = await bcrypt.hash(initialPassword, 12);
  await User.updateOne({ email }, { $set: { password: hashedInitPwd, passwordChangedAt: null } });

  // ==========================================
  // 1. FORGOT PASSWORD (VALID EMAIL)
  // ==========================================
  console.log('⏳ Test 1: Requesting forgot-password...');
  const forgotRes = await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const forgotBody = await forgotRes.json();
  if (forgotRes.status === 200 && forgotBody.success === true) {
    console.log('✅ Test 1 passed: Forgot password request succeeded.');
  } else {
    throw new Error(`Test 1 failed. Status: ${forgotRes.status}`);
  }

  // Get OTP from DB
  const otpDoc = await OTP.findOne({ email, purpose: 'PASSWORD_RESET', isUsed: false }).sort({ createdAt: -1 });
  if (!otpDoc) {
    throw new Error('Test 1 failed: No OTP generated in DB.');
  }
  console.log(`   - DB Verify: Password Reset OTP is "${otpDoc.otp}".`);

  // ==========================================
  // 2. OTP ATTEMPTS LOCKOUT
  // ==========================================
  console.log('⏳ Test 2: Verifying 5 wrong OTP inputs lock/invalidate code...');
  for (let i = 1; i <= 5; i++) {
    const verifyRes = await fetch(`${API_URL}/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '999999' }),
    });

    if (i === 5) {
      const body = await verifyRes.json();
      if (verifyRes.status === 400 && body.message.includes('locked and invalidated')) {
        console.log('✅ Test 2 passed: 5th failure invalidated the OTP.');
        const checkUsed = await OTP.findById(otpDoc._id);
        console.log(`   - DB Verify: OTP isUsed status is now ${checkUsed.isUsed}`);
      } else {
        throw new Error(`Test 2 failed. Status: ${verifyRes.status}`);
      }
    }
  }

  // ==========================================
  // 3. VERIFY RESET OTP (WITHOUT CONSUMING)
  // ==========================================
  console.log('⏳ Test 3: Regenerating reset code and verifying check (without consuming)...');
  await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const activeOtpDoc = await OTP.findOne({ email, purpose: 'PASSWORD_RESET', isUsed: false }).sort({ createdAt: -1 });
  if (!activeOtpDoc) {
    throw new Error('Test 3 failed: No OTP generated in DB.');
  }

  const checkRes = await fetch(`${API_URL}/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: activeOtpDoc.otp }),
  });

  const checkBody = await checkRes.json();
  const dbCheck = await OTP.findById(activeOtpDoc._id);
  if (checkRes.status === 200 && checkBody.success === true && dbCheck.isUsed === false) {
    console.log('✅ Test 3 passed: OTP validated but not consumed.');
  } else {
    throw new Error(`Test 3 failed. Status: ${checkRes.status}`);
  }

  // ==========================================
  // 4. RESET PASSWORD & FORCED DEVICE LOGOUT
  // ==========================================
  console.log('⏳ Test 4: Resetting password and checking active session drop...');
  // Create mock session to ensure deletion
  const testUser = await User.findOne({ email });
  await RefreshToken.create({
    token: 'mock-session-token-to-delete-1',
    userId: testUser._id,
    expiresAt: new Date(Date.now() + 1000000),
  });

  const resetRes = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      otp: activeOtpDoc.otp,
      newPassword,
      confirmPassword: newPassword,
    }),
  });

  const resetBody = await resetRes.json();
  const activeSessions = await RefreshToken.find({ userId: testUser._id });
  
  if (resetRes.status === 200 && resetBody.success === true && activeSessions.length === 0) {
    console.log('✅ Test 4 passed: Password reset, mock token deleted.');
  } else {
    throw new Error(`Test 4 failed. Status: ${resetRes.status}, sessions: ${activeSessions.length}`);
  }

  // ==========================================
  // 5. CHANGE PASSWORD (AUTHENTICATED)
  // ==========================================
  console.log('⏳ Test 5: Changing password as authenticated user...');
  // Login with new password
  const loginRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: newPassword }),
  });
  const loginBody = await loginRes.json();
  const token = loginBody.data.accessToken;

  // Create mock session
  await RefreshToken.create({
    token: 'mock-session-token-to-delete-2',
    userId: testUser._id,
    expiresAt: new Date(Date.now() + 1000000),
  });

  const changeRes = await fetch(`${API_URL}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: newPassword,
      newPassword: finalPassword,
      confirmPassword: finalPassword,
    }),
  });

  const changeBody = await changeRes.json();
  const activeSessions2 = await RefreshToken.find({ userId: testUser._id });

  if (changeRes.status === 200 && changeBody.success === true && activeSessions2.length === 0) {
    console.log('✅ Test 5 passed: Change password completed, mock tokens dropped.');
  } else {
    throw new Error(`Test 5 failed. Status: ${changeRes.status}, sessions: ${activeSessions2.length}`);
  }

  console.log('✨ Account recovery integration tests completed successfully!\n');
};
