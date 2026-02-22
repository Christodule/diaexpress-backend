const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const Country = require('../models/Country');
const ExpeditionLine = require('../models/ExpeditionLine');
const Embarkment = require('../models/Embarkment');
const MarketPoint = require('../models/MarketPoint');
const Address = require('../models/Address');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(parseInt(query.limit, 10) || parseInt(query.pageSize, 10) || 20, 100));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Countries
router.get('/countries', async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};

    if (req.query.active === 'true') filters.active = true;
    if (req.query.active === 'false') filters.active = false;

    const [items, total] = await Promise.all([
      Country.find(filters).sort({ name: 1 }).skip(skip).limit(limit),
      Country.countDocuments(filters),
    ]);

    res.json({ items, total, page, pageSize: limit });
  } catch (error) {
    next(error);
  }
});

router.post('/countries', async (req, res, next) => {
  try {
    const payload = {
      code: req.body.code,
      name: req.body.name,
      active: req.body.active !== undefined ? req.body.active : true,
    };

    const country = new Country(payload);
    await country.save();
    res.status(201).json(country);
  } catch (error) {
    next(error);
  }
});

router.patch('/countries/:id', async (req, res, next) => {
  try {
    const updated = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Pays introuvable' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/countries/:id', async (req, res, next) => {
  try {
    const updated = await Country.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Pays introuvable' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Expedition lines
const formatExpeditionLine = (line) => {
  const transportType = line.transportType || (Array.isArray(line.transportTypes) ? line.transportTypes[0] : undefined);
  return {
    ...line.toObject(),
    transportType,
    transportTypes: line.transportTypes?.length ? line.transportTypes : transportType ? [transportType] : [],
    isActive: line.isActive,
  };
};

const buildExpeditionLinePayload = async (body = {}) => {
  const payload = {
    label: body.label,
    active: body.isActive ?? body.active ?? true,
    originCountry: body.originCountry?.toUpperCase(),
    destinationCountry: body.destinationCountry?.toUpperCase(),
    originCountryRef: body.originCountryRef || null,
    destinationCountryRef: body.destinationCountryRef || null,
    originAddressId: body.originAddressId || null,
    destinationAddressId: body.destinationAddressId || null,
    originMarketPointId: body.originMarketPointId || null,
    destinationMarketPointId: body.destinationMarketPointId || null,
  };

  const transportType = body.transportType || (Array.isArray(body.transportTypes) ? body.transportTypes[0] : null);
  payload.transportType = transportType;
  payload.transportTypes = Array.isArray(body.transportTypes) && body.transportTypes.length ? body.transportTypes : transportType ? [transportType] : [];

  if (payload.originMarketPointId) {
    const mp = await MarketPoint.findById(payload.originMarketPointId);
    if (mp) {
      payload.originCountry = payload.originCountry || mp.countryCode;
      payload.originCountryRef = payload.originCountryRef || mp.countryId || null;
    }
  }

  if (payload.destinationMarketPointId) {
    const mp = await MarketPoint.findById(payload.destinationMarketPointId);
    if (mp) {
      payload.destinationCountry = payload.destinationCountry || mp.countryCode;
      payload.destinationCountryRef = payload.destinationCountryRef || mp.countryId || null;
    }
  }

  return payload;
};

router.get('/expedition-lines', async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};

    if (req.query.originCountry) filters.originCountry = req.query.originCountry.toUpperCase();
    if (req.query.destinationCountry) filters.destinationCountry = req.query.destinationCountry.toUpperCase();
    if (req.query.transportType) filters.transportTypes = { $in: [req.query.transportType] };
    if (req.query.originMarketPointId) filters.originMarketPointId = req.query.originMarketPointId;
    if (req.query.destinationMarketPointId) filters.destinationMarketPointId = req.query.destinationMarketPointId;
    if (req.query.active === 'true') filters.active = true;
    if (req.query.active === 'false') filters.active = false;

    const [items, total] = await Promise.all([
      ExpeditionLine.find(filters)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('originCountryRef destinationCountryRef originAddressId destinationAddressId originMarketPointId destinationMarketPointId'),
      ExpeditionLine.countDocuments(filters),
    ]);

    res.json({ items: items.map(formatExpeditionLine), total, page, pageSize: limit });
  } catch (error) {
    next(error);
  }
});

router.post('/expedition-lines', async (req, res, next) => {
  try {
    const payload = await buildExpeditionLinePayload(req.body);
    const doc = new ExpeditionLine(payload);
    await doc.save();
    const populated = await doc
      .populate('originCountryRef')
      .populate('destinationCountryRef')
      .populate('originAddressId')
      .populate('destinationAddressId')
      .populate('originMarketPointId destinationMarketPointId');
    res.status(201).json(formatExpeditionLine(populated));
  } catch (error) {
    next(error);
  }
});

router.patch('/expedition-lines/:id', async (req, res, next) => {
  try {
    const payload = await buildExpeditionLinePayload(req.body);
    const updated = await ExpeditionLine.findByIdAndUpdate(req.params.id, payload, { new: true })
      .populate('originCountryRef destinationCountryRef originAddressId destinationAddressId originMarketPointId destinationMarketPointId');

    if (!updated) return res.status(404).json({ message: 'Ligne introuvable' });
    res.json(formatExpeditionLine(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/expedition-lines/:id', async (req, res, next) => {
  try {
    const updated = await ExpeditionLine.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Ligne introuvable' });
    res.json(formatExpeditionLine(updated));
  } catch (error) {
    next(error);
  }
});

// Embarkments
router.get('/embarkments', async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};

    const transportLineId = req.query.transportLineId || req.query.expeditionLineId;
    if (transportLineId) filters.transportLineId = transportLineId;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.transportType) filters.transportType = req.query.transportType;
    if (req.query.active === 'true') filters.active = true;
    if (req.query.active === 'false') filters.active = false;

    if (req.query.departureFrom || req.query.departureTo) {
      filters.departureWindowStart = {};
      if (req.query.departureFrom) filters.departureWindowStart.$gte = new Date(req.query.departureFrom);
      if (req.query.departureTo) filters.departureWindowStart.$lte = new Date(req.query.departureTo);
    }

    const [items, total] = await Promise.all([
      Embarkment.find(filters)
        .sort({ departureWindowStart: 1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'transportLineId',
        })
        .populate('allowedPackageTypes'),
      Embarkment.countDocuments(filters),
    ]);

    const formatted = items.map((item) => ({
      ...item.toObject(),
      startDate: item.startDate || item.departureWindowStart,
      endDate: item.endDate || item.departureWindowEnd,
      cutoffDate: item.cutoffDate || null,
      isActive: item.isActive,
    }));

    res.json({ items: formatted, total, page, pageSize: limit });
  } catch (error) {
    next(error);
  }
});

router.post('/embarkments', async (req, res, next) => {
  try {
    const transportLineId = req.body.transportLineId || req.body.expeditionLineId;
    if (!transportLineId) {
      return res.status(400).json({ message: 'transportLineId requis' });
    }

    const payload = new Embarkment({
      transportLineId,
      expeditionLineId: req.body.expeditionLineId || null,
      transportType: req.body.transportType,
      departureWindowStart: req.body.startDate || req.body.departureWindowStart,
      departureWindowEnd: req.body.endDate || req.body.departureWindowEnd,
      startDate: req.body.startDate || req.body.departureWindowStart,
      endDate: req.body.endDate || req.body.departureWindowEnd,
      cutoffDate: req.body.cutoffDate || null,
      status: req.body.status || 'planned',
      label: req.body.label,
      active: req.body.active ?? req.body.isActive ?? true,
    });
    await payload.save();
    const populated = await payload.populate('transportLineId');
    res.status(201).json({
      ...populated.toObject(),
      startDate: populated.startDate || populated.departureWindowStart,
      endDate: populated.endDate || populated.departureWindowEnd,
      cutoffDate: populated.cutoffDate || null,
      isActive: populated.isActive,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/embarkments/:id', async (req, res, next) => {
  try {
    const transportLineId = req.body.transportLineId || req.body.expeditionLineId;
    const payload = {
      expeditionLineId: req.body.expeditionLineId ?? undefined,
      transportType: req.body.transportType,
      departureWindowStart: req.body.startDate || req.body.departureWindowStart,
      departureWindowEnd: req.body.endDate || req.body.departureWindowEnd,
      startDate: req.body.startDate || req.body.departureWindowStart,
      endDate: req.body.endDate || req.body.departureWindowEnd,
      cutoffDate: req.body.cutoffDate || null,
      status: req.body.status,
      label: req.body.label,
      active: req.body.active ?? req.body.isActive,
    };

    if (transportLineId) {
      payload.transportLineId = transportLineId;
    }

    const updated = await Embarkment.findByIdAndUpdate(req.params.id, payload, { new: true }).populate('transportLineId');

    if (!updated) return res.status(404).json({ message: 'Embarquement introuvable' });
    res.json({
      ...updated.toObject(),
      startDate: updated.startDate || updated.departureWindowStart,
      endDate: updated.endDate || updated.departureWindowEnd,
      cutoffDate: updated.cutoffDate || null,
      isActive: updated.isActive,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/embarkments/:id', async (req, res, next) => {
  try {
    const updated = await Embarkment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', active: false },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Embarquement introuvable' });
    res.json({
      ...updated.toObject(),
      startDate: updated.startDate || updated.departureWindowStart,
      endDate: updated.endDate || updated.departureWindowEnd,
      cutoffDate: updated.cutoffDate || null,
      isActive: updated.isActive,
    });
  } catch (error) {
    next(error);
  }
});

// Logistics addresses (admin scope)
const formatAddress = (address) => ({
  ...address.toObject(),
  isActive: address.isActive,
});

const buildAddressPayload = (body = {}) => {
  const payload = {
    label: body.label,
    contactName: body.contactName,
    contactPhone: body.contactPhone || body.phone,
    phone: body.contactPhone || body.phone,
    line1: body.addressText || body.line1 || body.addressLine1 || body.address,
    line2: body.line2,
    city: body.city || 'N/A',
    country: (body.country || body.countryCode || '').toString().trim().toUpperCase(),
    countryCode: body.countryCode || body.country,
    addressText: body.addressText,
    marketPointId: body.marketPointId || null,
    geo: body.geo,
    latitude: body.geo?.lat,
    longitude: body.geo?.lng,
    active: body.active ?? body.isActive ?? true,
  };

  return payload;
};

router.get('/addresses', async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};

    if (req.query.marketPointId) filters.marketPointId = req.query.marketPointId;
    if (req.query.active === 'true') filters.active = true;
    if (req.query.active === 'false') filters.active = false;

    const [items, total] = await Promise.all([
      Address.find(filters).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('marketPointId'),
      Address.countDocuments(filters),
    ]);

    res.json({ items: items.map(formatAddress), total, page, pageSize: limit });
  } catch (error) {
    next(error);
  }
});

router.post('/addresses', async (req, res, next) => {
  try {
    const payload = buildAddressPayload(req.body);
    const address = new Address(payload);
    await address.save();
    await address.populate('marketPointId');
    res.status(201).json(formatAddress(address));
  } catch (error) {
    next(error);
  }
});

router.patch('/addresses/:id', async (req, res, next) => {
  try {
    const payload = buildAddressPayload(req.body);
    const updated = await Address.findByIdAndUpdate(req.params.id, payload, { new: true }).populate('marketPointId');
    if (!updated) return res.status(404).json({ message: 'Adresse introuvable' });
    res.json(formatAddress(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/addresses/:id', async (req, res, next) => {
  try {
    const updated = await Address.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Adresse introuvable' });
    res.json(formatAddress(updated));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
