const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requireOwner, transactionController.getAllTransactions);
router.get('/pharmacist/:pharmacistId', transactionController.getTransactionsByPharmacist);
router.get('/:id/items', transactionController.getTransactionItems);
router.post('/', transactionController.createTransaction);
router.post('/items', transactionController.createTransactionItem);

module.exports = router;
