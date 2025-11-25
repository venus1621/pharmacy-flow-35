const express = require('express');
const router = express.Router();
const pharmacistAssignmentController = require('../controllers/pharmacistAssignment.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requireOwner, pharmacistAssignmentController.getAllAssignments);
router.get('/pharmacist/:pharmacistId', pharmacistAssignmentController.getAssignmentsByPharmacist);
router.post('/', requireOwner, pharmacistAssignmentController.createAssignment);
router.delete('/:id', requireOwner, pharmacistAssignmentController.deleteAssignment);

module.exports = router;
