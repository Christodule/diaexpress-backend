const express = require('express');

const bookingController = require('../controllers/bookingController');
const { requireUserOrIntegrationKey } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireUserOrIntegrationKey, bookingController.createBooking);

module.exports = router;
