const fs = require('fs');
const crypto = require('crypto');
const { createClerkClient, verifyToken } = require('@clerk/backend');

const config = require('../config/diaexpressAuth');

const tokenRegistry = new Map();
const clientRegistry = new Map();
let initialised = false;

const clerkState = {
  client: null,
  initialised: false,
  verifyOptions: null,
  templateCandidates: [],
  secretKey: null,
};

function toStringList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueList(values = []) {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
}

function isTruthyFlag(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value === 1;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (!normalised) {
      return false;
    }
    return ['true', '1', 'yes', 'y', 'on'].includes(normalised);
  }

  return false;
}

function collectRoleValues(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return toStringList(value);
  }

  if (typeof value === 'number') {
    const coerced = String(value).trim();
    return coerced ? [coerced] : [];
  }

  return [];
}

function collectRolesFromObject(source = {}) {
  if (!source || typeof source !== 'object') {
    return [];
  }

  return Object.entries(source)
    .filter(([key]) => typeof key === 'string' && key.toLowerCase().includes('role'))
    .flatMap(([, value]) => collectRoleValues(value));
}

function collectClerkRoles(sessionClaims, user) {
  const candidates = [];

  candidates.push(
    ...collectRoleValues(user?.publicMetadata?.role),
    ...collectRoleValues(user?.publicMetadata?.roles),
    ...collectRoleValues(user?.privateMetadata?.role),
    ...collectRoleValues(user?.privateMetadata?.roles),
    ...collectRoleValues(sessionClaims?.role),
    ...collectRoleValues(sessionClaims?.roles),
    ...collectRoleValues(sessionClaims?.org_role),
    ...collectRoleValues(sessionClaims?.org_roles),
    ...collectRoleValues(sessionClaims?.public_metadata?.role),
    ...collectRoleValues(sessionClaims?.public_metadata?.roles),
    ...collectRoleValues(sessionClaims?.private_metadata?.role),
    ...collectRoleValues(sessionClaims?.private_metadata?.roles),
    ...collectRoleValues(sessionClaims?.metadata?.role),
    ...collectRoleValues(sessionClaims?.metadata?.roles),
  );

  candidates.push(...collectRolesFromObject(sessionClaims));

  const normalised = uniqueList(candidates);

  const hasAdminRole = normalised.some((role) => role.toLowerCase() === 'admin');
  if (!hasAdminRole) {
    const adminFlag =
      isTruthyFlag(user?.publicMetadata?.isAdmin) ||
      isTruthyFlag(user?.privateMetadata?.isAdmin) ||
      isTruthyFlag(sessionClaims?.isAdmin) ||
      isTruthyFlag(sessionClaims?.metadata?.isAdmin) ||
      isTruthyFlag(sessionClaims?.public_metadata?.isAdmin) ||
      isTruthyFlag(sessionClaims?.private_metadata?.isAdmin);

    if (adminFlag) {
      normalised.push('admin');
    }
  }

  return normalised;
}

function normaliseRoles(entry) {
  const roles = uniqueList([
    ...(Array.isArray(entry.roles) ? entry.roles : []),
    ...(entry.role ? [entry.role] : []),
  ]);
  return roles;
}

function normaliseScopes(entry) {
  const scopes = uniqueList(
    Array.isArray(entry.scopes)
      ? entry.scopes
      : entry.scopes
      ? String(entry.scopes)
          .split('|')
          .map((scope) => scope.trim())
      : [],
  );
  return scopes;
}

function buildDescriptor(entry) {
  if (!entry || !entry.subject) {
    return null;
  }

  const roles = normaliseRoles(entry);
  const scopes = normaliseScopes(entry);
  const lowercaseRoles = new Set(roles.map((role) => role.toLowerCase()));
  const lowercaseScopes = new Set(scopes.map((scope) => scope.toLowerCase()));

  return {
    type: entry.type || 'service',
    subject: entry.subject,
    principalId: entry.subject,
    roles,
    role: roles[0] || null,
    lowercaseRoles,
    scopes,
    lowercaseScopes,
    label: entry.label || null,
    email: entry.email || null,
    metadata: entry.metadata || {},
    source: entry.source || 'config',
  };
}

