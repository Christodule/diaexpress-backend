const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const { URLSearchParams } = require('node:url');

const config = require('../config/fedex');

const httpClient = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
});

let cachedToken = null;
const sandboxCache = {
  booking: null,
  tracking: null,
};

function normaliseTrackingStatus(status) {
  if (!status) {
    return 'in_transit';
  }

  const value = String(status).trim().toLowerCase();
  if (!value) {
    return 'in_transit';
  }

  const simplified = value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-\s]+/g, '_');

  if (['in_transit', 'en_transit', 'transit'].includes(simplified)) {
    return 'in_transit';
  }

  if (['delivered', 'livre', 'completed'].includes(simplified)) {
    return 'delivered';
  }

  if (['cancelled', 'canceled', 'exception'].includes(simplified)) {
    return 'cancelled';
  }

  if (['pickup', 'picked_up', 'pickedup'].includes(simplified)) {
    return 'booked';
  }

  return simplified || 'in_transit';
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

  const { data } = await axios.post(config.oauth.tokenURL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: config.api.timeout,
  });

  const accessToken = data?.access_token || data?.token;
  if (!accessToken) {
    throw new Error('FedEx token response missing access_token');
  }

  const expiresIn = Number(data?.expires_in || data?.expiresIn || 3600);
  cachedToken = {
    value: accessToken,
    expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000,
  };

  return accessToken;
}

function normaliseBookingResponse(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const output = data.output || {};
  const shipmentId = output.shipmentId || output.masterTrackingNumber;
  const trackingCode = output.masterTrackingNumber || output.trackingNumber;
  const status = (output.status || data.status || 'booked').toLowerCase();
  const estimatedDelivery = output.estimatedDelivery || output.estimatedDeliveryTime;
  const serviceType = output.serviceType || output.serviceName || null;

  const events = Array.isArray(output.events)
    ? output.events.map((event) => ({
        code: event.eventType || null,
        description: event.eventDescription || event.description || null,
        location: event.location
          ? `${event.location.city || ''}${event.location.countryCode ? `, ${event.location.countryCode}` : ''}`.trim()
          : null,
        timestamp: event.timestamp || null,
      }))
    : [];

  return {
    provider: 'fedex',
    bookingReference: shipmentId || null,
    trackingCode: trackingCode || null,
    status,
    carrier: 'FedEx',
    serviceType,
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

  const result = data.output?.completeTrackResults?.[0]?.trackResults?.[0];
  if (!result) {
    return null;
  }

  const trackingNumber = data.output?.completeTrackResults?.[0]?.trackingNumber;
  const rawStatus = result.latestStatus?.statusByLocale || result.latestStatus?.status || 'in_transit';
  const status = normaliseTrackingStatus(rawStatus);
  const estimatedDelivery = result.estimatedDeliveryTime || result.estimatedDelivery;

  const events = Array.isArray(result.scanEvents)
    ? result.scanEvents.map((event) => ({
        code: event.eventType || null,
        description: event.eventDescription || event.statusDescription || null,
        location: event.scanLocation
          ? `${event.scanLocation.city || ''}${event.scanLocation.countryCode ? `, ${event.scanLocation.countryCode}` : ''}`.trim()
          : null,
        timestamp: event.date && event.time ? `${event.date}T${event.time}Z` : event.timestamp || null,
      }))
    : [];

  return {
    provider: 'fedex',
    trackingNumber: trackingNumber || null,
    status,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    events,
    meta: {
      raw: data,
    },
  };
}

async function loadSandboxFixture(type, normaliser) {
  if (sandboxCache[type]) {
    return sandboxCache[type];
  }

  const fixturePath = config.sandbox?.fixtures?.[type];
  if (!fixturePath) {
    return null;
  }

  try {
    const fileContent = await fs.readFile(fixturePath, 'utf8');
    const json = JSON.parse(fileContent);
    const normalised = normaliser(json);
    if (!normalised) {
      throw new Error(`FedEx sandbox ${type} fixture invalid`);
    }

    sandboxCache[type] = {
      ...normalised,
      meta: {
        ...normalised.meta,
        mode: 'sandbox',
        fixture: path.basename(fixturePath),
      },
    };

    return sandboxCache[type];
  } catch (error) {
    console.error(`Unable to load FedEx sandbox ${type} fixture:`, error.message || error);
    return null;
  }
}

async function createFedexBooking(payload = {}) {
  if (config.sandbox.enabled) {
    return loadSandboxFixture('booking', normaliseBookingResponse);
  }

  try {
    const headers = { 'Content-Type': 'application/json' };

    const token = await fetchAccessToken().catch((error) => {
      console.error('FedEx token retrieval failed during booking:', error.message || error);
      return null;
    });

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (config.apiKey) {
      headers['x-api-key'] = config.apiKey;
    }

    const { data } = await httpClient.post(config.api.bookingPath, payload, { headers });
    return normaliseBookingResponse(data);
  } catch (error) {
    const detail = error.response?.data || error.message || error;
    console.error('FedEx booking error:', detail);
    return null;
  }
}

async function getFedexTracking(params = {}) {
  if (config.sandbox.enabled) {
    return loadSandboxFixture('tracking', normaliseTrackingResponse);
  }

  try {
    const headers = { 'Content-Type': 'application/json' };

    const token = await fetchAccessToken().catch((error) => {
      console.error('FedEx token retrieval failed during tracking:', error.message || error);
      return null;
    });

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (config.apiKey) {
      headers['x-api-key'] = config.apiKey;
    }

    const payload = {
      includeDetailedScans: true,
      trackingInfo: [
        {
          trackingNumberInfo: {
            trackingNumber: params.trackingNumber,
          },
        },
      ],
    };

    const { data } = await httpClient.post(config.api.trackingPath, payload, { headers });
    return normaliseTrackingResponse(data);
  } catch (error) {
    const detail = error.response?.data || error.message || error;
    console.error('FedEx tracking error:', detail);
    return null;
  }
}

module.exports = {
  createFedexBooking,
  getFedexTracking,
};
