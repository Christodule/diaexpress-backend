const User = require('../models/User');
const { normaliseEmail } = require('./userIdentityService');

const logPrefix = '[admin-bootstrap]';

function buildSeedNote({ email, passwordHint, source }) {
  const noteLines = [
    'Compte administrateur initialisé pour le développement.',
    `Source: ${source || 'manual seed'}.`,
  ];

  if (email) {
    noteLines.push(`Email Clerk attendu: ${email}`);
  }

  if (passwordHint) {
    noteLines.push(`Indice mot de passe (dev uniquement): ${passwordHint}`);
  }

  return noteLines.join('\n');
}

function parseAdminEnv() {
  const email = normaliseEmail(process.env.ADMIN_DEFAULT_EMAIL || process.env.ADMIN_SEED_EMAIL);

  if (!email) {
    console.warn(
      `${logPrefix} ADMIN_DEFAULT_EMAIL manquant. Ajoutez ADMIN_DEFAULT_EMAIL et ADMIN_DEFAULT_PASSWORD dans .env (et pensez à ADMIN_WHITELIST).`,
    );
    return null;
  }

  return {
    email,
    passwordHint: process.env.ADMIN_DEFAULT_PASSWORD || process.env.ADMIN_SEED_PASSWORD || '',
    name: process.env.ADMIN_NAME || process.env.ADMIN_SEED_NAME || 'Dia Admin',
    clerkUserId:
      process.env.ADMIN_DEFAULT_CLERK_ID ||
      process.env.ADMIN_SEED_CLERK_ID ||
      process.env.ADMIN_SEED_EXTERNAL_ID ||
      null,
  };
}

async function upsertAdminUser({ email, name, passwordHint, clerkUserId, source = 'seed:admin' }) {
  const normalizedEmail = normaliseEmail(email);
  if (!normalizedEmail) {
    throw new Error('ADMIN_DEFAULT_EMAIL est requis pour insérer un compte admin.');
  }

  const now = new Date();
  const note = buildSeedNote({ email: normalizedEmail, passwordHint, source });

  const setPayload = {
    email: normalizedEmail,
    name: name || 'Dia Admin',
    fullName: name || 'Dia Admin',
    firstName: name ? name.split(' ')[0] : 'Dia',
    lastName: name ? name.split(' ').slice(1).join(' ') || 'Admin' : 'Admin',
    role: 'admin',
    notes: note,
    lastSyncedAt: now,
  };

  if (clerkUserId) {
    setPayload.clerkUserId = clerkUserId;
    setPayload.externalId = clerkUserId;
  }

  const admin = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: setPayload, $setOnInsert: { createdAt: now, updatedAt: now } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  return admin;
}

async function upsertAdminFromEnv(source = 'server-bootstrap') {
  const config = parseAdminEnv();
  if (!config) {
    return null;
  }

  const admin = await upsertAdminUser({ ...config, source });
  if (admin) {
    console.info(`${logPrefix} Admin upserted: ${admin.email} (id: ${admin.id || admin._id})`);
  }
  return admin;
}

module.exports = {
  upsertAdminUser,
  upsertAdminFromEnv,
};
