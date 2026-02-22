// 📁 middleware/syncUser.js
const { ensureRequestIdentityAsync } = require('../services/diaexpressAuthService');
const { syncUserFromIdentity } = require('../services/userIdentityService');

module.exports = async (req, res, next) => {
  try {
    const identity = await ensureRequestIdentityAsync(req);
    if (!identity) {
      return res.status(401).json({ message: 'Profil utilisateur introuvable' });
    }

    const user = await syncUserFromIdentity(identity);
    if (!user) {
      return res.status(500).json({ message: 'Impossible de synchroniser le profil utilisateur' });
    }

    req.dbUser = user;
    req.userId = user._id;
    next();
  } catch (err) {
    console.warn('❌ Erreur sync user:', err.message || err);
    next(err);
  }
};
