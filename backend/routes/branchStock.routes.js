const express = require('express');
const router = express.Router();
const branchStockController = require('../controllers/branchStock.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', branchStockController.getAllBranchStock);
router.get('/branch/:branchId', branchStockController.getStockByBranch);
router.post('/', branchStockController.createBranchStock);
router.put('/:id', branchStockController.updateBranchStock);
router.delete('/:id', branchStockController.deleteBranchStock);

module.exports = router;
