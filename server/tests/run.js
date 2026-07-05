import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runAuthTests } from './auth.test.js';
import { runRecoveryTests } from './recovery.test.js';
import { runIamTests } from './iam.test.js';

dotenv.config();

const connectDB = async () => {
  const primaryURI = process.env.MONGODB_URI;
  const fallbackURI = 'mongodb://127.0.0.1:27017/mern-auth-system';
  try {
    return await mongoose.connect(primaryURI, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    return await mongoose.connect(fallbackURI, { serverSelectionTimeoutMS: 5000 });
  }
};

const runAll = async () => {
  try {
    await connectDB();
    console.log('===========================================================');
    console.log('🚀 RUNNING ALL PRODUCTION INTEGRATION TEST SUITES');
    console.log('===========================================================\n');

    // Run Auth Integration Suite
    const { accessToken, refreshToken } = await runAuthTests();

    // Run Account Recovery Suite
    await runRecoveryTests();

    // Run IAM & Session Management Suite
    await runIamTests();

    console.log('===========================================================');
    console.log('🎉 ALL SUITES PASSED SUCCESSFULLY');
    console.log('===========================================================');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUNNER TERMINATED WITH CRITICAL ERROR:\n', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

runAll();
