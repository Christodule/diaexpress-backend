const router = require('express').Router();
const marketPointController = require('../controllers/marketPointController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/', marketPointController.list);
router.post('/', marketPointController.create);
router.patch('/:id', marketPointController.update);
router.delete('/:id', marketPointController.remove);

module.exports = router;
