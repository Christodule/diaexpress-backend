const express = require('express');
const router = express.Router();
const uploadCtrl = require('../controllers/uploadController');

router.post('/', uploadCtrl.uploadMiddleware, uploadCtrl.uploadImage);

module.exports = router;
