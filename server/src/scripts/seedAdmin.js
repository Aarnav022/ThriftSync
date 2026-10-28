import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../modules/users/userModel.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

export async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;
  const adminPassword = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : null;
  const adminName = process.env.ADMIN_NAME ? process.env.ADMIN_NAME.trim() : 'Campus Administrator';
  const campus = process.env.ADMIN_CAMPUS ? process.env.ADMIN_CAMPUS.trim() : 'Central Administration';

  if (!adminEmail || !adminPassword) {
    console.error('[seedAdmin] Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exitCode = 1;
    return false;
  }

  if (adminPassword.length < 8) {
    console.error('[seedAdmin] Error: ADMIN_PASSWORD must be at least 8 characters long.');
    process.exitCode = 1;
    return false;
  }

  console.log(`[seedAdmin] Connecting to database...`);
  await connectDatabase();

  try {
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      existing.campus = campus;
      if (process.env.ADMIN_FORCE_PASSWORD_RESET === 'true') {
        existing.password = adminPassword;
        existing.tokenVersion = (existing.tokenVersion || 0) + 1;
      }
      await existing.save();
      console.log(`[seedAdmin] Existing user ${adminEmail} updated to role: 'admin'.`);
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        campus,
        isActive: true,
        tokenVersion: 0,
      });
      console.log(`[seedAdmin] Successfully created new administrator account for ${adminEmail}.`);
    }
    return true;
  } catch (err) {
    console.error(`[seedAdmin] Failed to seed administrator:`, err.message);
    process.exitCode = 1;
    return false;
  } finally {
    await disconnectDatabase();
    console.log(`[seedAdmin] Database connection closed.`);
  }
}

// Auto-run if executed directly as a script
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  seedAdmin();
}
