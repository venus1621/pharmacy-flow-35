const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacy.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);

router.get('/', pharmacyController.getPharmacy);
router.post('/', requireOwner, pharmacyController.createPharmacy);
router.put('/:id', requireOwner, pharmacyController.updatePharmacy);

module.exports = router;
