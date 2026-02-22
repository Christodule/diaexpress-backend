const Quote = require('../models/Quote');
const Shipment = require('../models/Shipment');
const { getCarrierTracking, normaliseProvider } = require('../services/carrierIntegrationService');

function normaliseShipmentStatus(status) {
  const value = String(status || '').toLowerCase();
  if (['booked', 'confirmed', 'success', 'accepted'].includes(value)) {
    return 'booked';
  }
  if (['in_transit', 'in-transit', 'transit', 'pickup', 'picked_up', 'picked-up', 'shipped'].includes(value)) {
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

function convertEvents(events = []) {
  return events
    .filter(Boolean)
    .map((event) => ({
      status: event.code || event.status || event.description || 'update',
      location: event.location || null,
      note: event.description || event.status || null,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));
}

exports.getTracking = async (req, res) => {
  const trackingCode = req.params.trackingCode || req.params.code;

  if (!trackingCode) {
    return res.status(400).json({ message: 'trackingCode requis' });
  }

  try {
    const shipment = await Shipment.findOne({ trackingCode });
    const provider = normaliseProvider(req.query.provider || shipment?.provider);

    if (!shipment && provider === 'internal') {
      return res.status(404).json({ message: 'Expédition introuvable' });
    }

    const identity = req.identity || {};
    const trackingPayload = await getCarrierTracking({
      provider,
      trackingNumber: trackingCode,
      shipment,
      identity,
    });

    if (!trackingPayload) {
      if (shipment) {
        return res.json({
          provider,
          trackingCode,
          status: shipment.status,
          events: shipment.trackingUpdates,
          shipment,
        });
      }

      return res.status(502).json({ message: 'Impossible de récupérer le suivi transporteur' });
    }

    const status = normaliseShipmentStatus(trackingPayload.status || shipment?.status);
    const events = convertEvents(trackingPayload.events);

    if (shipment) {
      shipment.status = status;
      const existingUpdates = Array.isArray(shipment.trackingUpdates)
        ? shipment.trackingUpdates
        : [];
      shipment.trackingUpdates = existingUpdates.concat(events);
      shipment.currentLocation = events[events.length - 1]?.location || shipment.currentLocation || null;
      shipment.estimatedDelivery = trackingPayload.estimatedDelivery
        ? new Date(trackingPayload.estimatedDelivery)
        : shipment.estimatedDelivery;
      shipment.meta = {
        ...shipment.meta,
        lastTrackingSync: new Date(),
        providerTrackingPayload: trackingPayload.meta?.raw || shipment.meta?.providerTrackingPayload || null,
      };

      await shipment.save();

      if (shipment.quoteId) {
        const quote = await Quote.findById(shipment.quoteId);
        if (quote) {
          quote.deliveryStatus = mapQuoteDeliveryStatus(shipment.status);
          quote.trackingNumber = shipment.trackingCode;
          await quote.save();
        }
      }
    }

    return res.json({
      provider,
      trackingCode,
      status,
      estimatedDelivery: trackingPayload.estimatedDelivery || shipment?.estimatedDelivery || null,
      events,
      shipment,
    });
  } catch (error) {
    console.error('Erreur récupération tracking:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
