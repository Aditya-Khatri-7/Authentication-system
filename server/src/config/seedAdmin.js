import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

/**
 * Seeds a default SUPER_ADMIN user on server startup.
 * Specifically checks for the email 'admin@gatekeeper.local'.
 */
export const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@gatekeeper.local';
    let admin = await User.findOne({ email: adminEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    if (!admin) {
      console.log(`[Seed] Creating default Super Admin account (${adminEmail})...`);
      admin = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
        isActive: true,
        permissions: [] // Let it inherit all default Super Admin permissions from roles.js
      });
      console.log(`[Seed] Super Admin created successfully.`);
    } else {
      console.log(`[Seed] Super Admin account (${adminEmail}) already exists. Resetting permissions and password...`);
      admin.password = hashedPassword;
      admin.role = 'SUPER_ADMIN'; // Ensure role is correct
      admin.isActive = true;
      admin.permissions = []; // Reset custom permissions so it inherits defaults
      await admin.save();
      console.log(`[Seed] Super Admin permissions and password updated successfully.`);
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed default Super Admin:', error.message);
  }
};

export default seedAdmin;
