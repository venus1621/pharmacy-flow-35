const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate, requireOwner } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requireOwner, profileController.getAllProfiles);
router.get('/:id', profileController.getProfile);
router.post('/', profileController.createProfile);
router.put('/:id', profileController.updateProfile);

module.exports = router;
