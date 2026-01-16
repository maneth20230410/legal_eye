// routes/authRoutes.js
// Authentication routes

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validators');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.put('/profile/:id', protect, authController.updateProfile);
router.post('/change-password', protect, authController.changePassword);

module.exports = router;