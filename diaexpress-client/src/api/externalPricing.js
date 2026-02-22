import { buildApiUrl } from './api';

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const readErrorMessage = async (response) => {
  try {
    const data = await response.clone().json();
    if (typeof data === 'string') {
      return data;
    }
    if (data?.message) {
      return data.message;
    }
    if (data?.error) {
      return data.error;
    }
  } catch (err) {
    // ignore json parse errors
  }
  try {
    return await response.text();
  } catch (err) {
    return 'Une erreur inconnue est survenue';
  }
};

export const listExternalPricing = async ({
  originPort,
  destinationPort,
  validFrom,
  validTo,
  limit,
  offset,
  token,
} = {}) => {
  const queryString = buildQueryString({ originPort, destinationPort, validFrom, validTo, limit, offset });
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(buildApiUrl(`/api/external-pricing${queryString}`), { headers });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const payload = await response.json();
  if (Array.isArray(payload)) {
    return { data: payload, meta: null };
  }
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta ?? null,
  };
};

export const syncExternalPricing = async ({
  token,
  originPort,
  destinationPort,
  validFrom,
  validTo,
} = {}) => {
  if (!token) {
    throw new Error('Authentification requise pour synchroniser les tarifs.');
  }
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const queryString = buildQueryString({ originPort, destinationPort, validFrom, validTo });
  const response = await fetch(buildApiUrl(`/api/external-pricing/sync${queryString}`), {
    headers,
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
};

export const fetchCmaCgmCredentialsMeta = async (token) => {
  if (!token) {
    throw new Error('Authentification requise pour consulter les credentials.');
  }
  const response = await fetch(buildApiUrl('/api/external-pricing/credentials'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
};

export const updateCmaCgmCredentials = async ({ apiKey, accountNumber }, token) => {
  if (!token) {
    throw new Error("Authentification requise pour mettre à jour les credentials.");
  }
  const response = await fetch(buildApiUrl('/api/external-pricing/credentials'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, accountNumber }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
};
