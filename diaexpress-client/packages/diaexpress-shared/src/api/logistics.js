import { API_BASE } from './api';

const RETRIABLE_STATUS = new Set([404, 405, 501]);

const coerceArray = (payload, keys = []) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const requestWithFallback = async (paths, options) => {
  let lastError = null;

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];

    try {
      return await apiRequest(path, options);
    } catch (error) {
      const isLastPath = index === paths.length - 1;

      if (!isLastPath && RETRIABLE_STATUS.has(error?.status)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
};

const buildUrl = (path) => {
  if (!path) {
    throw new Error('Path is required for API requests');
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalisedPath}`;
};

const parseJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Unable to parse API response as JSON', error);
    return null;
  }
};

export const apiRequest = async (path, { method = 'GET', token, body, headers } = {}) => {
  const requestHeaders = new Headers(headers || {});

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (body !== undefined && body !== null && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message = payload?.message || payload?.error || `API request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const fetchAdminQuotes = async (token) => {
  const data = await requestWithFallback(
    ['/api/admin/quotes', '/api/quotes', '/api/quotes/all'],
    { token },
  );

  return coerceArray(data, ['quotes']);
};

export const updateQuoteStatus = (quoteId, status, token) =>
  apiRequest(`/api/quotes/${quoteId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });

export const estimateQuote = (payload) => apiRequest('/api/quotes/estimateQuote', { method: 'POST', body: payload });

export const createQuote = (payload, token) =>
  apiRequest('/api/quotes', {
    method: 'POST',
    token,
    body: payload,
  });

export const createShipmentFromQuote = (quoteId, token) =>
  apiRequest('/api/shipments/create-from-quote', {
    method: 'POST',
    token,
    body: { quoteId },
  });

export const fetchAdminPricing = async (token) => {
  const data = await requestWithFallback(['/api/admin/pricing', '/api/pricing'], { token });
  return coerceArray(data, ['pricings', 'data']);
};

export const savePricing = (payload, token) =>
  requestWithFallback(['/api/admin/pricing', '/api/pricing'], {
    method: 'POST',
    token,
    body: payload,
  });

export const updatePricing = (pricingId, payload, token) =>
  requestWithFallback(
    [`/api/admin/pricing/${pricingId}`, `/api/pricing/${pricingId}`],
    {
      method: 'PUT',
      token,
      body: payload,
    },
  );

export const deletePricing = (pricingId, token) =>
  requestWithFallback(
    [`/api/admin/pricing/${pricingId}`, `/api/pricing/${pricingId}`],
    {
      method: 'DELETE',
      token,
    },
  );

export const fetchAdminShipments = async (token) => {
  const data = await requestWithFallback(['/api/admin/shipments', '/api/shipments'], { token });
  return coerceArray(data, ['shipments', 'data']);
};

export const updateShipmentStatus = (shipmentId, status, token, extra = {}) =>
  requestWithFallback(
    [`/api/admin/shipments/${shipmentId}/status`, `/api/shipments/${shipmentId}/status`],
    {
      method: 'PATCH',
      token,
      body: { status, ...extra },
    },
  );

export const deleteShipment = (shipmentId, token) =>
  requestWithFallback(
    [`/api/admin/shipments/${shipmentId}`, `/api/shipments/${shipmentId}`],
    {
      method: 'DELETE',
      token,
    },
  );

export const fetchCurrentUser = async (token) => {
  const data = await requestWithFallback(['/api/admin/users/me', '/api/users/me'], { token });
  if (data?.user) {
    return data.user;
  }
  return data;
};

export const fetchQuoteMeta = () => apiRequest('/api/quotes/meta');

export const fetchQuoteById = async (quoteId, token) => {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  const data = await apiRequest(`/api/quotes/${quoteId}`, { token });
  return data?.quote || data || null;
};

export const deleteQuote = (quoteId, token) => {
  if (!quoteId) {
    throw new Error('quoteId is required');
  }

  return apiRequest(`/api/quotes/${quoteId}`, {
    method: 'DELETE',
    token,
  });
};

export const fetchClientQuotes = async (token) => {
  const data = await apiRequest('/api/quotes/me', { token });
  if (Array.isArray(data?.quotes)) {
    return data.quotes;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};

export const fetchClientShipments = async (token) => {
  const data = await apiRequest('/api/shipments/me', { token });
  if (Array.isArray(data?.shipments)) {
    return data.shipments;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};

export const fetchShipmentById = async (shipmentId, token) => {
  if (!shipmentId) {
    throw new Error('shipmentId is required');
  }

  const data = await apiRequest(`/api/shipments/${shipmentId}`, { token });
  return data?.shipment || data || null;
};

export const fetchPublicPricingRoutes = () => apiRequest('/api/pricing/routes');

export default {
  apiRequest,
  fetchAdminQuotes,
  updateQuoteStatus,
  estimateQuote,
  createQuote,
  createShipmentFromQuote,
  fetchAdminPricing,
  savePricing,
  updatePricing,
  deletePricing,
  fetchAdminShipments,
  updateShipmentStatus,
  deleteShipment,
  fetchCurrentUser,
  fetchClientQuotes,
  fetchClientShipments,
  fetchQuoteMeta,
  fetchQuoteById,
  deleteQuote,
  fetchShipmentById,
  fetchPublicPricingRoutes,
};
