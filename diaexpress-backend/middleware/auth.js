// 📁 middleware/auth.js
const appConfig = require('../config/appConfig');
const { ensureRequestIdentityAsync, identityHasRole } = require('../services/diaexpressAuthService');
const { syncUserFromIdentity } = require('../services/userIdentityService');

const integrationKeyRegistry = (() => {
  const entries = new Map();

  appConfig.services.integrations.apiKeys.forEach((entry) => {
    const [key, label] = entry.split(':').map((value) => value.trim()).filter(Boolean);
    if (key) {
      entries.set(key, label || 'partner');
    }
  });

  return entries;
})();

function extractIntegrationKey(req) {
  const headerValue = req.get('x-api-key') || req.get('x-partner-key');
  if (!headerValue) {
    return null;
  }

  const normalised = headerValue.trim();
  if (!normalised) {
    return null;
  }

  const label = integrationKeyRegistry.get(normalised);
  if (!label) {
    return null;
  }

  return { key: normalised, label };
}

function attachIntegrationIdentity(req) {
  if (req.identity?.type === 'integration') {
    return req.identity;
  }

  const integration = extractIntegrationKey(req);
  if (!integration) {
    return null;
  }

  const identity = {
    type: 'integration',
    apiKey: integration.key,
    principalId: integration.key,
    label: integration.label,
  };

  req.identity = identity;
  return identity;
}

async function resolveAndAttachIdentity(req) {
  const identity = await ensureRequestIdentityAsync(req);
  if (identity) {
    req.auth = identity;
    req.identity = identity;
  }
  return identity;
}

async function resolveAndAttachUser(req) {
  if (req.user) {
    return { identity: req.identity || req.auth || null, user: req.user };
  }

  const identity = await resolveAndAttachIdentity(req);
  if (!identity) {
    return { identity: null, user: null };
  }

  const user = await syncUserFromIdentity(identity);
  if (user) {
    req.user = user;
    req.dbUser = user;
    req.userId = user._id;
  }

  return { identity, user };
}

function userHasRole(user, role) {
  if (!role) return true;
  if (!user?.role) return false;

  const required = String(role).toLowerCase();
  const current = String(user.role).toLowerCase();

  if (required === 'admin') {
    return current === 'admin';
  }

  return current === required || current === 'admin';
}

exports.requireAuth = async (req, res, next) => {
  try {
    const { identity, user } = await resolveAndAttachUser(req);
    if (!identity || !user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

exports.requireRole = (role) => {
  return async (req, res, next) => {
    try {
      const { identity, user } = await resolveAndAttachUser(req);
      if (!identity || !user) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      if (!userHasRole(user, role)) {
        return res.status(403).json({ message: '⛔ Accès interdit (rôle requis)' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

exports.requireUserOrIntegrationKey = async (req, res, next) => {
  try {
    const identity = await resolveAndAttachIdentity(req);
    if (identity) {
      return next();
    }

    const integrationIdentity = attachIntegrationIdentity(req);
    if (integrationIdentity) {
      return next();
    }

    return res
      .status(401)
      .json({ message: 'Authentification requise (token ou clé API partenaire)' });
  } catch (error) {
    next(error);
  }
};

exports.isIntegrationRequest = (req) => req.identity?.type === 'integration';

exports.optionalAuth = async (req, _res, next) => {
  try {
    await resolveAndAttachIdentity(req);
    next();
  } catch (error) {
    next(error);
  }
};

exports.optionalUserOrIntegrationKey = async (req, _res, next) => {
  try {
    const identity = await resolveAndAttachIdentity(req);
    if (identity) {
      return next();
    }

    const integrationIdentity = attachIntegrationIdentity(req);
    if (integrationIdentity) {
      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
};

exports.optionalAuthOrIntegration = exports.optionalUserOrIntegrationKey;
