const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const TransportLine = require('../models/TransportLine');
const Expedition = require('../models/Expedition');

const router = express.Router();

function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(parseInt(query.limit, 10) || parseInt(query.pageSize, 10) || 20, 100));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildTransportLineFilters(query) {
  const filters = {};

  if (query.origin) {
    filters.origin = new RegExp(query.origin, 'i');
  }
  if (query.destination) {
    filters.destination = new RegExp(query.destination, 'i');
  }
  if (query.transportType) {
    filters.transportTypes = { $in: [query.transportType] };
  }
  if (query.isActive === 'true') {
    filters.isActive = true;
  } else if (query.isActive === 'false') {
    filters.isActive = false;
  }
  if (query.search) {
    filters.$or = [
      { origin: new RegExp(query.search, 'i') },
      { destination: new RegExp(query.search, 'i') },
      { lineCode: new RegExp(query.search, 'i') },
    ];
  }

  return filters;
}

// Transport lines
router.get('/transport-lines', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = buildTransportLineFilters(req.query);

    const [items, total] = await Promise.all([
      TransportLine.find(filters).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      TransportLine.countDocuments(filters),
    ]);

    res.json({ items, total, page, pageSize: limit });
  } catch (error) {
    next(error);
  }
});

router.post('/transport-lines', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const transportLine = new TransportLine(req.body);
    await transportLine.save();
    res.status(201).json(transportLine);
  } catch (error) {
    next(error);
  }
});

router.get('/transport-lines/meta', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const lines = await TransportLine.find({ isActive: true }).lean();

    const originsMap = new Map();

    lines.forEach((line) => {
      const originEntry = originsMap.get(line.origin) || { origin: line.origin, destinations: [] };
      originEntry.destinations.push({
        destination: line.destination,
        transportTypes: line.transportTypes,
        transportLineId: line._id,
        estimatedTransitDays: line.estimatedTransitDays,
      });
      originsMap.set(line.origin, originEntry);
    });

    res.json({ origins: Array.from(originsMap.values()) });
  } catch (error) {
    next(error);
  }
});

router.get('/transport-lines/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const line = await TransportLine.findById(req.params.id);
    if (!line) {
      return res.status(404).json({ message: 'Ligne de transport introuvable' });
    }
    res.json(line);
  } catch (error) {
    next(error);
  }
});

router.put('/transport-lines/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const updated = await TransportLine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Ligne de transport introuvable' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/transport-lines/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const updated = await TransportLine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Ligne de transport introuvable' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Expeditions
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.transportLineId) {
      filters.transportLineId = req.query.transportLineId;
    }

    if (req.query.departureFrom || req.query.departureTo) {
      filters.plannedDepartureDate = {};
      if (req.query.departureFrom) {
        filters.plannedDepartureDate.$gte = new Date(req.query.departureFrom);
      }
      if (req.query.departureTo) {
        filters.plannedDepartureDate.$lte = new Date(req.query.departureTo);
      }
    }

    if (req.query.arrivalFrom || req.query.arrivalTo) {
      filters.plannedArrivalDate = {};
      if (req.query.arrivalFrom) {
        filters.plannedArrivalDate.$gte = new Date(req.query.arrivalFrom);
      }
      if (req.query.arrivalTo) {
        filters.plannedArrivalDate.$lte = new Date(req.query.arrivalTo);
      }
    }

    if (req.query.origin || req.query.destination || req.query.transportType) {
      const lineFilters = buildTransportLineFilters(req.query);
      const matchingLines = await TransportLine.find(lineFilters).select('_id');
      const ids = matchingLines.map((line) => line._id);
      filters.transportLineId = { $in: ids };
    }

    const [items, total] = await Promise.all([
      Expedition.find(filters)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('transportLineId')
        .populate('shipments')
        .populate('quoteId'),
      Expedition.countDocuments(filters),
    ]);

    res.json({ items, total, page, pageSize: limit });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const expedition = new Expedition(req.body);
    await expedition.save();
    const populated = await expedition.populate('transportLineId').populate('shipments');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const expedition = await Expedition.findById(req.params.id)
      .populate('transportLineId')
      .populate('shipments')
      .populate('quoteId');
    if (!expedition) {
      return res.status(404).json({ message: 'Expédition introuvable' });
    }
    res.json(expedition);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const updated = await Expedition.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('transportLineId')
      .populate('shipments')
      .populate('quoteId');
    if (!updated) {
      return res.status(404).json({ message: 'Expédition introuvable' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
