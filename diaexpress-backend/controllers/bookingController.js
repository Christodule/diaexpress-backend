const mongoose = require('mongoose');

const Quote = require('../models/Quote');
const Shipment = require('../models/Shipment');
const { createCarrierBooking, normaliseProvider } = require('../services/carrierIntegrationService');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value));
}

function normaliseShipmentStatus(status) {
  const value = String(status || '').toLowerCase();
  if (!value) {
    return 'booked';
  }

  if (['confirmed', 'success', 'booked', 'accepted', 'created'].includes(value)) {
    return 'booked';
  }
  if (['in_transit', 'in-transit', 'transit', 'shipped', 'pickup', 'picked_up', 'picked-up'].includes(value)) {
    return 'in_transit';
  }
  if (['arrived', 'out_for_delivery'].includes(value)) {
    return 'arrived';
  }
  if (['delivered', 'completed'].includes(value)) {
    return 'delivered';
  }
  if (['cancelled', 'canceled', 'rejected'].includes(value)) {
    return 'cancelled';
  }

  return 'pending';
}

function mapQuoteDeliveryStatus(shipmentStatus) {
  switch (shipmentStatus) {
    case 'booked':
      return 'assigned';
    case 'dispatched':
    case 'in_transit':
      return 'in_transit';
    case 'arrived':
      return 'dispatched';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'not_assigned';
    default:
      return 'assigned';
  }
}

function buildTrackingUpdates(events = []) {
  return events
    .filter(Boolean)
    .map((event) => ({
      status: event.code || event.status || event.description || 'update',
      location: event.location || null,
      note: event.description || event.status || null,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));
}

function ensureTrackingCode(fallback) {
  return fallback || `DX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

exports.createBooking = async (req, res) => {
  const { quoteId, provider, options = {} } = req.body || {};

  if (!quoteId || !isValidObjectId(quoteId)) {
    return res.status(400).json({ message: 'quoteId invalide' });
  }

  try {
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ message: 'Devis introuvable' });
    }

    const identity = req.identity || {};
    const booking = await createCarrierBooking({ provider, quote, options, identity });

    if (!booking) {
      return res.status(502).json({ message: 'La réservation transporteur a échoué' });
    }

    const shipmentStatus = normaliseShipmentStatus(booking.status);
    const trackingCode = ensureTrackingCode(booking.trackingCode);
    const bookingReference = booking.bookingReference || null;
    const providerKey = normaliseProvider(provider || booking.provider || quote.provider);

    let shipment = await Shipment.findOne({ quoteId: quote._id });
    const isNewShipment = !shipment;

    const updates = buildTrackingUpdates(booking.events);
    const estimatedDelivery = booking.estimatedDelivery
      ? new Date(booking.estimatedDelivery)
      : quote.estimatedDelivery || null;

    if (isNewShipment) {
      shipment = new Shipment({
        quoteId: quote._id,
        userId: quote.userId || null,
        provider: providerKey,
        carrier: booking.carrier || (providerKey === 'internal' ? 'DiaExpress' : providerKey.toUpperCase()),
        bookingReference,
        serviceType: booking.serviceType || null,
        trackingCode,
        status: shipmentStatus,
        currentLocation: booking.events?.[0]?.location || quote.origin || null,
        estimatedDelivery,
        weight: quote.weight || null,
        volume: quote.volume || null,
        dimensions: {
          length: quote.length || null,
          width: quote.width || null,
          height: quote.height || null,
        },
        trackingUpdates: updates,
        meta: {
          ...(quote.pickupOption ? { pickupOption: quote.pickupOption } : {}),
          providerResponse: booking.meta?.raw || null,
          requestedBy: identity.type,
        },
      });
    } else {
      shipment.provider = providerKey;
      shipment.carrier = booking.carrier || shipment.carrier || providerKey.toUpperCase();
      shipment.bookingReference = bookingReference || shipment.bookingReference || null;
      shipment.serviceType = booking.serviceType || shipment.serviceType || null;
      shipment.trackingCode = trackingCode;
      shipment.status = shipmentStatus;
      shipment.currentLocation = booking.events?.[0]?.location || shipment.currentLocation || null;
      shipment.estimatedDelivery = estimatedDelivery || shipment.estimatedDelivery || null;
      const existingUpdates = Array.isArray(shipment.trackingUpdates)
        ? shipment.trackingUpdates
        : [];
      shipment.trackingUpdates = existingUpdates.concat(updates);
      shipment.meta = {
        ...shipment.meta,
        providerResponse: booking.meta?.raw || shipment.meta?.providerResponse || null,
        requestedBy: identity.type || shipment.meta?.requestedBy,
      };
    }

    await shipment.save();

    quote.shipmentId = shipment._id;
    quote.trackingNumber = shipment.trackingCode;
    quote.status = 'confirmed';
    quote.deliveryStatus = mapQuoteDeliveryStatus(shipment.status);
    quote.carrier = booking.carrier || quote.carrier;

    await quote.save();

    const responsePayload = {
      booking,
      shipment,
      quote: {
        id: quote._id,
        trackingNumber: quote.trackingNumber,
        status: quote.status,
        deliveryStatus: quote.deliveryStatus,
      },
      requestedVia: identity.type || 'user',
    };

    const statusCode = isNewShipment ? 201 : 200;
    return res.status(statusCode).json(responsePayload);
  } catch (error) {
    console.error('Erreur création booking:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
