import mongoose from 'mongoose';
import User from '../src/models/userModel.js';
import RefreshToken from '../src/models/refreshTokenModel.js';

const API_URL = 'http://localhost:5000/api/auth';
const email = 'aditya.test@auth.local';
const password = 'Auth@12345';

export const runAuthTests = async () => {
  console.log('--- RUNNING AUTHENTICATION INTEGRATION TESTS ---');

  // Reset state
  await User.deleteMany({ email });
  await RefreshToken.deleteMany({});
  console.log('🔄 Cleared database records for test email.');

  // ==========================================
  // 1. REGISTRATION
  // ==========================================
  console.log('⏳ Test 1: Registering user...');
  const regRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Aditya',
      lastName: 'Khatri',
      email,
      password,
      phone: '9876543210'
    }),
  });

  const regBody = await regRes.json();
  if (regRes.status === 201 && regBody.success === true && regBody.data.user.email === email) {
    console.log('✅ Test 1 passed: User registered. Success envelope match.');
  } else {
    throw new Error(`Test 1 failed. Status: ${regRes.status}, Body: ${JSON.stringify(regBody)}`);
  }

  // ==========================================
  // 2. DUPLICATE EMAIL REGISTRATION (CONFLICT)
  // ==========================================
  console.log('⏳ Test 2: Registering duplicate email...');
  const dupRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Aditya',
      lastName: 'Khatri',
      email,
      password,
    }),
  });

  const dupBody = await dupRes.json();
  if (dupRes.status === 409 || (dupRes.status === 400 && dupBody.message.includes('already registered'))) {
    console.log('✅ Test 2 passed: Duplicate email registration blocked.');
  } else {
    throw new Error(`Test 2 failed. Status: ${dupRes.status}, Body: ${JSON.stringify(dupBody)}`);
  }

  // ==========================================
  // 3. WRONG PASSWORD LOGIN
  // ==========================================
  console.log('⏳ Test 3: Logging in with wrong password...');
  const wrongLoginRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'WrongPassword@123' }),
  });

  const wrongLoginBody = await wrongLoginRes.json();
  if (wrongLoginRes.status === 401 && wrongLoginBody.success === false) {
    console.log('✅ Test 3 passed: Wrong password login returned 401 Unauthorized.');
  } else {
    throw new Error(`Test 3 failed. Status: ${wrongLoginRes.status}`);
  }

  // ==========================================
  // 4. SUCCESSFUL LOGIN
  // ==========================================
  console.log('⏳ Test 4: Logging in with correct credentials...');
  const loginRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const loginBody = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie');
  
  let refreshToken = '';
  if (cookies && cookies.includes('refreshToken')) {
    const match = cookies.match(/refreshToken=([^;]+)/);
    refreshToken = match ? match[1] : '';
  }

  if (loginRes.status === 200 && loginBody.success === true && loginBody.data.accessToken) {
    console.log('✅ Test 4 passed: Correct credentials returned 200 OK and accessToken.');
  } else {
    throw new Error(`Test 4 failed. Status: ${loginRes.status}, Body: ${JSON.stringify(loginBody)}`);
  }

  // ==========================================
  // 5. PROFILE ACCESS (/me)
  // ==========================================
  console.log('⏳ Test 5: Accessing protected profile (/me)...');
  const meRes = await fetch(`${API_URL}/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${loginBody.data.accessToken}` }
  });

  const meBody = await meRes.json();
  if (meRes.status === 200 && meBody.success === true && meBody.data.user.email === email) {
    console.log('✅ Test 5 passed: Profile retrieved successfully.');
  } else {
    throw new Error(`Test 5 failed. Status: ${meRes.status}`);
  }

  // ==========================================
  // 6. REFRESH TOKEN ROTATION
  // ==========================================
  console.log('⏳ Test 6: Rotating refresh token...');
  const refreshRes = await fetch(`${API_URL}/refresh-token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `refreshToken=${refreshToken}`
    },
    body: JSON.stringify({ refreshToken }) // fallback if cookie is not parsed
  });

  const refreshBody = await refreshRes.json();
  if (refreshRes.status === 200 && refreshBody.success === true && refreshBody.data.accessToken) {
    console.log('✅ Test 6 passed: Refresh token rotated successfully.');
  } else {
    throw new Error(`Test 6 failed. Status: ${refreshRes.status}, Body: ${JSON.stringify(refreshBody)}`);
  }

  // ==========================================
  // 7. LOGOUT
  // ==========================================
  console.log('⏳ Test 7: Logging out session...');
  const logoutRes = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `refreshToken=${refreshToken}`
    },
    body: JSON.stringify({ refreshToken })
  });

  const logoutBody = await logoutRes.json();
  if (logoutRes.status === 200 && logoutBody.success === true) {
    console.log('✅ Test 7 passed: Logout returned 200 OK.');
  } else {
    throw new Error(`Test 7 failed. Status: ${logoutRes.status}`);
  }

  console.log('✨ Authentication integration tests completed successfully!\n');
  return { accessToken: loginBody.data.accessToken, refreshToken };
};
