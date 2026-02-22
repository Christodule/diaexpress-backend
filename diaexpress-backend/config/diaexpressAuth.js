const path = require('path');

function toList(value = '') {
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normaliseArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
  }

  return String(value)
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseTokenEntry(entry) {
  if (!entry) {
    return null;
  }

  let payload = entry;

  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        payload = JSON.parse(trimmed);
      } catch (error) {
        console.warn('Unable to parse DIAEXPRESS auth JSON entry:', error.message || error);
        return null;
      }
    } else {
      const parts = trimmed.split(':').map((part) => part.trim());
      const [token, subject, role = 'service', email = '', scopes = '', label = '', type = 'service'] = parts;
      if (!token || !subject) {
        return null;
      }

      payload = {
        token,
        subject,
        role,
        email: email || null,
        scopes,
        label: label || null,
        type,
      };
    }
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const scopes = normaliseArray(payload.scopes || payload.scope);
  const roles = normaliseArray(payload.roles || payload.role);

  return {
    token: payload.token || payload.id,
    subject: payload.subject,
    roles,
    email: payload.email || null,
    label: payload.label || null,
    scopes,
    type: payload.type || 'service',
    metadata: payload.metadata || {},
  };
}

function parseClientEntry(entry) {
  if (!entry) {
    return null;
  }

  let payload = entry;

  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        payload = JSON.parse(trimmed);
      } catch (error) {
        console.warn('Unable to parse DIAEXPRESS auth JSON entry:', error.message || error);
        return null;
      }
    } else {
      const parts = trimmed.split(':').map((part) => part.trim());
      const [
        clientId,
        clientSecret,
        subject = clientId,
        role = 'client',
        email = '',
        scopes = '',
        label = '',
        type = 'client',
        expiresIn = '',
      ] = parts;

      if (!clientId || !clientSecret) {
        return null;
      }

      payload = {
        clientId,
        clientSecret,
        subject,
        role,
        email: email || null,
        scopes,
        label: label || null,
        type,
        expiresIn,
      };
    }
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const clientId = payload.clientId || payload.id;
  const clientSecret = payload.clientSecret || payload.secret;
  if (!clientId || !clientSecret) {
    return null;
  }

  const scopes = normaliseArray(payload.scopes || payload.scope);
  const roles = normaliseArray(payload.roles || payload.role);
  const expiresIn = payload.expiresIn ? Number(payload.expiresIn) : null;

  return {
    clientId,
    clientSecret,
    subject: payload.subject || clientId,
    roles,
    scopes,
    email: payload.email || null,
    label: payload.label || null,
    type: payload.type || 'client',
    metadata: payload.metadata || {},
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : null,
  };
}

const mode = (process.env.DIAEXPRESS_AUTH_MODE || '').toLowerCase();
const tokens = toList(process.env.DIAEXPRESS_AUTH_TOKENS).map(parseTokenEntry).filter(Boolean);
const clients = toList(process.env.DIAEXPRESS_AUTH_CLIENTS).map(parseClientEntry).filter(Boolean);

const sandboxFixture =
  process.env.DIAEXPRESS_AUTH_SANDBOX_FIXTURE ||
  path.join(__dirname, '..', 'fixtures', 'diaexpress', 'auth.tokens.json');

const sandboxEnabled =
  mode === 'sandbox' ||
  process.env.DIAEXPRESS_AUTH_SANDBOX === 'true' ||
  (!tokens.length && !clients.length);

module.exports = {
  mode: mode || (sandboxEnabled ? 'sandbox' : 'live'),
  tokenTTLSeconds: Number(process.env.DIAEXPRESS_AUTH_TOKEN_TTL) || 3600,
  tokens,
  clients,
  sandbox: {
    enabled: sandboxEnabled,
    fixture: sandboxFixture,
  },
};
