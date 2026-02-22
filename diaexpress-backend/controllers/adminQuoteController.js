const Quote = require('../models/Quote');
const { push: notify } = require('../services/notificationService');

exports.listAll = async (req, res) => {
  try {
    const items = await Quote.find().sort({ createdAt: -1 });
    res.json({ quotes: items });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      finalPrice,
      currency,
      notes,
      estimationMethod,
      matchedPricingId,
      productType,
      productLocation,
      contactPhone,
      carrier
    } = req.body;

    const q = await Quote.findByIdAndUpdate(
      id,
      {
        ...(finalPrice != null && { finalPrice }),
        ...(currency && { currency }),
        ...(notes && { notes }),
        ...(estimationMethod && { estimationMethod }),
        ...(matchedPricingId && { matchedPricingId }),
        ...(productType && { productType }),
        ...(productLocation && { productLocation }),
        ...(contactPhone && { contactPhone }),
        ...(carrier && { carrier })
      },
      { new: true, runValidators: true }
    );

    if (!q) return res.status(404).json({ message: 'Quote non trouvé' });

    // ping l’utilisateur
    if (q.userId) {
      await notify({
        userId: q.userId,
        type: 'quote',
        title: 'Devis mis à jour',
        message: `Votre devis #${q._id} a été mis à jour par l’admin.`,
        entity: { entityType: 'Quote', entityId: q._id },
        channels: { inApp: true }
      });
    }

    res.json({ quote: q });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice, currency = 'USD' } = req.body;

    const q = await Quote.findByIdAndUpdate(
      id,
      {
        status: 'confirmed',
        finalPrice: finalPrice ?? undefined,
        currency
      },
      { new: true, runValidators: true }
    );
    if (!q) return res.status(404).json({ message: 'Quote non trouvé' });

    if (q.userId) {
      await notify({
        userId: q.userId,
        type: 'quote',
        title: 'Devis approuvé',
        message: `Votre devis #${q._id} a été approuvé. Montant: ${q.finalPrice} ${q.currency}.`,
        entity: { entityType: 'Quote', entityId: q._id }
      });
    }

    res.json({ quote: q });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const q = await Quote.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        rejectionReason: reason || 'Rejeté par l’admin'
      },
      { new: true, runValidators: true }
    );
    if (!q) return res.status(404).json({ message: 'Quote non trouvé' });

    if (q.userId) {
      await notify({
        userId: q.userId,
        type: 'quote',
        title: 'Devis refusé',
        message: `Votre devis #${q._id} a été refusé. Motif: ${reason || '—'}.`,
        entity: { entityType: 'Quote', entityId: q._id }
      });
    }

    res.json({ quote: q });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.dispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, eta, trackingUrl } = req.body;

    const q = await Quote.findByIdAndUpdate(
      id,
      {
        status: 'dispatched',
        deliveryStatus: 'dispatched',
        carrier: carrier || 'Internal',
        ...(trackingNumber && { trackingNumber }),
        ...(eta && { eta }),
        ...(trackingUrl && { trackingUrl })
      },
      { new: true, runValidators: true }
    );

    if (!q) return res.status(404).json({ message: 'Quote non trouvé' });

    if (q.userId) {
      await notify({
        userId: q.userId,
        type: 'shipment',
        title: 'Colis expédié',
        message: `Votre envoi (devis #${q._id}) a été dispatché.`,
        entity: { entityType: 'Quote', entityId: q._id },
        metadata: { trackingNumber, trackingUrl }
      });
    }

    res.json({ quote: q });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, trackingUrl, eta } = req.body;

    const q = await Quote.findByIdAndUpdate(
      id,
      {
        ...(status && { deliveryStatus: status }),
        ...(trackingNumber && { trackingNumber }),
        ...(trackingUrl && { trackingUrl }),
        ...(eta && { eta })
      },
      { new: true, runValidators: true }
    );
    if (!q) return res.status(404).json({ message: 'Quote non trouvé' });

    res.json({ quote: q });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
