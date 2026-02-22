const User = require('../models/User');

function normaliseEmail(value) {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  return trimmed || null;
}

function fallbackEmailFromIdentity(identity) {
  if (!identity?.principalId) return null;
  const slug = identity.principalId.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
  return normaliseEmail(`${slug || 'user'}@users.diaexpress.local`);
}

function deriveUsername(identity) {
  if (!identity) return null;

  const normalise = (value) => {
    if (!value) return '';

    const base = String(value)
      .normalize('NFKD')
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_.]+|[-_.]+$/g, '')
      .toLowerCase();

    return base.slice(0, 60);
  };

  const candidates = [
    identity.username,
    identity.metadata?.username,
    identity.label,
    identity.email ? identity.email.split('@')[0] : null,
    identity.principalId,
  ];

  for (const candidate of candidates) {
    const slug = normalise(candidate);
    if (slug) {
      return slug;
    }
  }

  return null;
}

function derivePrimaryRole(identity) {
  if (!identity) return 'client';

  const roles = [identity.role, ...(identity.roles || [])]
    .map((role) => (role ? String(role).trim() : ''))
    .filter(Boolean);

  if (!roles.length) {
    return 'client';
  }

  return roles[0];
}

const ADMIN_WHITELIST = (() => {
  const entries = (process.env.ADMIN_WHITELIST || '')
    .split(',')
    .map((entry) => normaliseEmail(entry))
    .filter(Boolean);

  const legacySeed = normaliseEmail(process.env.ADMIN_SEED_EMAIL);
  if (legacySeed) entries.push(legacySeed);

  const defaultAdmin = normaliseEmail(process.env.ADMIN_DEFAULT_EMAIL);
  if (defaultAdmin) entries.push(defaultAdmin);

  return new Set(entries);
})();

function isAdminWhitelisted(email) {
  const normalized = normaliseEmail(email);
  if (!normalized) return false;
  return ADMIN_WHITELIST.has(normalized);
}

function buildProfileFromIdentity(identity) {
  const profile = {
    lastSyncedAt: new Date(),
  };

  if (identity?.email) {
    profile.email = normaliseEmail(identity.email) || identity.email;
  }

  if (identity?.label) {
    profile.name = identity.label;
    profile.fullName = identity.label;
  }

  if (identity?.metadata) {
    const { firstName, lastName, phone, company } = identity.metadata;

    if (firstName !== undefined) {
      profile.firstName = firstName || null;
    }

    if (lastName !== undefined) {
      profile.lastName = lastName || null;
    }

    if (phone !== undefined) {
      profile.phone = phone || null;
    }

    if (company && typeof company === 'object') {
      if (company.name !== undefined) {
        profile['company.name'] = company.name || null;
      }
      if (company.jobTitle !== undefined) {
        profile['company.jobTitle'] = company.jobTitle || null;
      }
    }
  }

  return profile;
}

async function findExistingUser({ clerkUserId, email }) {
  const filters = [];
  if (clerkUserId) {
    filters.push({ clerkUserId }, { externalId: clerkUserId });
  }
  if (email) {
    filters.push({ email });
  }

  if (!filters.length) {
    return null;
  }

  if (filters.length === 1) {
    return User.findOne(filters[0]);
  }

  return User.findOne({ $or: filters });
}

async function upsertWithFallback(filters, updateDoc, options) {
  let lastError = null;
  for (const filter of filters) {
    try {
      const user = await User.findOneAndUpdate(filter, updateDoc, options);
      if (user) {
        return user;
      }
    } catch (error) {
      if (error?.code === 11000) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  const eligibleFallbacks = filters.filter((filter) => filter && Object.keys(filter).length);

  if (lastError && eligibleFallbacks.length) {
    const fallback = await User.findOne({ $or: eligibleFallbacks });
    if (fallback) {
      return fallback;
    }
    throw lastError;
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}

async function syncUserFromIdentity(identity) {
  if (!identity?.principalId && !identity?.clerkUserId && !identity?.email) {
    return null;
  }

  const clerkUserId =
    identity?.clerkUserId ||
    identity?.userId ||
    identity?.id ||
    (identity?.principalId ? String(identity.principalId).trim() : null);

  const primaryEmail = normaliseEmail(identity?.email);
  const email = primaryEmail || fallbackEmailFromIdentity(identity);
  const username = deriveUsername(identity);
  const profile = buildProfileFromIdentity(identity);
  const adminEmail = isAdminWhitelisted(email);

  const desiredRole = adminEmail ? 'admin' : derivePrimaryRole(identity);

  const existing = await findExistingUser({ clerkUserId, email });

  const baseUpdate = {
    ...profile,
    lastSyncedAt: new Date(),
  };

  if (username) {
    baseUpdate.username = username;
  }

  if (clerkUserId) {
    baseUpdate.clerkUserId = clerkUserId;
    baseUpdate.externalId = clerkUserId;
  }

  if (email) {
    baseUpdate.email = email;
  }

  const options = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  };

  if (existing) {
    const update = { ...baseUpdate };

    if (email && existing.email) {
      delete update.email;
    }

    if (clerkUserId && existing.clerkUserId) {
      delete update.clerkUserId;
      if (existing.externalId) {
        delete update.externalId;
      }
    }

    if (adminEmail && existing.role !== 'admin') {
      update.role = 'admin';
    } else if (!existing.role && desiredRole) {
      update.role = desiredRole;
    }

    const updated = await User.findByIdAndUpdate(existing._id, { $set: update }, {
      new: true,
      runValidators: true,
    });
    return updated;
  }

  const filters = [];
  if (clerkUserId) {
    filters.push({ clerkUserId });
    filters.push({ externalId: clerkUserId });
  }
  if (email) {
    filters.push({ email });
  }

  const setOnInsert = {
    role: desiredRole || 'client',
    ...baseUpdate,
  };

  const user = await upsertWithFallback(
    filters.length ? filters : [{}],
    { $set: baseUpdate, $setOnInsert: setOnInsert },
    options,
  );

  return user;
}

async function findUserByIdentity(identity) {
  if (!identity?.principalId) {
    return null;
  }

  return User.findOne({ $or: [{ clerkUserId: identity.principalId }, { externalId: identity.principalId }] });
}

module.exports = {
  syncUserFromIdentity,
  findUserByIdentity,
  derivePrimaryRole,
  fallbackEmailFromIdentity,
  deriveUsername,
  normaliseEmail,
};
