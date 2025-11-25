const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);

router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranch);
router.post('/', requireOwner, branchController.createBranch);
router.put('/:id', requireOwner, branchController.updateBranch);
router.delete('/:id', requireOwner, branchController.deleteBranch);

module.exports = router;
