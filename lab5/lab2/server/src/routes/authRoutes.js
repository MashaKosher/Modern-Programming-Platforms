const express = require('express');
const AuthController = require('../controllers/AuthController');
const { strictLimiter } = require('../middleware/security');

const router = express.Router();
const authController = new AuthController();

// Маршруты аутентификации
router.post('/register', strictLimiter, authController.register);
router.post('/login', strictLimiter, authController.login);
router.get('/me', authController.getCurrentUser);
router.post('/verify', authController.verifyToken);

module.exports = router;
