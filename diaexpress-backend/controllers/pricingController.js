
// ================================
/*const Pricing = require('../models/Pricing');


exports.getAllPricings = async (req, res) => {
  try {
    const pricings = await Pricing.find();
    res.json(pricings);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createPricing = async (req, res) => {
  try {
    const {
      origin,
      destination,
      transportType,
      unitType,
      pricePerUnit,
      dimensionRanges = [],
      packagePricing = []
    } = req.body;

    const pricing = new Pricing({
      origin,
      destination,
      transportType,
      unitType,
      pricePerUnit,
      dimensionRanges,
      packagePricing
    });

    await pricing.save();
    res.status(201).json({ message: 'Tarif créé', pricing });
  } catch (err) {
    res.status(400).json({ message: 'Erreur: ' + err.message });
  }
};

exports.updatePricing = async (req, res) => {
  try {
    const {
      origin,
      destination,
      transportType,
      unitType,
      pricePerUnit,
      dimensionRanges = [],
      packagePricing = []
    } = req.body;

    const updated = await Pricing.findByIdAndUpdate(
      req.params.id,
      {
        origin,
        destination,
        transportType,
        unitType,
        pricePerUnit,
        dimensionRanges,
        packagePricing
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Tarif non trouvé' });
    res.json({ message: 'Tarif mis à jour', pricing: updated });
  } catch (err) {
    res.status(400).json({ message: 'Erreur update: ' + err.message });
  }
};

exports.deletePricing = async (req, res) => {
  try {
    await Pricing.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Tarif supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getDistinctLocations = async (req, res) => {
  try {
    const origins = await Pricing.distinct('origin');
    const destinations = await Pricing.distinct('destination');
    res.json({ origins, destinations });
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération lieux' });
  }
};
*/
// backend/controllers/pricingController.js
const mongoose = require('mongoose');
const Pricing = require("../models/Pricing");
const Address = require('../models/Address');
const TransportLine = require('../models/TransportLine');
const PackageType = require('../models/PackageType');

const toTrimmed = (value, { upper = false } = {}) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return upper ? trimmed.toUpperCase() : trimmed;
};

