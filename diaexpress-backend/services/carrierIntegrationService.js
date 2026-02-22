const { createCmaCgmBooking, getCmaCgmTracking } = require('./cmaCgmService');
const { createFedexBooking, getFedexTracking } = require('./fedexService');

function normaliseProvider(provider = '') {
  const value = String(provider).trim().toLowerCase();
  if (['cma', 'cma-cgm', 'cmacgm'].includes(value)) {
    return 'cma-cgm';
  }
  if (['fedex', 'fdx', 'fx'].includes(value)) {
    return 'fedex';
  }
  return 'internal';
}

function buildCmaCgmBookingPayload(quote, options = {}, identity = {}) {
  return {
    quoteReference: quote._id?.toString(),
    transportMode: (quote.transportType || 'sea').toUpperCase(),
    origin: {
      location: quote.origin || options.origin,
    },
    destination: {
      location: quote.destination || options.destination,
    },
    cargo: {
      weight: quote.weight,
      volume: quote.volume,
    },
    container: {
      type: options.containerType || quote.packageTypeId || null,
    },
    metadata: {
      requestedBy: identity.type,
      requestedThrough: identity.type === 'integration' ? identity.label : 'diaexpress-app',
    },
  };
}

function buildFedexBookingPayload(quote, options = {}, identity = {}) {
  const packages = Array.isArray(options.packages) && options.packages.length > 0
    ? options.packages
    : [
        {
          weight: {
            units: 'KG',
            value: quote.weight || options.weight || 1,
          },
          dimensions: {
            length: quote.length || options.length || 10,
            width: quote.width || options.width || 10,
            height: quote.height || options.height || 10,
            units: 'CM',
          },
        },
      ];

  return {
    labelResponseOptions: 'URL_ONLY',
    shipper: {
      address: {
        city: options.originCity || quote.origin || 'Origin',
        countryCode: options.originCountry || 'FR',
      },
    },
    recipient: {
      address: {
        city: options.destinationCity || quote.destination || 'Destination',
        countryCode: options.destinationCountry || 'US',
      },
    },
    requestedShipment: {
      serviceType: options.serviceType || 'INTERNATIONAL_PRIORITY',
      packagingType: options.packagingType || 'YOUR_PACKAGING',
      shipDatestamp: options.shipDate || new Date().toISOString().slice(0, 10),
      totalWeight: {
        units: 'KG',
        value: quote.weight || options.weight || 1,
      },
      packageCount: packages.length,
      requestedPackageLineItems: packages,
    },
    accountNumber: options.accountNumber || null,
    metadata: {
      requestedBy: identity.type,
      requestedThrough: identity.type === 'integration' ? identity.label : 'diaexpress-app',
    },
  };
}

function buildInternalBooking(quote) {
  const trackingCode = `INT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    provider: 'internal',
    bookingReference: `INT-${quote._id}`,
    trackingCode,
    status: 'booked',
    carrier: 'DiaExpress',
    estimatedDelivery: null,
    events: [
      {
        code: 'BOOKED',
        description: 'Réservation interne confirmée',
        location: quote.origin || 'Entrepôt DiaExpress',
        timestamp: new Date().toISOString(),
      },
    ],
    meta: {
      raw: {
        quoteId: quote._id,
      },
    },
  };
}

async function createCarrierBooking({ provider, quote, options = {}, identity = {} }) {
  const target = normaliseProvider(provider || quote?.provider);
  if (!quote) {
    throw new Error('Quote is required to create a booking');
  }

  if (target === 'cma-cgm') {
    const payload = buildCmaCgmBookingPayload(quote, options, identity);
    return createCmaCgmBooking(payload);
  }

  if (target === 'fedex') {
    const payload = buildFedexBookingPayload(quote, options, identity);
    return createFedexBooking(payload);
  }

  return buildInternalBooking(quote);
}

async function getCarrierTracking({ provider, trackingNumber, shipment, identity = {} }) {
  const target = normaliseProvider(provider || shipment?.provider);
  const tracking = trackingNumber || shipment?.trackingCode;

  if (!tracking) {
    throw new Error('Tracking number is required');
  }

  if (target === 'cma-cgm') {
    return getCmaCgmTracking({ trackingNumber: tracking, identity });
  }

  if (target === 'fedex') {
    return getFedexTracking({ trackingNumber: tracking, identity });
  }

  const events = (shipment?.trackingUpdates || shipment?.events || []).map((event) => ({
    code: event.code || null,
    description: event.description || event.note || event.status || null,
    location: event.location || shipment?.currentLocation || null,
    timestamp: event.timestamp || event.date || event.createdAt || null,
  }));

  return {
    provider: 'internal',
    trackingNumber: tracking,
    status: shipment?.status || 'unknown',
    estimatedDelivery: shipment?.estimatedDelivery || null,
    events,
    meta: {
      raw: shipment,
    },
  };
}

module.exports = {
  normaliseProvider,
  createCarrierBooking,
  getCarrierTracking,
};
