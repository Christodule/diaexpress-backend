const mongoose = require('mongoose');

const Quote = require('../models/Quote');
const Pricing = require('../models/Pricing');
const { getInternalQuote } = require('../services/pricingService');
const MarketPoint = require('../models/MarketPoint');
const TransportLine = require('../models/TransportLine');
const {
  ensureRequestIdentity,
  identityHasRole,
} = require('../services/diaexpressAuthService');
const { syncUserFromIdentity } = require('../services/userIdentityService');

const VALID_STATUSES = new Set(['pending', 'confirmed', 'rejected', 'dispatched']);

function resolveIdentity(req) {
  if (req.identity) {
    return req.identity;
  }

  return ensureRequestIdentity(req);
}

function normaliseDimensions({ dimensions, length, width, height }) {
  if (dimensions && typeof dimensions === 'object') {
    const parsed = ['length', 'width', 'height'].reduce((acc, key) => {
      const value = Number(dimensions[key]);
      if (!Number.isFinite(value) || value <= 0) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});

    return Object.keys(parsed).length === 3 ? parsed : undefined;
  }

  const parsedLength = Number(length);
  const parsedWidth = Number(width);
  const parsedHeight = Number(height);

  if ([parsedLength, parsedWidth, parsedHeight].every((value) => Number.isFinite(value) && value > 0)) {
    return { length: parsedLength, width: parsedWidth, height: parsedHeight };
  }

  return undefined;
}

function normaliseVolume(volume, parsedDimensions) {
  const parsedVolume = Number(volume);
  if (Number.isFinite(parsedVolume) && parsedVolume > 0) {
    return parsedVolume;
  }

  if (!parsedDimensions) {
    return undefined;
  }

  const { length, width, height } = parsedDimensions;
  return (length * width * height) / 1_000_000;
}

function buildQuotePayload(body = {}) {
  const {
    origin,
    destination,
    transportType,
    provider,
    productType,
    productLocation,
    contactPhone,
    photoUrl,
    estimatedPrice,
    packageTypeId,
    length,
    width,
    height,
    weight,
    volume,
    transportLineId,
    estimationMethod,
    matchedPricingId,
    pricingAppliedId,
    pricingBreakdown,
    pickupOption,
    senderAddressId,
    recipientAddressId,
    billingAddressId,
    recipientContactName,
    recipientContactPhone,
    recipientContactEmail,
  } = body;

  return {
    origin,
    destination,
    transportType,
    provider: provider || 'internal',
    productType: productType || null,
    productLocation: productLocation || null,
    contactPhone: contactPhone || null,
    photoUrl: photoUrl || null,
    estimatedPrice,
    packageTypeId: packageTypeId || null,
    length: length || null,
    width: width || null,
    height: height || null,
    weight: weight || null,
    volume: volume || null,
    transportLineId: transportLineId || null,
    estimationMethod: estimationMethod || null,
    matchedPricingId: matchedPricingId || null,
    pricingAppliedId: pricingAppliedId || null,
    pricingBreakdown: pricingBreakdown || null,
    pickupOption: pickupOption || 'pickup',
    senderAddressId: senderAddressId || null,
    recipientAddressId: recipientAddressId || null,
    billingAddressId: billingAddressId || null,
    recipientContactName: recipientContactName || null,
    recipientContactPhone: recipientContactPhone || null,
    recipientContactEmail: recipientContactEmail || null,
  };
}

exports.createQuote = async (req, res) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity?.principalId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    await syncUserFromIdentity(identity);

    const payload = buildQuotePayload(req.body);

    if (!payload.origin || !payload.destination || !payload.transportType || payload.estimatedPrice == null) {
      return res.status(400).json({
        message: 'Origine, destination, type de transport et prix estimé sont obligatoires',
      });
    }

    const quote = new Quote({
      ...payload,
      requestedBy: identity.principalId,
      requestedByType: identity.type || 'user',
      requestedByLabel: identity.label || null,
      status: 'pending',
    });

    await quote.save();

    return res.status(201).json({ message: '✅ Devis créé avec succès', quote });
  } catch (error) {
    console.error('❌ Erreur création devis :', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Identifiant de devis invalide' });
    }

    const identity = resolveIdentity(req);
    const principalId = identity?.principalId || null;
    const isAdmin = identityHasRole(identity, 'admin');

    const quote = await Quote.findById(id).populate('packageTypeId');
    if (!quote) {
      return res.status(404).json({ message: 'Devis introuvable' });
    }

    if (!isAdmin && quote.requestedBy !== principalId) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    return res.json({ quote });
  } catch (error) {
    console.error('Erreur récupération devis par id:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getUserQuotes = async (req, res) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity?.principalId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const quotes = await Quote.find({ requestedBy: identity.principalId }).sort({ createdAt: -1 });
    const cleanQuotes = quotes.map((quote) => ({
      ...quote.toObject(),
      estimatedPrice: Number(quote.estimatedPrice) || 0,
    }));

    return res.json({ quotes: cleanQuotes });
  } catch (error) {
    console.error('Erreur récupération des devis:', error);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    return res.json({ quotes });
  } catch (error) {
    console.error('Erreur récupération devis admin:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Identifiant de devis invalide' });
    }

    await Quote.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Devis supprimé' });
  } catch (error) {
    console.error('Erreur suppression devis:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Statut manquant' });
    }

    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    const quote = await Quote.findById(id);
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable' });
    }

    quote.status = status;

    if (status === 'confirmed' || status === 'pending') {
      quote.paymentStatus = 'pending';
    }
    if (status === 'rejected') {
      quote.paymentStatus = 'failed';
    }

    await quote.save();

    return res.json({ success: true, quote });
  } catch (error) {
    console.error('Erreur updateQuoteStatus:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du statut.' });
  }
};

