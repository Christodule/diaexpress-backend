// routes/shipmentRoutes.js
const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');

// Middlewares d'auth ; adapte les noms à ton projet
const { requireAuth } = require('../middleware/auth'); // ou ton impl
const { requireRole } = require('../middleware/auth'); // requireRole("admin")

// Create shipment from quote (user action)
router.post('/from-quote', requireAuth, shipmentController.createFromQuote);
// Compatibility path used by legacy/web apps
router.post('/create-from-quote', requireAuth, shipmentController.createFromQuote);

// Get current user's shipments
router.get('/me', requireAuth, shipmentController.getMine);

// Admin: get all shipments
router.get('/', requireAuth, requireRole('admin'), shipmentController.getAll);

// Admin: get shipment by id
router.get('/:shipmentId', requireAuth, requireRole('admin'), shipmentController.getById);

// Admin (or provider) update shipment status
router.patch('/:shipmentId/status', requireAuth, requireRole('admin'), shipmentController.updateStatus);

// Add history (provider or admin) — could be protected differently
router.post('/:shipmentId/history', requireAuth, requireRole('admin'), shipmentController.addHistory);

// Assign shipment to embarkment (admin)
router.patch('/:shipmentId/assign-embarkment', requireAuth, requireRole('admin'), shipmentController.assignEmbarkment);

// Delete (admin)
router.delete('/:shipmentId', requireAuth, requireRole('admin'), shipmentController.deleteShipment);

module.exports = router;
