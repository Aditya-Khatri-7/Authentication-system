import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/userModel.js';
import RefreshToken from '../src/models/refreshTokenModel.js';

const API_URL = 'http://localhost:5000/api';

export const runIamTests = async () => {
  console.log('--- RUNNING IAM & ACCESS CONTROL INTEGRATION TESTS ---');

  // Clean databases
  await User.deleteMany({ email: { $in: ['super.admin@auth.local', 'manager@auth.local', 'user.test@auth.local'] } });
  await RefreshToken.deleteMany({});

  // 1. Create mock users in DB
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 12);
  const managerPassword = await bcrypt.hash('Manager@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  const superAdmin = await User.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'super.admin@auth.local',
    password: superAdminPassword,
    role: 'SUPER_ADMIN',
    isEmailVerified: true,
    isActive: true,
  });

  const manager = await User.create({
    firstName: 'Manager',
    lastName: 'User',
    email: 'manager@auth.local',
    password: managerPassword,
    role: 'MANAGER',
    isEmailVerified: true,
    isActive: true,
  });

  const standardUser = await User.create({
    firstName: 'Standard',
    lastName: 'User',
    email: 'user.test@auth.local',
    password: userPassword,
    role: 'USER',
    isEmailVerified: true,
    isActive: true,
  });

  // Login helper
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return data.data.accessToken;
  };

  const superToken = await login('super.admin@auth.local', 'SuperAdmin@123');
  const managerToken = await login('manager@auth.local', 'Manager@123');
  const userToken = await login('user.test@auth.local', 'User@123');

  // ==========================================
  // 2. ROLE BASED ACCESS CONTROLS (RBAC)
  // ==========================================
  console.log('⏳ Test 1: Testing Role Access Controls (RBAC)...');
  const userAccessUsers = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const managerAccessUsers = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const managerDeleteUser = await fetch(`${API_URL}/admin/users/${standardUser._id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });

  if (userAccessUsers.status === 403 && managerAccessUsers.status === 200 && managerDeleteUser.status === 403) {
    console.log('✅ Test 1 passed: Default role boundaries correctly enforced.');
  } else {
    throw new Error(`Test 1 failed. User status: ${userAccessUsers.status}, Manager status: ${managerAccessUsers.status}`);
  }

  // ==========================================
  // 3. USER PROFILE CUSTOMIZATIONS
  // ==========================================
  console.log('⏳ Test 2: Customizing profile...');
  await fetch(`${API_URL}/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ firstName: 'Aditya', lastName: 'Khatri', phone: '+1234567890' })
  });

  await fetch(`${API_URL}/profile/avatar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ avatarUrl: 'http://cdn.auth.local/aditya.png' })
  });

  await fetch(`${API_URL}/profile/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ preferences: { theme: 'dark', notifications: false } })
  });

  const getProfile = await fetch(`${API_URL}/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const profileBody = await getProfile.json();

  if (
    profileBody.data.user.firstName === 'Aditya' &&
    profileBody.data.user.avatar === 'http://cdn.auth.local/aditya.png' &&
    profileBody.data.user.preferences.theme === 'dark'
  ) {
    console.log('✅ Test 2 passed: Profile updates verified.');
  } else {
    throw new Error('Test 2 failed: Mismatch on profile update parameters.');
  }

  // ==========================================
  // 4. PERMISSION OVERRIDES & SOFT DELETIONS
  // ==========================================
  console.log('⏳ Test 3: Overriding manager permissions and soft-deleting standard user...');
  const overrideRes = await fetch(`${API_URL}/admin/users/${manager._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${superToken}`
    },
    body: JSON.stringify({
      permissions: ['users.read', 'users.delete']
    })
  });

  if (overrideRes.status === 200) {
    const freshManagerToken = await login('manager@auth.local', 'Manager@123');
    const managerDeleteUserOverridden = await fetch(`${API_URL}/admin/users/${standardUser._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${freshManagerToken}` }
    });

    if (managerDeleteUserOverridden.status === 200) {
      console.log('✅ Test 3 passed: Manager successfully soft-deleted user via override.');
    } else {
      throw new Error(`Test 3 failed: Delete status = ${managerDeleteUserOverridden.status}`);
    }
  } else {
    throw new Error('Test 3 failed: Permission override update failed.');
  }

  // ==========================================
  // 5. SESSION MANAGEMENT TERMINATION
  // ==========================================
  console.log('⏳ Test 4: Terminating user session...');
  const getSessions = await fetch(`${API_URL}/admin/sessions`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${superToken}` }
  });
  const sessionsBody = await getSessions.json();

  if (sessionsBody.data.sessions.length > 0) {
    const targetSessionId = sessionsBody.data.sessions[0].id;
    const deleteSession = await fetch(`${API_URL}/admin/sessions/${targetSessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superToken}` }
    });

    const dbSession = await RefreshToken.findById(targetSessionId);
    if (deleteSession.status === 200 && !dbSession) {
      console.log('✅ Test 4 passed: Session terminated successfully.');
    } else {
      throw new Error('Test 4 failed: Session remained in DB.');
    }
  } else {
    console.log('⚠️ Test 4 skipped: No active sessions found.');
  }

  // ==========================================
  // 6. SOFT DELETE SEARCH CONTROLS
  // ==========================================
  console.log('⏳ Test 5: Checking search listing excludes soft-deleted user...');
  const listRes = await fetch(`${API_URL}/admin/users?search=user.test`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${superToken}` }
  });
  const listBody = await listRes.json();

  const loginResDeleted = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user.test@auth.local', password: 'User@123' }),
  });

  if (listBody.data.total === 0 && loginResDeleted.status === 401) {
    console.log('✅ Test 5 passed: Soft deleted user correctly hidden from logins and lookups.');
  } else {
    throw new Error(`Test 5 failed. List count: ${listBody.data.total}, Login status: ${loginResDeleted.status}`);
  }

  console.log('✨ IAM & Access Control integration tests completed successfully!\n');
};
