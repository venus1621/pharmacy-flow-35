const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', alertController.getAllAlerts);
router.get('/branch/:branchId', alertController.getAlertsByBranch);
router.put('/:id', alertController.updateAlert);
router.put('/:id/read', alertController.markAsRead);
router.put('/:id/resolve', alertController.markAsResolved);

module.exports = router;
