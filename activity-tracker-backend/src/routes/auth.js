
// src/routes/auth.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { registerValidation, loginValidation, validateRequest } = require('../middleware/validation');

const router = express.Router();

router.post('/register', registerValidation, validateRequest, AuthController.register);
router.post('/login', loginValidation, validateRequest, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/check', AuthController.checkAuth);

module.exports = router;