const { upsertAdminFromEnv } = require('./adminBootstrap');

async function seedAdminUser() {
  try {
    return await upsertAdminFromEnv('server-bootstrap');
  } catch (error) {
    console.warn('[admin-seed] Impossible de créer le compte admin de test:', error.message || error);
    return null;
  }
}

module.exports = { seedAdminUser };
