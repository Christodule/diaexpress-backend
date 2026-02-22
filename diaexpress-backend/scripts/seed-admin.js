#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { upsertAdminUser } = require('../services/adminBootstrap');

async function run() {
  const email = process.env.ADMIN_DEFAULT_EMAIL || process.env.ADMIN_SEED_EMAIL;

  if (!email) {
    console.error('ADMIN_DEFAULT_EMAIL est requis pour seed un compte admin.');
    process.exit(1);
  }

  await connectDB();

  try {
    const admin = await upsertAdminUser({
      email,
      name: process.env.ADMIN_NAME || process.env.ADMIN_SEED_NAME || 'Dia Admin',
      passwordHint: process.env.ADMIN_DEFAULT_PASSWORD || process.env.ADMIN_SEED_PASSWORD || '',
      clerkUserId:
        process.env.ADMIN_DEFAULT_CLERK_ID ||
        process.env.ADMIN_SEED_CLERK_ID ||
        process.env.ADMIN_SEED_EXTERNAL_ID ||
        null,
      source: 'scripts/seed-admin.js',
    });

    if (admin) {
      console.log(`Admin upserted: ${admin.email} (id: ${admin.id || admin._id})`);
    }
  } catch (error) {
    console.error('❌ Admin seed failed:', error.message || error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
