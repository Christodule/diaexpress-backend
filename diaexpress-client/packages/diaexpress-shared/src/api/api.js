const toTrimmedString = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return typeof value === 'string' ? value.trim() : String(value).trim();
};

const stripTrailingSlash = (value = '') => toTrimmedString(value).replace(/\/+$/, '');
const ensureLeadingSlash = (value = '') => {
  const normalised = toTrimmedString(value);
  return normalised.startsWith('/') ? normalised : `/${normalised}`;
};
const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(toTrimmedString(value));

const normaliseBaseUrl = (rawValue = '') => {
  const trimmed = toTrimmedString(rawValue);

  if (!trimmed) {
    return '';
  }

  if (isAbsoluteUrl(trimmed)) {
    return stripTrailingSlash(trimmed);
  }

  const sanitised = trimmed.replace(/^\/+/, '');

  if (!sanitised) {
    return '';
  }

  const isLocalHost = /^(localhost|127\.|0\.0\.0\.0)/i.test(sanitised);
  const protocol = isLocalHost ? 'http' : 'https';

  return stripTrailingSlash(`${protocol}://${sanitised}`);
};

const deriveServerHostCandidate = () => {
  const urlCandidate = pickFirstEnv(
    'DIAEXPRESS_PUBLIC_URL',
    'NEXT_PUBLIC_APP_URL',
    'APP_URL',
    'NEXT_PUBLIC_SITE_URL',
    'SITE_URL',
    'NEXTAUTH_URL',
    'VERCEL_URL'
  );

  if (urlCandidate) {
    return urlCandidate;
  }

  const host = pickFirstEnv('DIAEXPRESS_PUBLIC_HOST', 'API_HOST');
  if (!host) {
    return '';
  }

  const port = pickFirstEnv('DIAEXPRESS_PUBLIC_PORT', 'API_PORT', 'PORT');
  const trimmedHost = host.replace(/^\/+/, '').replace(/\/+$/, '');

  if (port) {
    return `${trimmedHost}:${port}`;
  }

  return trimmedHost;
};

const localFallbackBase = () => {
  const port = pickFirstEnv('DIAEXPRESS_API_PORT', 'API_PORT', 'PORT');

  if (port) {
    return normaliseBaseUrl(`localhost:${port}`);
  }

  return normaliseBaseUrl('localhost:5000');
};

const pickFirstEnv = (...keys) => {
  for (const key of keys) {
    const rawValue = typeof process !== 'undefined' ? process.env?.[key] : undefined;
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return '';
};

const publicBase = normaliseBaseUrl(
  pickFirstEnv(
    'NEXT_PUBLIC_DIAEXPRESS_API_BASE_URL',
    'NEXT_PUBLIC_DIAEXPRESS_ADMIN_API_BASE_URL',
    'NEXT_PUBLIC_ADMIN_API_BASE_URL',
    'NEXT_PUBLIC_LOGISTICS_API_BASE_URL',
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_BACKEND_URL'
  )
);

const serverBase = normaliseBaseUrl(
  pickFirstEnv(
    'DIAEXPRESS_API_BASE_URL',
    'DIAEXPRESS_ADMIN_API_BASE_URL',
    'ADMIN_API_BASE_URL',
    'LOGISTICS_API_BASE_URL',
    'API_BASE_URL',
    'DIAEXPRESS_BACKEND_URL'
  )
);

const derivedServerBase = normaliseBaseUrl(deriveServerHostCandidate());

// Always provide a deterministic fallback to the local backend instead of relying on the
// browser origin (which points to the Next.js dev server and returns HTML 404 pages).
// This avoids runtime fetch errors such as "Unable to parse API response as JSON" when
// API_BASE is empty and requests hit the frontend host.
const fallbackBase = serverBase || derivedServerBase || localFallbackBase();

const runtimeOrigin = (() => {
  if (typeof window === 'undefined') {
    return '';
  }

  const origin = window.location?.origin;
  return normaliseBaseUrl(origin);
})();

export const API_BASE =
  typeof window === 'undefined'
    ? fallbackBase
    : publicBase || fallbackBase || runtimeOrigin;

export const buildApiUrl = (path = '') => {
  const trimmedPath = toTrimmedString(path);

  if (!trimmedPath) {
    return API_BASE;
  }

  if (isAbsoluteUrl(trimmedPath)) {
    return trimmedPath;
  }

  const normalisedPath = ensureLeadingSlash(trimmedPath);

  if (!API_BASE) {
    return normalisedPath;
  }

  return `${stripTrailingSlash(API_BASE)}${normalisedPath}`;
};

export const getShipmentsByUser = async (userId) => {
  const res = await fetch(buildApiUrl(`/api/shipments/user/${userId}`));
  if (!res.ok) throw new Error('Erreur chargement');
  return res.json();
};

export const getAllShipments = async () => {
  const res = await fetch(buildApiUrl('/api/shipments'));
  if (!res.ok) throw new Error('Erreur chargement');
  return res.json();
};

export const createShipment = async (data) => {
  const res = await fetch(buildApiUrl('/api/shipments/quote'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateShipmentStatus = async (id, status) => {
  const res = await fetch(buildApiUrl(`/api/shipments/${id}/status`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
