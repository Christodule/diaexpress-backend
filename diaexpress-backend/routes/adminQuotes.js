const router = require('express').Router();
const adminQuote = require('../controllers/adminQuoteController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Toutes ces routes sont ADMIN
router.use(requireAuth, requireRole('admin'));

router.get('/', adminQuote.listAll);
router.patch('/:id', adminQuote.updateByAdmin);
router.post('/:id/approve', adminQuote.approve);
router.post('/:id/reject', adminQuote.reject);
router.post('/:id/dispatch', adminQuote.dispatch);
router.post('/:id/tracking', adminQuote.updateTracking);

module.exports = router;