const sanitizeAddressBlock = (address = {}) => {
  if (!address || typeof address !== "object") return undefined;
  const sanitized = {};

  const label = toTrimmed(address.label);
  if (label !== undefined) sanitized.label = label;

  const instructions = toTrimmed(address.instructions);
  if (instructions !== undefined) sanitized.instructions = instructions;

  const copyHint = toTrimmed(address.copyHint);
  if (copyHint !== undefined) sanitized.copyHint = copyHint;

  if (address.contact && typeof address.contact === "object") {
    sanitized.contact = {};
    ["name", "phone", "email", "whatsapp"].forEach((key) => {
      const value = toTrimmed(address.contact[key]);
      if (value !== undefined) sanitized.contact[key] = value;
    });
    if (!Object.keys(sanitized.contact).length) delete sanitized.contact;
  }

  if (address.address && typeof address.address === "object") {
    sanitized.address = {};
    ["line1", "line2", "postalCode", "city", "state"].forEach((key) => {
      const value = toTrimmed(address.address[key]);
      if (value !== undefined) sanitized.address[key] = value;
    });
    const country = toTrimmed(address.address.country, { upper: true });
    if (country !== undefined) sanitized.address.country = country;
    if (!Object.keys(sanitized.address).length) delete sanitized.address;
  }

  if (address.geo && typeof address.geo === "object") {
    const latitude = Number(address.geo.latitude);
    const longitude = Number(address.geo.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      sanitized.geo = { latitude, longitude };
      if (Number.isFinite(Number(address.geo.accuracy))) {
        sanitized.geo.accuracy = Number(address.geo.accuracy);
      }
      const provider = toTrimmed(address.geo.provider);
      if (provider !== undefined) sanitized.geo.provider = provider;
      if (address.geo.updatedAt) {
        const updatedAt = new Date(address.geo.updatedAt);
        if (!Number.isNaN(updatedAt.getTime())) {
          sanitized.geo.updatedAt = updatedAt;
        }
      }
    }
  }

  const openingHours = toTrimmed(address.openingHours);
  if (openingHours !== undefined) sanitized.openingHours = openingHours;

  if (Array.isArray(address.services)) {
    const services = Array.from(
      new Set(
        address.services
          .map((service) => (typeof service === "string" ? service.trim() : ""))
          .filter(Boolean)
      )
    );
    if (services.length) sanitized.services = services;
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
};

const sanitizeFee = (fee = {}) => {
  if (!fee || typeof fee !== "object") return undefined;
  const type = toTrimmed(fee.type);
  if (!type || !["per_km", "flat"].includes(type)) return undefined;

  const amount = Number(fee.amount);
  if (!Number.isFinite(amount)) return undefined;

  const sanitized = { type, amount };

  const currency = toTrimmed(fee.currency, { upper: true });
  if (currency !== undefined) sanitized.currency = currency;

  if (Number.isFinite(Number(fee.minAmount))) {
    sanitized.minAmount = Number(fee.minAmount);
  }

  const notes = toTrimmed(fee.notes);
  if (notes !== undefined) sanitized.notes = notes;

  return sanitized;
};

const sanitizeLastMileOptions = (options = {}) => {
  if (!options || typeof options !== "object") return undefined;
  const sanitized = {};

  [
    "allowWarehouseDropoff",
    "allowWarehousePickup",
    "allowHomePickup",
    "allowHomeDelivery",
    "gpsRequiredForHome",
  ].forEach((key) => {
    if (options[key] === undefined) return;
    sanitized[key] = Boolean(options[key]);
  });

  const notes = toTrimmed(options.notes);
  if (notes !== undefined) sanitized.notes = notes;

  return Object.keys(sanitized).length ? sanitized : undefined;
};

const sanitizeCustomerGuidelines = (guidelines = {}) => {
  if (!guidelines || typeof guidelines !== "object") return undefined;
  const sanitized = {};

  if (Array.isArray(guidelines.allowedCountries)) {
    const countries = Array.from(
      new Set(
        guidelines.allowedCountries
          .map((country) => (typeof country === "string" ? country.trim().toUpperCase() : ""))
          .filter(Boolean)
      )
    );
    if (countries.length) sanitized.allowedCountries = countries;
  }

  if (Array.isArray(guidelines.requiredFields)) {
    const fields = Array.from(
      new Set(
        guidelines.requiredFields
          .map((field) => (typeof field === "string" ? field.trim() : ""))
          .filter(Boolean)
      )
    );
    if (fields.length) sanitized.requiredFields = fields;
  }

  const instructions = toTrimmed(guidelines.instructions);
  if (instructions !== undefined) sanitized.instructions = instructions;

  return Object.keys(sanitized).length ? sanitized : undefined;
};

const sanitizeGeoPoint = (geo = {}) => {
  if (!geo || typeof geo !== "object") return undefined;

  const latitudeValue = Number(geo.latitude);
  const longitudeValue = Number(geo.longitude);
  if (!Number.isFinite(latitudeValue) || !Number.isFinite(longitudeValue)) {
    return undefined;
  }

  const sanitized = {
    latitude: latitudeValue,
    longitude: longitudeValue,
  };

  const accuracyValue = Number(geo.accuracy);
  if (Number.isFinite(accuracyValue)) {
    sanitized.accuracy = accuracyValue;
  }

  const provider = toTrimmed(geo.provider);
  if (provider !== undefined) {
    sanitized.provider = provider;
  }

  if (geo.capturedAt) {
    const capturedAt = new Date(geo.capturedAt);
    if (!Number.isNaN(capturedAt.getTime())) {
      sanitized.capturedAt = capturedAt;
    }
  }

  if (geo.updatedAt) {
    const updatedAt = new Date(geo.updatedAt);
    if (!Number.isNaN(updatedAt.getTime())) {
      sanitized.updatedAt = updatedAt;
    }
  }

  return sanitized;
};

const parseObjectId = (value) => {
  if (!value) return null;
  const stringValue = String(value).trim();
  if (!stringValue) return null;
  return mongoose.Types.ObjectId.isValid(stringValue) ? new mongoose.Types.ObjectId(stringValue) : null;
};

const formatAddressDisplay = (address = {}) => {
  const label = toTrimmed(address.label);
  if (label) return label;

  const lineParts = [address.line1, address.postalCode, address.city]
    .map((value) => toTrimmed(value))
    .filter(Boolean);
  if (lineParts.length) {
    return lineParts.join(", ");
  }

  const localityParts = [address.city, address.country]
    .map((value) => toTrimmed(value, { upper: value === address.country }))
    .filter(Boolean);
  if (localityParts.length) {
    return localityParts.join(", ");
  }

  return address._id ? String(address._id) : "";
};

const createAddressSelectionError = (field, type) => {
  const fieldLabel = field === "origin" ? "d'origine" : "de destination";
  const message =
    type === "invalid"
      ? `Identifiant de l'adresse ${fieldLabel} invalide.`
      : `Adresse ${fieldLabel} introuvable.`;
  const error = new Error(message);
  error.statusCode = 400;
  error.field = field;
  return error;
};

const applyAddressSelection = async (payload, body = {}) => {
  const handleSelection = async (field) => {
    const idKey = `${field}AddressId`;
    const locationKey = `${field}Location`;

    if (body[idKey] === null) {
      payload[idKey] = null;
      if (payload[locationKey] === undefined && body[locationKey] === undefined) {
        payload[locationKey] = null;
      }
      return;
    }

    const rawId = body[idKey];
    if (!rawId) return;

    const stringId = String(rawId).trim();
    if (!stringId) return;

    if (!mongoose.Types.ObjectId.isValid(stringId)) {
      throw createAddressSelectionError(field, "invalid");
    }

    const address = await Address.findById(stringId).lean();
    if (!address) {
      throw createAddressSelectionError(field, "not_found");
    }

    payload[idKey] = address._id;
    payload[field] = formatAddressDisplay(address) || payload[field];

    const geo = sanitizeGeoPoint(address.gpsLocation);
    if (geo) {
      payload[locationKey] = geo;
    }
  };

  await handleSelection("origin");
  await handleSelection("destination");

  return payload;
};

const buildPricingPayload = (body = {}) => {
  const payload = {
    origin: toTrimmed(body.origin),
    destination: toTrimmed(body.destination),
    transportLineId: parseObjectId(body.transportLineId),
    transportPrices: Array.isArray(body.transportPrices) ? body.transportPrices : undefined,
    originWarehouse:
      body.originWarehouse === null ? null : sanitizeAddressBlock(body.originWarehouse),
    destinationWarehouse:
      body.destinationWarehouse === null ? null : sanitizeAddressBlock(body.destinationWarehouse),
    pickupFee: body.pickupFee === null ? null : sanitizeFee(body.pickupFee),
    deliveryFee: body.deliveryFee === null ? null : sanitizeFee(body.deliveryFee),
    lastMileOptions:
      body.lastMileOptions === null ? null : sanitizeLastMileOptions(body.lastMileOptions),
    customerAddressGuidelines:
      body.customerAddressGuidelines === null
        ? null
        : sanitizeCustomerGuidelines(body.customerAddressGuidelines),
  };

  if (body.originLocation === null) {
    payload.originLocation = null;
  } else {
    const originLocation = sanitizeGeoPoint(body.originLocation);
    if (originLocation !== undefined) {
      payload.originLocation = originLocation;
    }
  }

  if (body.destinationLocation === null) {
    payload.destinationLocation = null;
  } else {
    const destinationLocation = sanitizeGeoPoint(body.destinationLocation);
    if (destinationLocation !== undefined) {
      payload.destinationLocation = destinationLocation;
    }
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

// ✅ Créer un nouveau pricing
exports.createPricing = async (req, res) => {
  try {
    const payload = buildPricingPayload(req.body);
    await applyAddressSelection(payload, req.body);

    let linkedTransportLine = null;
    if (payload.transportLineId) {
      linkedTransportLine = await TransportLine.findById(payload.transportLineId).lean();
      if (!linkedTransportLine) {
        return res.status(400).json({ message: "Ligne de transport introuvable pour ce tarif." });
      }
      payload.origin = payload.origin || linkedTransportLine.origin;
      payload.destination = payload.destination || linkedTransportLine.destination;

      if (!payload.transportPrices?.length && Array.isArray(linkedTransportLine.transportTypes)) {
        payload.transportPrices = linkedTransportLine.transportTypes.map((mode) => ({
          transportType: mode,
          allowedUnits: ['kg', 'm3'],
          unitType: 'kg',
          pricePerUnit: null,
        }));
      }
    }

    if (!payload.origin || !payload.destination || !Array.isArray(payload.transportPrices)) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const pricing = new Pricing(payload);

    await pricing.save();
    res.status(201).json(pricing);
  } catch (err) {
    console.error("Erreur création pricing:", err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Récupérer tous les pricings
exports.getAllPricing = async (req, res) => {
  try {
    const query = {};
    if (req.query.transportLineId) {
      const parsed = parseObjectId(req.query.transportLineId);
      if (parsed) {
        query.transportLineId = parsed;
      }
    }

    if (req.query.transportType) {
      query['transportPrices.transportType'] = req.query.transportType;
    }

    const pricings = await Pricing.find(query).sort({ updatedAt: -1 });
    res.json(pricings);
  } catch (err) {
    console.error("Erreur getAllPricing:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Récupérer un pricing par ID
exports.getPricingById = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    if (!pricing) return res.status(404).json({ message: "Tarif introuvable" });
    res.json(pricing);
  } catch (err) {
    console.error("Erreur getPricingById:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Mettre à jour un pricing
exports.updatePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    if (!pricing) return res.status(404).json({ message: "Tarif introuvable" });

    const payload = buildPricingPayload(req.body);
    await applyAddressSelection(payload, req.body);

    if (payload.transportLineId) {
      const linkedTransportLine = await TransportLine.findById(payload.transportLineId).lean();
      if (!linkedTransportLine) {
        return res.status(400).json({ message: "Ligne de transport introuvable" });
      }
      payload.origin = payload.origin || linkedTransportLine.origin;
      payload.destination = payload.destination || linkedTransportLine.destination;

      if (!payload.transportPrices?.length && Array.isArray(linkedTransportLine.transportTypes)) {
        payload.transportPrices = linkedTransportLine.transportTypes.map((mode) => ({
          transportType: mode,
          allowedUnits: ['kg', 'm3'],
          unitType: 'kg',
          pricePerUnit: null,
        }));
      }
    }

    Object.entries(payload).forEach(([key, value]) => {
      if (key === "transportPrices" && Array.isArray(value)) {
        pricing.transportPrices = value;
        return;
      }

      if (value === undefined) return;
      pricing.set(key, value);
    });

    await pricing.save();
    res.json(pricing);
  } catch (err) {
    console.error("Erreur updatePricing:", err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Supprimer un pricing
exports.deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndDelete(req.params.id);
    if (!pricing) return res.status(404).json({ message: "Tarif introuvable" });

    res.json({ message: "Tarif supprimé" });
  } catch (err) {
    console.error("Erreur deletePricing:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getWarehouses = async (req, res) => {
  try {
    const { origin, destination } = req.query;
    const query = {};
    if (origin) query.origin = origin;
    if (destination) query.destination = destination;

    const pricings = await Pricing.find(query, {
      origin: 1,
      destination: 1,
      originWarehouse: 1,
      destinationWarehouse: 1,
      pickupFee: 1,
      deliveryFee: 1,
      lastMileOptions: 1,
      customerAddressGuidelines: 1,
    })
      .sort({ origin: 1, destination: 1 })
      .lean();

    const routes = pricings.map((pricing) => ({
      pricingId: pricing._id,
      origin: pricing.origin,
      destination: pricing.destination,
      originWarehouse: pricing.originWarehouse || null,
      destinationWarehouse: pricing.destinationWarehouse || null,
      pickupFee: pricing.pickupFee || null,
      deliveryFee: pricing.deliveryFee || null,
      lastMileOptions: pricing.lastMileOptions || null,
      customerAddressGuidelines: pricing.customerAddressGuidelines || null,
    }));

    res.json({ routes });
  } catch (err) {
    console.error("Erreur getWarehouses:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getPricingMeta = async (_req, res) => {
  try {
    const [transportLines, packageTypes] = await Promise.all([
      TransportLine.find({ isActive: true })
        .select('origin destination transportTypes lineCode isActive estimatedTransitDays')
        .lean(),
      PackageType.find().select('label name description _id').lean(),
    ]);

    res.json({
      transportLines,
      packageTypes,
      unitTypes: ['kg', 'm3'],
    });
  } catch (err) {
    console.error('Erreur getPricingMeta:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