exports.payQuote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }

    const identity = resolveIdentity(req);
    const principalId = identity?.principalId;

    const quote = await Quote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Devis introuvable' });
    }

    if (!principalId || quote.requestedBy !== principalId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    quote.status = 'confirmed';
    quote.paymentStatus = 'confirmed';
    await quote.save();

    return res.json({ success: true, quote });
  } catch (error) {
    console.error('Erreur paiement devis:', error);
    return res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
};

exports.estimateQuote = async (req, res) => {
  try {
    const {
      origin,
      destination,
      transportType,
      weight,
      volume,
      packageTypeId,
      dimensions,
      length,
      width,
      height,
      transportLineId,
      originMarketPointId,
      destinationMarketPointId,
    } = req.body || {};

    const parsedDimensions = normaliseDimensions({ dimensions, length, width, height });
    const parsedVolume = normaliseVolume(volume, parsedDimensions);
    let resolvedTransportLineId = null;
    if (transportLineId && mongoose.Types.ObjectId.isValid(String(transportLineId))) {
      resolvedTransportLineId = new mongoose.Types.ObjectId(String(transportLineId));
    }

    let resolvedOrigin = origin;
    let resolvedDestination = destination;
    let resolvedTransportType = transportType;

    if (originMarketPointId && mongoose.Types.ObjectId.isValid(String(originMarketPointId))) {
      const mp = await MarketPoint.findById(originMarketPointId).lean();
      resolvedOrigin = resolvedOrigin || mp?.name || mp?.city || mp?._id?.toString();
    }

    if (
      destinationMarketPointId &&
      mongoose.Types.ObjectId.isValid(String(destinationMarketPointId))
    ) {
      const mp = await MarketPoint.findById(destinationMarketPointId).lean();
      resolvedDestination = resolvedDestination || mp?.name || mp?.city || mp?._id?.toString();
    }

    if (resolvedTransportLineId) {
      const line = await TransportLine.findById(resolvedTransportLineId).lean();
      if (line) {
        resolvedOrigin = resolvedOrigin || line.origin;
        resolvedDestination = resolvedDestination || line.destination;
        resolvedTransportType = resolvedTransportType || line.transportTypes?.[0];
      }
    }

    if (!resolvedOrigin || !resolvedDestination || !resolvedTransportType) {
      return res.status(400).json({
        message: 'Origine, destination et mode de transport sont requis (ou ligne de transport).',
      });
    }

    const internalQuote = await getInternalQuote({
      origin: resolvedOrigin,
      destination: resolvedDestination,
      transportType: resolvedTransportType,
      weight,
      volume: parsedVolume,
      packageTypeId,
      dimensions: parsedDimensions,
      transportLineId: resolvedTransportLineId,
    });

    if (!internalQuote) {
      return res.status(404).json({ message: 'Aucun tarif trouvé pour cette configuration.' });
    }

    console.info('[estimateQuote] sélection', {
      transportLineId: resolvedTransportLineId,
      pricingId: internalQuote?.appliedRule?.pricingId,
      origin: resolvedOrigin,
      destination: resolvedDestination,
      transportType: resolvedTransportType,
    });

    return res.json({
      success: true,
      quoteEstimate: {
        totalPrice: internalQuote.estimatedPrice,
        currency: internalQuote.currency,
        appliedRule: internalQuote.appliedRule,
        breakdown: internalQuote.breakdown,
        warnings: internalQuote.warnings || [],
      },
      quotes: [
        {
          estimatedPrice: internalQuote.estimatedPrice,
          currency: internalQuote.currency,
          provider: internalQuote.provider,
          transportType: resolvedTransportType,
        },
      ],
    });
  } catch (error) {
    console.error('Estimate error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

function normaliseObjectId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if (typeof value.toString === 'function') {
      return value.toString();
    }

    if (value._id && typeof value._id.toString === 'function') {
      return value._id.toString();
    }
  }

  return null;
}

exports.getQuoteMeta = async (req, res) => {
  try {
    const pricings = await Pricing.find().populate('transportPrices.packagePricing.packageTypeId');
    const meta = {};

    for (const pricing of pricings) {
      const origin = pricing?.origin;
      const destination = pricing?.destination;

      if (!origin || !destination) {
        continue;
      }

      if (!meta[origin]) {
        meta[origin] = {};
      }

      if (!meta[origin][destination]) {
        meta[origin][destination] = {};
      }

      const transportPrices = Array.isArray(pricing?.transportPrices) ? pricing.transportPrices : [];

      for (const transportPricing of transportPrices) {
        if (!transportPricing || typeof transportPricing !== 'object') {
          continue;
        }

        const transportType = transportPricing.transportType;
        if (!transportType) {
          continue;
        }

        if (!meta[origin][destination][transportType]) {
          meta[origin][destination][transportType] = [];
        }

        const packagePricings = Array.isArray(transportPricing.packagePricing)
          ? transportPricing.packagePricing
          : [];

        for (const packagePricing of packagePricings) {
          if (!packagePricing) {
            continue;
          }

          const packageDoc = packagePricing.packageTypeId;
          const packageId = normaliseObjectId(packageDoc);
          if (!packageId) {
            continue;
          }

          const packageName =
            (packageDoc && typeof packageDoc === 'object' && packageDoc.name) ||
            packagePricing.name ||
            null;

          const basePrice =
            typeof packagePricing.basePrice === 'number' && Number.isFinite(packagePricing.basePrice)
              ? packagePricing.basePrice
              : null;

          meta[origin][destination][transportType].push({
            _id: packageId,
            name: packageName,
            basePrice,
          });
        }
      }
    }

    const origins = Object.keys(meta).map((origin) => ({
      origin,
      destinations: Object.keys(meta[origin]).map((destination) => {
        const transportEntries = meta[origin][destination];
        const transportTypes = Object.keys(transportEntries);
        const packageTypesById = new Map();

        for (const transportType of transportTypes) {
          const packages = Array.isArray(transportEntries[transportType])
            ? transportEntries[transportType]
            : [];

          for (const pkg of packages) {
            const existing = packageTypesById.get(pkg._id);

            if (existing) {
              existing.allowedTransportTypes.add(transportType);
              if (pkg.basePrice != null) {
                existing.basePrice =
                  existing.basePrice == null
                    ? pkg.basePrice
                    : Math.min(existing.basePrice, pkg.basePrice);
              }
              if (!existing.name && pkg.name) {
                existing.name = pkg.name;
              }
            } else {
              packageTypesById.set(pkg._id, {
                _id: pkg._id,
                name: pkg.name,
                basePrice: pkg.basePrice,
                allowedTransportTypes: new Set([transportType]),
              });
            }
          }
        }

        const packageTypes = Array.from(packageTypesById.values()).map((pkg) => ({
          _id: pkg._id,
          name: pkg.name,
          basePrice: pkg.basePrice,
          allowedTransportTypes: Array.from(pkg.allowedTransportTypes),
        }));

        return {
          destination,
          transportTypes,
          packageTypes,
        };
      }),
    }));

    const marketPoints = await MarketPoint.find({ active: { $ne: false } });
    const groupedMarketPoints = marketPoints.reduce((acc, point) => {
      const countryCode = (point.countryCode || 'N/A').toUpperCase();
      const existing = acc.get(countryCode) || {
        countryCode,
        countryName: point.countryName || countryCode,
        points: [],
      };

      existing.points.push({
        id: point._id,
        city: point.city,
        label: point.label,
        type: point.type,
        contactName: point.contactName,
        contactPhone: point.contactPhone,
        contactEmail: point.contactEmail,
        addressLine1: point.addressLine1,
        addressLine2: point.addressLine2,
        postalCode: point.postalCode,
        lat: point.lat,
        lng: point.lng,
      });

      acc.set(countryCode, existing);
      return acc;
    }, new Map());

    const marketPointsByCountry = Array.from(groupedMarketPoints.values());

    return res.json({ origins, marketPoints: marketPointsByCountry });
  } catch (error) {
    console.error('❌ Erreur getQuoteMeta:', error);
    return res.status(500).json({ message: 'Erreur récupération des métadonnées' });
  }
};

exports.confirmQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { finalPrice, currency } = req.body || {};

    const updated = await Quote.findByIdAndUpdate(
      quoteId,
      { status: 'confirmed', finalPrice, currency },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    return res.json({ success: true, status: 'confirmed', quote: updated });
  } catch (error) {
    console.error('Error confirming quote:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.rejectQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { reason } = req.body || {};

    const updated = await Quote.findByIdAndUpdate(
      quoteId,
      { status: 'rejected', rejectionReason: reason || 'Non conforme' },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    return res.json({ success: true, status: 'rejected', quote: updated });
  } catch (error) {
    console.error('Error rejecting quote:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.dispatchQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { carrier, trackingNumber } = req.body || {};

    const updated = await Quote.findByIdAndUpdate(
      quoteId,
      { status: 'dispatched', carrier, trackingNumber },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    return res.json({ success: true, status: 'dispatched', quote: updated });
  } catch (error) {
    console.error('Error dispatching quote:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
