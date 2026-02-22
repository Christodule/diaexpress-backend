// backend/routes/api.js
const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Shipment = require('../models/Shipment');
const Pricing = require('../models/Pricing');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getPricingList, createPricing } = require('../controllers/pricingController');

//
// ----------- QUOTES -----------
//

// POST /api/quote-request (public)
router.post('/quote-request', async (req, res) => {
  try {
    const quote = new Quote({
      ...req.body,
      status: 'pending',
      userId: req.user?._id || null, // lié si connecté
    });
    await quote.save();
    res.status(201).json({ message: 'Quote request submitted', quote });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/quotes (admin) → liste de tous les devis
router.get('/quotes', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const quotes = await Quote.find().populate('userId');
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quotes/me (user) → liste de mes devis
router.get('/quotes/me', requireAuth, async (req, res) => {
  try {
    const quotes = await Quote.find({ userId: req.user._id });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/quotes/:id (admin) → mise à jour générique
router.patch('/quotes/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Quote not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/quotes/:id/confirm (admin)
router.post('/quotes/:id/confirm', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    quote.status = 'confirmed';
    await quote.save();

    const shipment = new Shipment({
      quoteId: quote._id,
      clientId: quote.userId,
      status: 'created',
      trackingCode: `TRK-${Date.now()}`,
    });
    await shipment.save();

    res.json({ message: 'Quote confirmed & shipment created', quote, shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotes/:id/reject (admin)
router.post('/quotes/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    quote.status = 'rejected';
    quote.rejectionReason = req.body.reason || '';
    await quote.save();

    res.json({ message: 'Quote rejected', quote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotes/:id/dispatch (admin)
router.post('/quotes/:id/dispatch', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    quote.status = 'dispatched';
    await quote.save();

    res.json({ message: 'Quote dispatched', quote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotes/:id/tracking (admin) → mise à jour du suivi
router.post('/quotes/:id/tracking', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ quoteId: req.params.id });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    shipment.trackingUpdates.push({
      status: req.body.status,
      location: req.body.location,
      date: new Date(),
    });
    await shipment.save();

    res.json({ message: 'Tracking updated', shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// ----------- SHIPMENTS -----------
//

// GET /api/track/:trackingCode (public)
router.get('/track/:trackingCode', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingCode: req.params.trackingCode });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/client/shipments (client only)
router.get('/client/shipments', requireAuth, requireRole('client'), async (req, res) => {
  try {
    const shipments = await Shipment.find({ clientId: req.user._id });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/shipments (admin only)
router.get('/admin/shipments', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const shipments = await Shipment.find();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// ----------- PRICING -----------
//

// GET /api/pricing (admin)
router.get('/pricing', requireAuth, requireRole('admin'), getPricingList);

// POST /api/pricing (admin)
router.post('/pricing', requireAuth, requireRole('admin'), createPricing);

// POST /api/admin/pricing (admin only)
router.post('/admin/pricing', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pricing = new Pricing(req.body);
    await pricing.save();
    res.status(201).json({ message: 'Pricing created', pricing });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//
// ----------- USER -----------
//

// GET /api/user/me (profil de l’utilisateur connecté)
router.get('/user/me', requireAuth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
