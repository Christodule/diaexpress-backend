// 📁 backend/routes/packageType.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/PackageTypeController');
const { requireAuth, requireRole } = require('../middleware/auth');

// accessible à tous
router.get('/', controller.getAllPackageTypes);

// protégées pour admin
router.post('/', requireAuth, requireRole('admin'), controller.createPackageType);
router.put('/:id', requireAuth, requireRole('admin'), controller.updatePackageType);
router.delete('/:id', requireAuth, requireRole('admin'), controller.deletePackageType);

module.exports = router;
