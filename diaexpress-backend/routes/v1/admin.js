const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const paymentsController = require('../../controllers/admin/payments');
const notificationJobsController = require('../../controllers/admin/notificationJobs');
const apiKeysController = require('../../controllers/admin/apiKeys');
const usersController = require('../../controllers/admin/users');
const providersController = require('../../controllers/admin/providers');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// Paiements
router.get('/payments', paymentsController.list);
router.get('/payments/summary', paymentsController.summary);
router.get('/payments/:paymentId', paymentsController.detail);
router.get('/payments/:paymentId/events', paymentsController.events);

// Jobs de notification
router.get('/notifications/jobs', notificationJobsController.list);
router.get('/notifications/jobs/:jobId', notificationJobsController.detail);

// Providers
router.get('/providers', providersController.list);
router.get('/providers/configs', providersController.listConfigs);
router.post('/providers/configs', providersController.createConfig);
router.patch('/providers/configs/:configId', providersController.updateConfig);
router.delete('/providers/configs/:configId', providersController.deleteConfig);
router.get('/providers/errors', providersController.listErrors);

// Clés API
router.get('/api-keys', apiKeysController.list);
router.post('/api-keys', apiKeysController.create);
router.get('/api-keys/:keyId', apiKeysController.detail);
router.patch('/api-keys/:keyId', apiKeysController.update);
router.delete('/api-keys/:keyId', apiKeysController.revoke);

// Utilisateurs
router.get('/users', usersController.list);
router.post('/users', usersController.create);
router.get('/users/:userId', usersController.detail);
router.patch('/users/:userId', usersController.update);
router.delete('/users/:userId', usersController.remove);

module.exports = router;
