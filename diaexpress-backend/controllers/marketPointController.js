const Country = require('../models/Country');
const MarketPoint = require('../models/MarketPoint');

const parsePagination = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit };
};

const normalizeType = (value) => {
  if (!value) return undefined;
  const lowered = value.toString().toLowerCase();
  if (['hub', 'relay', 'agency'].includes(lowered)) return lowered;
  if (lowered === 'pickup_point') return 'relay';
  return lowered;
};

const buildPayload = async (payload = {}) => {
  const data = {
    name: payload.name || payload.label || payload.city,
    city: payload.city || payload.label || payload.name,
    label: payload.label || payload.name,
    type: normalizeType(payload.type) || 'agency',
    active: payload.isActive ?? payload.active ?? true,
    addressText: payload.addressText,
    geo: payload.geo,
    contactName: payload.contactName,
    contactPhone: payload.contactPhone || payload.phone,
    contactEmail: payload.contactEmail,
  };

  const countryId = payload.countryId || payload.country || payload.countryRefId;
  const countryCode = payload.countryCode || payload.countryCodeRef;

  if (countryId) {
    const country = await Country.findById(countryId);
    if (country) {
      data.countryId = country._id;
      data.countryCode = country.code;
      data.countryName = country.name;
    }
  }

  if (!data.countryCode && countryCode) {
    data.countryCode = countryCode.toString().toUpperCase();
  }

  if (!data.countryName && data.countryCode) {
    const country = await Country.findOne({ code: data.countryCode });
    if (country) {
      data.countryId = country._id;
      data.countryName = country.name;
    }
  }

  if (!data.countryName && payload.countryName) {
    data.countryName = payload.countryName;
  }

  return data;
};

exports.list = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req);
    const { search, country, active, countryId } = req.query;

    const filters = {};
    if (country) {
      filters.countryCode = country.toString().toUpperCase();
    }
    if (countryId) {
      filters.countryId = countryId;
    }
    if (active != null) {
      filters.active = active !== 'false';
    }
    if (search) {
      filters.$or = [
        { city: new RegExp(search, 'i') },
        { label: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { countryName: new RegExp(search, 'i') },
      ];
    }

    const total = await MarketPoint.countDocuments(filters);
    const items = await MarketPoint.find(filters)
      .sort({ countryName: 1, city: 1, label: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('countryId');

    return res.json({ items, page, limit, total });
  } catch (error) {
    console.error('Error listing market points', error);
    return res.status(500).json({ message: 'Erreur lors du chargement des MarketPoints' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = await buildPayload(req.body || {});

    if (!payload.name) {
      return res.status(400).json({ message: 'Le nom est requis pour créer un MarketPoint' });
    }
    if (!payload.countryCode && !payload.countryId) {
      return res.status(400).json({ message: 'Un pays est requis pour créer un MarketPoint' });
    }

    const marketPoint = new MarketPoint(payload);
    await marketPoint.save();
    await marketPoint.populate('countryId');
    return res.status(201).json({ message: 'MarketPoint créé', marketPoint });
  } catch (error) {
    console.error('Error creating market point', error);
    return res.status(400).json({ message: error.message || 'Impossible de créer le MarketPoint' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = await buildPayload(req.body || {});
    const updated = await MarketPoint.findByIdAndUpdate(id, payload, { new: true }).populate('countryId');
    if (!updated) {
      return res.status(404).json({ message: 'MarketPoint introuvable' });
    }
    return res.json({ message: 'MarketPoint mis à jour', marketPoint: updated });
  } catch (error) {
    console.error('Error updating market point', error);
    return res.status(400).json({ message: error.message || 'Impossible de mettre à jour le MarketPoint' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await MarketPoint.findByIdAndUpdate(id, { active: false }, { new: true }).populate('countryId');
    if (!updated) {
      return res.status(404).json({ message: 'MarketPoint introuvable' });
    }
    return res.json({ message: 'MarketPoint désactivé', marketPoint: updated });
  } catch (error) {
    console.error('Error disabling market point', error);
    return res.status(400).json({ message: error.message || 'Impossible de désactiver le MarketPoint' });
  }
};
