const express = require('express');
const router = express.Router();
const mainStockController = require('../controllers/mainStock.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);
router.use(requireOwner);

router.get('/', mainStockController.getAllStock);
router.get('/medicine/:medicineId', mainStockController.getStockByMedicine);
router.post('/', mainStockController.createStock);
router.put('/:id', mainStockController.updateStock);
router.delete('/:id', mainStockController.deleteStock);

module.exports = router;
