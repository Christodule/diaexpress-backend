const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { exchangeToken, syncUser, getMe } = require('../controllers/authController');

router.post('/token', exchangeToken);
router.get('/me', requireAuth, getMe);
router.post('/sync', requireAuth, syncUser);

module.exports = router;