function registerToken(token, entry, { expiresAt = Infinity, issuedAt = Date.now(), source } = {}) {
  const descriptor = buildDescriptor({ ...entry, source: source || entry.source });
  if (!token || !descriptor) {
    return;
  }

  tokenRegistry.set(token, {
    token,
    descriptor,
    expiresAt,
    issuedAt,
  });
}

function registerStaticTokens() {
  config.tokens.forEach((tokenConfig) => {
    registerToken(tokenConfig.token, tokenConfig, { source: 'config' });
  });
}

function registerClients() {
  config.clients.forEach((clientConfig) => {
    if (!clientConfig.clientId || !clientConfig.clientSecret) {
      return;
    }
    clientRegistry.set(clientConfig.clientId, {
      ...clientConfig,
      roles: normaliseRoles(clientConfig),
      scopes: normaliseScopes(clientConfig),
    });
  });
}

function loadSandboxTokens() {
  if (!config.sandbox?.enabled || !config.sandbox.fixture) {
    return;
  }

  try {
    const fileContent = fs.readFileSync(config.sandbox.fixture, 'utf8');
    const payload = JSON.parse(fileContent);
    (payload.tokens || []).forEach((tokenEntry) => {
      registerToken(tokenEntry.token, { ...tokenEntry, source: 'sandbox' });
    });
  } catch (error) {
    console.warn('Unable to load DiaExpress sandbox tokens:', error.message || error);
  }
}

function ensureInitialised() {
  if (initialised) {
    return;
  }

  registerStaticTokens();
  registerClients();
  loadSandboxTokens();
  initialised = true;
}

function getClerkClient() {
  if (clerkState.initialised) {
    return clerkState.client;
  }

  clerkState.initialised = true;

  const secretKey = (process.env.CLERK_SECRET_KEY || process.env.CLERK_API_KEY || '').trim();
  if (!secretKey) {
    return null;
  }

  try {
    clerkState.client = createClerkClient({ secretKey });
    clerkState.secretKey = secretKey;
  } catch (error) {
    console.warn('Unable to initialise Clerk backend client:', error.message || error);
    clerkState.client = null;
    clerkState.secretKey = null;
  }

  const authorizedParties = toStringList(
    process.env.CLERK_AUTHORIZED_PARTIES || process.env.CLERK_ALLOWED_ORIGINS,
  );
  const audiences = toStringList(
    process.env.CLERK_JWT_AUDIENCES || process.env.CLERK_JWT_AUDIENCE || process.env.CLERK_AUDIENCE,
  );
  const issuer = (process.env.CLERK_JWT_ISSUER || process.env.CLERK_ISSUER || '').trim();

  const verifyOptions = {};
  if (authorizedParties.length) {
    verifyOptions.authorizedParties = authorizedParties;
  }
  if (audiences.length === 1) {
    verifyOptions.audience = audiences[0];
  } else if (audiences.length > 1) {
    verifyOptions.audience = audiences;
  }
  if (issuer) {
    verifyOptions.issuer = issuer;
  }
  verifyOptions.clockSkewInMs = Number(process.env.CLERK_CLOCK_SKEW_MS) || 60_000;

  clerkState.verifyOptions = verifyOptions;

  const directTemplateCandidates = uniqueList(
    [
      process.env.CLERK_JWT_TEMPLATE,
      process.env.CLERK_JWT_TEMPLATE_NAME,
      process.env.CLERK_JWT_TEMPLATE_ID,
      process.env.CLERK_TEMPLATE,
      process.env.CLERK_TOKEN_TEMPLATE,
      process.env.CLERK_BACKEND_TEMPLATE,
      process.env.DIAEXPRESS_CLERK_JWT_TEMPLATE,
      process.env.DIAEXPRESS_CLERK_TEMPLATE,
    ]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean),
  );

  const listTemplateCandidates = uniqueList([
    ...toStringList(process.env.CLERK_JWT_TEMPLATE_CANDIDATES),
    ...toStringList(process.env.DIAEXPRESS_CLERK_JWT_TEMPLATE_CANDIDATES),
  ]);

  const fallbackTemplateCandidates = uniqueList([
    ...directTemplateCandidates,
    ...listTemplateCandidates,
    'diaexpress-backend',
    'backend',
  ]);

  clerkState.templateCandidates = fallbackTemplateCandidates;

  return clerkState.client;
}

