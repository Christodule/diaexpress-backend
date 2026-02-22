const {
  ensureRequestIdentity,
} = require('../services/diaexpressAuthService');
const { syncUserFromIdentity } = require('../services/userIdentityService');

exports.syncUser = async (req, res) => {
  try {
    const identity = ensureRequestIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Unauthorized: no identity' });
    }

    const user = await syncUserFromIdentity(identity);
    if (!user) {
      return res.status(500).json({ error: 'User sync failed' });
    }

    res.json({ user, identity });
  } catch (err) {
    console.error('❌ Sync error:', err);
    res.status(500).json({ error: 'User sync failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const identity = ensureRequestIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Unauthorized: no identity' });
    }

    const user = await syncUserFromIdentity(identity);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ identity, user });
  } catch (err) {
    console.error('❌ getMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
