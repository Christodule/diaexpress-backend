const Shipment = require('../models/Shipment');
const Quote = require('../models/Quote');
const Embarkment = require('../models/Embarkment');
const {
  ensureRequestIdentity,
  identityHasRole,
} = require('../services/diaexpressAuthService');

function generateTrackingCode() {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SH-${yyyymmdd}-${random}`;
}

function ensureIdentity(req, res) {
  const identity = ensureRequestIdentity(req);
  if (!identity?.principalId) {
    res.status(401).json({ message: 'Authentification requise' });
    return null;
  }
  return identity;
}

exports.trackShipment = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const shipment = await Shipment.findOne({ trackingCode }).populate('quoteId');
    if (!shipment) {
      return res.status(404).json({ message: 'Colis introuvable' });
    }

    return res.json({ shipment });
  } catch (error) {
    console.error('Erreur suivi colis:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createFromQuote = async (req, res) => {
  try {
    const identity = ensureIdentity(req, res);
    if (!identity) {
      return;
    }

    const { quoteId } = req.body || {};
    if (!quoteId) {
      return res.status(400).json({ message: 'quoteId requis' });
    }

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ message: 'Devis introuvable' });
    }

    const existing = await Shipment.findOne({ quoteId: quote._id });
    if (existing) {
      return res.status(200).json({ message: 'Shipment déjà existant', shipment: existing });
    }

    const trackingCode = quote.trackingNumber || generateTrackingCode();

    const shipment = new Shipment({
      quoteId: quote._id,
      userId: quote.userId || null,
      principalId: quote.requestedBy || identity.principalId,
      principalLabel: quote.requestedByLabel || identity.label || null,
      provider: quote.provider || 'internal',
      carrier: quote.carrier || 'DiaExpress',
      trackingCode,
      status: 'booked',
      currentLocation: quote.origin || null,
      estimatedDelivery: quote.estimatedDelivery || null,
      weight: quote.weight || null,
      volume: quote.volume || null,
      dimensions: {
        length: quote.length || null,
        width: quote.width || null,
        height: quote.height || null,
      },
      trackingUpdates: [
        {
          location: quote.origin || null,
          status: 'booked',
          note: 'Shipment créé depuis le devis',
          timestamp: new Date(),
        },
      ],
      meta: {
        ...(quote.meta || {}),
        requestedBy: identity.principalId,
        requestedByLabel: identity.label || null,
        quote: {
          origin: quote.origin,
          destination: quote.destination,
          estimatedPrice: quote.estimatedPrice,
        },
        pickupOption: quote.pickupOption || 'pickup',
        senderAddressId: quote.senderAddressId || null,
        recipientAddressId: quote.recipientAddressId || null,
        billingAddressId: quote.billingAddressId || null,
      },
    });

    await shipment.save();

    quote.shipmentId = shipment._id;
    quote.trackingNumber = trackingCode;
    quote.deliveryStatus = 'assigned';
    quote.status = 'confirmed';
    await quote.save();

    return res.status(201).json({
      message: 'Shipment créé',
      shipment,
      quote: { id: quote._id, trackingNumber: quote.trackingNumber },
    });
  } catch (error) {
    console.error('Erreur createFromQuote:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.getMine = async (req, res) => {
  try {
    const identity = ensureIdentity(req, res);
    if (!identity) {
      return;
    }

    const shipments = await Shipment.find({ principalId: identity.principalId }).sort({ createdAt: -1 });
    return res.json({ shipments });
  } catch (error) {
    console.error('Erreur getMine:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const identity = ensureRequestIdentity(req);
    if (!identity || !identityHasRole(identity, 'admin')) {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }

    const filters = {};
    const { status, provider, principalId } = req.query || {};
    if (status) filters.status = status;
    if (provider) filters.provider = provider;
    if (principalId) filters.principalId = principalId;

    const shipments = await Shipment.find(filters).sort({ createdAt: -1 });
    return res.json({ shipments });
  } catch (error) {
    console.error('Erreur getAll shipments:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const identity = ensureRequestIdentity(req);
    const isAdmin = identityHasRole(identity, 'admin');
    const { shipmentId } = req.params;

    const shipment = await Shipment.findById(shipmentId).populate('quoteId').populate('embarkmentId');
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment introuvable' });
    }

    if (!isAdmin && shipment.principalId !== identity?.principalId) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    return res.json({ shipment });
  } catch (error) {
    console.error('Erreur getById shipment:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.assignEmbarkment = async (req, res) => {
  try {
    const identity = ensureRequestIdentity(req);
    if (!identityHasRole(identity, 'admin')) {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }

    const { shipmentId } = req.params;
    const { embarkmentId } = req.body || {};

    if (!embarkmentId) {
      return res.status(400).json({ message: 'embarkmentId requis' });
    }

    const embarkment = await Embarkment.findById(embarkmentId);
    if (!embarkment) {
      return res.status(404).json({ message: 'Embarquement introuvable' });
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment introuvable' });
    }

    shipment.embarkmentId = embarkment._id;
    shipment.meta = shipment.meta || {};
    shipment.meta.embarkmentAssignedAt = new Date();

    await shipment.save();

    return res.json({ message: 'Shipment assigné à un embarquement', shipment });
  } catch (error) {
    console.error('Erreur assignEmbarkment:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const identity = ensureRequestIdentity(req);
    const isAdmin = identityHasRole(identity, 'admin');

    const { shipmentId } = req.params;
    const { status, location, note, paymentStatus } = req.body || {};

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment introuvable' });
    }

    if (!isAdmin && shipment.principalId !== identity?.principalId) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    shipment.meta = shipment.meta || {};
    shipment.trackingUpdates = Array.isArray(shipment.trackingUpdates) ? shipment.trackingUpdates : [];

    if (paymentStatus) {
      shipment.meta.lastPaymentStatus = paymentStatus;
    }

    const hasUpdatePayload = Boolean(status || location || note);

    if (status) {
      shipment.status = status;
    }

    if (location) {
      shipment.currentLocation = location;
    }

    if (hasUpdatePayload) {
      shipment.trackingUpdates.push({
        location: location || shipment.currentLocation || null,
        status: status || shipment.status,
        note: note || (status ? `Status updated to ${status}` : null),
        timestamp: new Date(),
      });
    }

    await shipment.save();

    if (status === 'delivered' || status === 'cancelled') {
      try {
        const quote = await Quote.findById(shipment.quoteId);
        if (quote) {
          quote.deliveryStatus = status === 'delivered' ? 'delivered' : 'not_assigned';
          quote.status = status === 'delivered' ? 'dispatched' : 'rejected';
          await quote.save();
        }
      } catch (innerErr) {
        console.warn('Unable to update linked quote:', innerErr.message || innerErr);
      }
    }

    return res.json({ message: 'Shipment mis à jour', shipment });
  } catch (error) {
    console.error('Erreur updateStatus:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.addHistory = async (req, res) => {
  try {
    const identity = ensureRequestIdentity(req);
    const { shipmentId } = req.params;
    const { location, status, note } = req.body || {};

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment introuvable' });
    }

    if (!identityHasRole(identity, 'admin') && shipment.principalId !== identity?.principalId) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    shipment.trackingUpdates = Array.isArray(shipment.trackingUpdates) ? shipment.trackingUpdates : [];
    shipment.trackingUpdates.push({
      location: location || shipment.currentLocation || null,
      status: status || shipment.status,
      note: note || null,
      timestamp: new Date(),
    });

    if (status) shipment.status = status;
    if (location) shipment.currentLocation = location;

    await shipment.save();
    return res.json({ message: 'Historique ajouté', shipment });
  } catch (error) {
    console.error('Erreur addHistory:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.deleteShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    await Shipment.findByIdAndDelete(shipmentId);
    return res.json({ message: 'Shipment supprimé' });
  } catch (error) {
    console.error('Erreur deleteShipment:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.getShipments = exports.getAll;
