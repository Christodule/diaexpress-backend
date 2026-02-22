const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const syncUser = require('../middleware/syncUser');
const controller = require('../controllers/addressController');

router.use(requireAuth, syncUser);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
