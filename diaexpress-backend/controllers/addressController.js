const Address = require('../models/Address');
const Pricing = require('../models/Pricing');

const ALLOWED_TYPES = new Set(['pickup', 'dropoff', 'billing', 'warehouse_proxy', 'contact', 'other']);

const toTrimmedOrNull = (value, { upper = false } = {}) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return upper ? trimmed.toUpperCase() : trimmed;
};

const toBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowered)) return true;
    if (['false', '0', 'no', 'off'].includes(lowered)) return false;
  }
  return undefined;
};

const sanitizeGps = (payload = {}) => {
  if (!payload) return undefined;
  const latitudeValue = Number(payload.latitude);
  const longitudeValue = Number(payload.longitude);
  const latitude = Number.isFinite(latitudeValue) ? latitudeValue : undefined;
  const longitude = Number.isFinite(longitudeValue) ? longitudeValue : undefined;

  if (latitude === undefined || longitude === undefined) {
    return undefined;
  }

  const gps = {
    latitude,
    longitude,
  };

  const accuracyValue = Number(payload.accuracy);
  if (Number.isFinite(accuracyValue)) {
    gps.accuracy = accuracyValue;
  }

  const provider = toTrimmedOrNull(payload.provider);
  if (provider !== undefined) gps.provider = provider;

  if (payload.capturedAt) {
    const capturedAt = new Date(payload.capturedAt);
    if (!Number.isNaN(capturedAt.getTime())) {
      gps.capturedAt = capturedAt;
    }
  }

  return gps;
};

const sanitizeAddressPayload = (payload = {}) => {
  const sanitized = {};

  const type = payload.type && typeof payload.type === 'string' ? payload.type.trim() : undefined;
  if (type && ALLOWED_TYPES.has(type)) {
    sanitized.type = type;
  }

  ['label', 'contactName', 'company', 'email', 'phone', 'line1', 'line2', 'postalCode', 'city', 'state', 'notes'].forEach(
    (key) => {
      const value = toTrimmedOrNull(payload[key]);
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
  );

  const country = toTrimmedOrNull(payload.country, { upper: true });
  if (country !== undefined) {
    sanitized.country = country;
  }

  if (Array.isArray(payload.tags)) {
    sanitized.tags = Array.from(
      new Set(
        payload.tags
          .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
          .filter(Boolean)
      )
    );
  }

  const isDefault = toBoolean(payload.isDefault);
  if (isDefault !== undefined) {
    sanitized.isDefault = isDefault;
  }

  if (payload.gpsLocation === null) {
    sanitized.gpsLocation = null;
  } else {
    const gpsLocation =
      sanitizeGps(payload.gpsLocation) || sanitizeGps(payload.gps) || sanitizeGps(payload.location);
    if (gpsLocation) {
      sanitized.gpsLocation = gpsLocation;
    }
  }

  if (payload.metadata && typeof payload.metadata === 'object') {
    sanitized.metadata = payload.metadata;
  }

  return sanitized;
};

const ensureUser = (req, res) => {
  const user = req.dbUser;
  if (!user) {
    res.status(401).json({ message: "Profil utilisateur introuvable" });
    return null;
  }
  return user;
};

const formatWarehouseEntry = (pricing, warehouse, scope) => {
  if (!warehouse || !warehouse.address) return null;

  return {
    pricingId: pricing._id,
    scope,
    origin: pricing.origin,
    destination: pricing.destination,
    label: warehouse.label || (scope === 'origin' ? `Entrepôt ${pricing.origin}` : `Entrepôt ${pricing.destination}`),
    instructions: warehouse.instructions || null,
    copyHint: warehouse.copyHint || null,
    contact: warehouse.contact || null,
    address: warehouse.address,
    geo: warehouse.geo || null,
    openingHours: warehouse.openingHours || null,
    services: warehouse.services || [],
    applicableFee:
      scope === 'origin'
        ? pricing.pickupFee || null
        : pricing.deliveryFee || null,
    pickupFee: pricing.pickupFee || null,
    deliveryFee: pricing.deliveryFee || null,
    lastMileOptions: pricing.lastMileOptions || null,
    customerAddressGuidelines: pricing.customerAddressGuidelines || null,
  };
};

exports.list = async (req, res) => {
  const user = ensureUser(req, res);
  if (!user) return;

  const query = { userId: user._id };
  const addressDocs = await Address.find(query).sort({ updatedAt: -1 });
  const addresses = addressDocs.map((doc) => doc.toObject());

  const { origin, destination, includeWarehouses } = req.query;
  let warehouses = [];

  if (includeWarehouses === undefined || includeWarehouses === 'true' || includeWarehouses === true) {
    const pricingQuery = {};
    if (origin) pricingQuery.origin = origin;
    if (destination) pricingQuery.destination = destination;

    const pricings = await Pricing.find(pricingQuery, {
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

    warehouses = pricings
      .map((pricing) => {
        const originEntry = formatWarehouseEntry(pricing, pricing.originWarehouse, 'origin');
        const destinationEntry = formatWarehouseEntry(pricing, pricing.destinationWarehouse, 'destination');
        return [originEntry, destinationEntry].filter(Boolean);
      })
      .flat();
  }

  res.json({
    addresses,
    warehouses,
  });
};

exports.create = async (req, res) => {
  const user = ensureUser(req, res);
  if (!user) return;

  const payload = sanitizeAddressPayload(req.body);

  const requiredFields = ['line1', 'city', 'country'];
  const missing = requiredFields.filter((field) => !payload[field]);
  if (missing.length) {
    return res.status(400).json({ message: `Champs manquants: ${missing.join(', ')}` });
  }

  const address = new Address({
    ...payload,
    userId: user._id,
    principalId: user.clerkUserId || user.externalId || null,
  });

  await address.save();

  if (address.isDefault && address.type) {
    await Address.updateMany(
      { userId: user._id, type: address.type, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
  }

  res.status(201).json({ address: address.toObject() });
};

exports.getOne = async (req, res) => {
  const user = ensureUser(req, res);
  if (!user) return;

  const address = await Address.findOne({ _id: req.params.id, userId: user._id });
  if (!address) {
    return res.status(404).json({ message: 'Adresse introuvable' });
  }

  res.json({ address: address.toObject() });
};

exports.update = async (req, res) => {
  const user = ensureUser(req, res);
  if (!user) return;

  const address = await Address.findOne({ _id: req.params.id, userId: user._id });
  if (!address) {
    return res.status(404).json({ message: 'Adresse introuvable' });
  }

  const payload = sanitizeAddressPayload(req.body);
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    address.set(key, value);
  });

  await address.save();

  if (address.isDefault && address.type) {
    await Address.updateMany(
      { userId: user._id, type: address.type, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
  }

  res.json({ address: address.toObject() });
};

exports.remove = async (req, res) => {
  const user = ensureUser(req, res);
  if (!user) return;

  const address = await Address.findOneAndDelete({ _id: req.params.id, userId: user._id });
  if (!address) {
    return res.status(404).json({ message: 'Adresse introuvable' });
  }

  res.json({ message: 'Adresse supprimée' });
};
