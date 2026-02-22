const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const { URLSearchParams } = require('node:url');

const config = require('../config/cmaCgm');

const httpClient = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
});

let cachedSandboxQuote = null;
let cachedSandboxBooking = null;
let cachedSandboxTracking = null;
let cachedToken = null;

function buildQuotePayload({ origin, destination, transportType, transportMode, weight, volume }) {
  const payload = {
    origin,
    destination,
    transportMode: (transportMode || transportType || '').toUpperCase() || undefined,
    weight: weight !== undefined ? Number(weight) : undefined,
    volume: volume !== undefined ? Number(volume) : undefined,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '' && !Number.isNaN(value))
  );
}

function normaliseQuoteResponse(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const total =
    data.totalPrice ??
    data.total ??
    data.price ??
    data.amount?.total ??
    data.quoteAmount?.total ??
    data.chargeAmount ??
    null;

  if (total === null || total === undefined) {
    return null;
  }

  const estimatedPrice = Number(total);
  if (Number.isNaN(estimatedPrice)) {
    return null;
  }

  const currency =
    data.currency ||
    data.currencyCode ||
    data.amount?.currency ||
    data.quoteAmount?.currency ||
    'USD';

  const appliedRule = data.tariffName || data.offerName || data.productName || 'CMA CGM';
  const transitTime = data.transitTime || data.estimatedTransitTime || data.duration;
  const offerId = data.offerId || data.id || data.reference;

  return {
    provider: 'cma-cgm',
    estimatedPrice,
    currency,
    appliedRule,
    meta: {
      ...(transitTime ? { transitTime } : {}),
      ...(offerId ? { offerId } : {}),
    },
  };
}

async function loadSandboxFixture(cacheRef, fixturePath, normaliser, label) {
  if (cacheRef.value) {
    return cacheRef.value;
  }

  try {
    const fileContent = await fs.readFile(fixturePath, 'utf8');
    const json = JSON.parse(fileContent);
    const normalised = normaliser(json);
    if (!normalised) {
      throw new Error(`Sandbox fixture ${label} does not contain a valid payload`);
    }

    cacheRef.value = {
      ...normalised,
      meta: {
        ...normalised.meta,
        mode: 'sandbox',
        fixture: path.basename(fixturePath),
      },
    };

    return cacheRef.value;
  } catch (error) {
    console.error(`Unable to load CMA CGM sandbox ${label} fixture:`, error.message || error);
    return null;
  }
}

async function loadSandboxQuote() {
  if (!config.sandbox?.fixtures?.quote) {
    return null;
  }

  if (!cachedSandboxQuote) {
    cachedSandboxQuote = { value: null };
  }

  if (cachedSandboxQuote.value) {
    return cachedSandboxQuote.value;
  }

  return loadSandboxFixture(cachedSandboxQuote, config.sandbox.fixtures.quote, normaliseQuoteResponse, 'quote');
}

async function loadSandboxBooking() {
  if (!config.sandbox?.fixtures?.booking) {
    return null;
  }

  if (!cachedSandboxBooking) {
    cachedSandboxBooking = { value: null };
  }

  if (cachedSandboxBooking.value) {
    return cachedSandboxBooking.value;
  }

  return loadSandboxFixture(
    cachedSandboxBooking,
    config.sandbox.fixtures.booking,
    normaliseBookingResponse,
    'booking',
  );
}

async function loadSandboxTracking() {
  if (!config.sandbox?.fixtures?.tracking) {
    return null;
  }

  if (!cachedSandboxTracking) {
    cachedSandboxTracking = { value: null };
  }

  if (cachedSandboxTracking.value) {
    return cachedSandboxTracking.value;
  }

  return loadSandboxFixture(
    cachedSandboxTracking,
    config.sandbox.fixtures.tracking,
    normaliseTrackingResponse,
    'tracking',
  );
}

async function fetchAccessToken() {
  if (!config.oauth.tokenURL || !config.oauth.clientId || !config.oauth.clientSecret) {
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.oauth.clientId,
    client_secret: config.oauth.clientSecret,
  });

  if (config.oauth.scope) {
    params.append('scope', config.oauth.scope);
  }

  const response = await axios.post(config.oauth.tokenURL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: config.api.timeout,
  });

  const accessToken = response.data?.access_token || response.data?.token;
  if (!accessToken) {
    throw new Error('CMA CGM token response missing access_token');
  }

  const expiresIn = Number(response.data?.expires_in || response.data?.expiresIn || 3600);
  cachedToken = {
    value: accessToken,
    expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000,
  };

  return accessToken;
}

