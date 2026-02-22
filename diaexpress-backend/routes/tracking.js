const express = require('express');

const trackingController = require('../controllers/trackingController');
const { optionalUserOrIntegrationKey } = require('../middleware/auth');

const router = express.Router();

router.get('/:trackingCode', optionalUserOrIntegrationKey, trackingController.getTracking);

module.exports = router;