async function resolveClerkToken(token) {
  if (!token) {
    return null;
  }

  const client = getClerkClient();
  if (!client) {
    return null;
  }

  const baseVerifyOptions = clerkState.verifyOptions || {};
  const templateCandidates = clerkState.templateCandidates?.length
    ? clerkState.templateCandidates
    : [];

  const attemptedTemplates = [null, ...templateCandidates];
  let lastError = null;

  const secretKey = clerkState.secretKey;
  if (!secretKey) {
    return null;
  }

  for (const template of attemptedTemplates) {
    try {
      const verifyOptions = template
        ? { ...baseVerifyOptions, template }
        : baseVerifyOptions;

      const sessionClaims = await verifyToken(token, {
        ...verifyOptions,
        secretKey,
      });
      const userId = sessionClaims?.sub || sessionClaims?.user_id || sessionClaims?.sid;
      if (!userId) {
        return null;
      }

      let user = null;
      try {
        user = await client.users.getUser(userId);
      } catch (error) {
        console.warn('Unable to fetch Clerk user profile:', error.message || error);
      }

      const email =
        user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
      const firstName = user?.firstName || null;
      const lastName = user?.lastName || null;
      const fullName =
        user?.fullName ||
        [firstName, lastName].filter(Boolean).join(' ') ||
        user?.username ||
        email ||
        userId;

      const candidateRoles = collectClerkRoles(sessionClaims, user);

      const roles = candidateRoles.length ? candidateRoles : ['client'];
      const rawPublicScopes = user?.publicMetadata?.scopes;
      const rawPrivateScopes = user?.privateMetadata?.scopes;
      const candidateScopes = uniqueList([
        ...(Array.isArray(rawPublicScopes) ? rawPublicScopes : toStringList(rawPublicScopes)),
        ...(Array.isArray(rawPrivateScopes) ? rawPrivateScopes : toStringList(rawPrivateScopes)),
      ]);
      const scopes = candidateScopes.length
        ? candidateScopes
        : roles.some((role) => String(role).toLowerCase() === 'admin')
        ? ['*']
        : [];
      const metadata = {};

      if (firstName) {
        metadata.firstName = firstName;
      }
      if (lastName) {
        metadata.lastName = lastName;
      }

      const phoneNumber = user?.phoneNumbers?.[0]?.phoneNumber;
      if (phoneNumber) {
        metadata.phone = phoneNumber;
      }

      const companyName =
        user?.publicMetadata?.companyName ||
        user?.publicMetadata?.company?.name ||
        user?.privateMetadata?.companyName ||
        null;
      const jobTitle =
        user?.publicMetadata?.jobTitle ||
        user?.publicMetadata?.company?.jobTitle ||
        user?.privateMetadata?.jobTitle ||
        null;
      if (companyName || jobTitle) {
        metadata.company = {
          ...(companyName ? { name: companyName } : {}),
          ...(jobTitle ? { jobTitle } : {}),
        };
      }

      const issuedAt = sessionClaims?.iat ? sessionClaims.iat * 1000 : Date.now();
      const expiresAt = sessionClaims?.exp ? sessionClaims.exp * 1000 : Infinity;

      registerToken(
        token,
        {
          token,
          subject: userId,
          roles,
          scopes,
          email,
          label: fullName,
          type: 'user',
          metadata,
        },
        { issuedAt, expiresAt, source: template ? `clerk:${template}` : 'clerk' },
      );

      return resolveBearerToken(token);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.warn('Unable to verify Clerk token:', lastError.message || lastError);
  }
  return null;
}

function isExpired(entry) {
  if (!entry) {
    return true;
  }

  if (entry.expiresAt === Infinity) {
    return false;
  }

  return Number.isFinite(entry.expiresAt) && entry.expiresAt <= Date.now();
}

function buildIdentity(entry) {
  if (!entry) {
    return null;
  }

  const expiresAt = entry.expiresAt === Infinity ? null : entry.expiresAt;
  const issuedAt = entry.issuedAt || Date.now();

  return {
    type: entry.descriptor.type,
    subject: entry.descriptor.subject,
    principalId: entry.descriptor.principalId,
    role: entry.descriptor.role,
    roles: entry.descriptor.roles,
    scopes: entry.descriptor.scopes,
    label: entry.descriptor.label,
    email: entry.descriptor.email,
    metadata: entry.descriptor.metadata,
    source: entry.descriptor.source,
    token: entry.token,
    issuedAt: new Date(issuedAt).toISOString(),
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
  };
}

function resolveBearerToken(token) {
  ensureInitialised();
  if (!token) {
    return null;
  }

  const entry = tokenRegistry.get(token);
  if (!entry || isExpired(entry)) {
    if (entry && isExpired(entry)) {
      tokenRegistry.delete(token);
    }
    return null;
  }

  return buildIdentity(entry);
}

function resolveRequestIdentity(req) {
  if (req.identity && req.identity.principalId) {
    return req.identity;
  }

  const header = req.get('authorization') || req.get('Authorization');
  if (!header) {
    return null;
  }

  const [scheme, value] = header.split(' ');
  if (!scheme || !value) {
    return null;
  }

  if (scheme.toLowerCase() === 'bearer') {
    const identity = resolveBearerToken(value.trim());
    if (identity) {
      req.identity = identity;
      return identity;
    }
  }

  return null;
}

function ensureRequestIdentity(req) {
  const identity = resolveRequestIdentity(req);
  if (identity) {
    req.identity = identity;
  }
  return identity;
}

async function ensureRequestIdentityAsync(req) {
  const current = ensureRequestIdentity(req);
  if (current) {
    return current;
  }

  const header = req.get('authorization') || req.get('Authorization');
  if (!header) {
    return null;
  }

  const [scheme, value] = header.split(' ');
  if (!scheme || !value) {
    return null;
  }

  if (scheme.toLowerCase() === 'bearer') {
    const identity = await resolveClerkToken(value.trim());
    if (identity) {
      req.identity = identity;
      return identity;
    }
  }

  return null;
}

function identityHasRole(identity, role) {
  if (!role) {
    return true;
  }
  if (!identity) {
    return false;
  }

  const requestedRole = role.toLowerCase();
  const roles = new Set(
    [identity.role, ...(identity.roles || [])]
      .map((value) => (value ? String(value).toLowerCase() : ''))
      .filter(Boolean),
  );

  return roles.has(requestedRole) || roles.has('admin');
}

function identityHasScope(identity, scope) {
  if (!scope) {
    return true;
  }

  if (!identity) {
    return false;
  }

  const loweredScope = scope.toLowerCase();
  const scopes = new Set(
    (identity.scopes || [])
      .map((value) => (value ? String(value).toLowerCase() : ''))
      .filter(Boolean),
  );

  return scopes.has(loweredScope) || scopes.has('*');
}

function parseBasicCredentials(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }

  const trimmed = headerValue.trim();
  if (!trimmed.toLowerCase().startsWith('basic ')) {
    return null;
  }

  const encoded = trimmed.slice(6).trim();
  if (!encoded) {
    return null;
  }

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return { clientId: decoded, clientSecret: '' };
    }
    return {
      clientId: decoded.slice(0, separatorIndex),
      clientSecret: decoded.slice(separatorIndex + 1),
    };
  } catch (error) {
    return null;
  }
}

function issueClientToken(clientId, clientSecret) {
  ensureInitialised();
  const client = clientRegistry.get(clientId);
  if (!client || client.clientSecret !== clientSecret) {
    const error = new Error('Invalid client credentials');
    error.code = 'INVALID_CLIENT';
    throw error;
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const ttl = Number.isFinite(client.expiresIn) && client.expiresIn > 0
    ? client.expiresIn * 1000
    : config.tokenTTLSeconds * 1000;
  const expiresAt = now + ttl;

  registerToken(token, {
    subject: client.subject,
    roles: client.roles,
    email: client.email,
    label: client.label,
    scopes: client.scopes,
    type: client.type || 'client',
    metadata: client.metadata,
  }, { expiresAt, issuedAt: now, source: 'issued' });

  const identity = resolveBearerToken(token);
  return {
    token,
    tokenType: 'Bearer',
    expiresIn: Math.round(ttl / 1000),
    identity,
  };
}

module.exports = {
  ensureRequestIdentity,
  ensureRequestIdentityAsync,
  resolveRequestIdentity,
  identityHasRole,
  identityHasScope,
  issueClientToken,
  parseBasicCredentials,
};