async function getCmaCgmQuote(params = {}) {
  try {
    const payload = buildQuotePayload(params);
    if (!payload.origin || !payload.destination) {
      console.warn('CMA CGM quote skipped: origin and destination are required');
      return null;
    }

    if (config.sandbox.enabled) {
      return loadSandboxQuote();
    }

    const headers = { 'Content-Type': 'application/json' };

    const token = await fetchAccessToken().catch((err) => {
      console.error('CMA CGM token retrieval failed:', err.message || err);
      return null;
    });

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (config.api.apiKey) {
      headers['Ocp-Apim-Subscription-Key'] = config.api.apiKey;
    }

    if (config.api.accountNumber) {
      headers['x-account-number'] = config.api.accountNumber;
    }

    const { data } = await httpClient.post(config.api.quotePath, payload, { headers });
    return normaliseQuoteResponse(data);
  } catch (error) {
    const detail = error.response?.data || error.message || error;
    console.error('CMA CGM API error:', detail);
    return null;
  }
}

function normaliseBookingResponse(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const bookingReference = data.bookingReference || data.bookingId || data.reference || data.id;
  const status = (data.status || data.bookingStatus || 'booked').toLowerCase();
  const trackingCode = data.trackingNumber || data.trackingCode || data.shipmentTrackingNumber;
  const carrierName = data.carrierName || data.carrier || 'CMA CGM';
  const estimatedDelivery = data.estimatedDelivery || data.eta || data.estimatedArrival;

  const events = Array.isArray(data.events)
    ? data.events
        .map((event) => ({
          code: event.code || event.statusCode || null,
          description: event.description || event.status || event.message || null,
          location: event.location || event.port || event.place || null,
          timestamp: event.timestamp || event.date || null,
        }))
        .filter((event) => event.description)
    : [];

  return {
    provider: 'cma-cgm',
    bookingReference: bookingReference || null,
    status,
    trackingCode: trackingCode || null,
    carrier: carrierName,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    events,
    meta: {
      raw: data,
    },
  };
}

function normaliseTrackingResponse(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const trackingNumber = data.trackingNumber || data.reference || data.id;
  const status = (data.status || data.latestStatus || 'in_transit').toLowerCase();
  const estimatedDelivery = data.estimatedDelivery || data.eta || data.estimatedArrival;

  const eventsSource = Array.isArray(data.events)
    ? data.events
    : Array.isArray(data.history)
      ? data.history
      : [];

  const events = eventsSource
    .map((event) => ({
      code: event.code || event.eventType || event.statusCode || null,
      description: event.description || event.eventDescription || event.status || null,
      location: event.location || event.city || event.port || null,
      timestamp: event.timestamp || event.date || null,
    }))
    .filter((event) => event.description);

  return {
    provider: 'cma-cgm',
    trackingNumber: trackingNumber || null,
    status,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    events,
    meta: {
      raw: data,
    },
  };
}

async function createCmaCgmBooking(params = {}) {
  if (config.sandbox.enabled) {
    return loadSandboxBooking();
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = await fetchAccessToken().catch((error) => {
      console.error('CMA CGM token retrieval failed during booking:', error.message || error);
      return null;
    });

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (config.api.apiKey) {
      headers['Ocp-Apim-Subscription-Key'] = config.api.apiKey;
    }

    if (config.api.accountNumber) {
      headers['x-account-number'] = config.api.accountNumber;
    }

    const { data } = await httpClient.post(config.api.bookingPath, params, { headers });
    return normaliseBookingResponse(data);
  } catch (error) {
    const detail = error.response?.data || error.message || error;
    console.error('CMA CGM booking error:', detail);
    return null;
  }
}

async function getCmaCgmTracking(params = {}) {
  if (config.sandbox.enabled) {
    return loadSandboxTracking();
  }

  try {
    const headers = { 'Content-Type': 'application/json' };

    const token = await fetchAccessToken().catch((error) => {
      console.error('CMA CGM token retrieval failed during tracking:', error.message || error);
      return null;
    });

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (config.api.apiKey) {
      headers['Ocp-Apim-Subscription-Key'] = config.api.apiKey;
    }

    const { trackingNumber } = params;
    const pathWithQuery = `${config.api.trackingPath}?trackingNumber=${encodeURIComponent(trackingNumber)}`;
    const { data } = await httpClient.get(pathWithQuery, { headers });
    return normaliseTrackingResponse(data);
  } catch (error) {
    const detail = error.response?.data || error.message || error;
    console.error('CMA CGM tracking error:', detail);
    return null;
  }
}

module.exports = { getCmaCgmQuote, createCmaCgmBooking, getCmaCgmTracking };
