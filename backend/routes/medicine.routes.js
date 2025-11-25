const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicine.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);

router.get('/', medicineController.getAllMedicines);
router.get('/:id', medicineController.getMedicine);
router.post('/', requireOwner, medicineController.createMedicine);
router.put('/:id', requireOwner, medicineController.updateMedicine);
router.delete('/:id', requireOwner, medicineController.deleteMedicine);

module.exports = router;
