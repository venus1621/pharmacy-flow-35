const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');

// Validation rules
const signUpValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').trim().notEmpty()
];

const signInValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Routes
router.post('/signup', signUpValidation, authController.signUp);
router.post('/signin', signInValidation, authController.signIn);
router.post('/signout', authController.signOut);
router.get('/session', authController.getSession);

module.exports = router;
