const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransfer.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);

router.get('/', stockTransferController.getAllTransfers);
router.get('/pharmacist/:pharmacistId', stockTransferController.getTransfersByPharmacist);
router.post('/', stockTransferController.createTransfer);
router.put('/:id', requireOwner, stockTransferController.updateTransfer);

module.exports = router;
