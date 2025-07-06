const express = require('express');
const { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getProfile, 
  updateProfile, 
  changePassword, 
  regenerateApiKey,
  deleteAccount 
} = require('../controllers/authController');

const { 
  authenticateJWT, 
  authenticateEither 
} = require('../middleware/auth');

const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate, 
  validatePasswordChange 
} = require('../middleware/validation');

const { 
  authRateLimit, 
  generalRateLimit 
} = require('../middleware/rateLimit');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', authRateLimit, validateUserRegistration, register);
router.post('/login', authRateLimit, validateUserLogin, login);
router.post('/logout', generalRateLimit, logout);
router.post('/refresh', generalRateLimit, refreshToken);

// Protected routes (authentication required)
router.get('/profile', authenticateJWT, getProfile);
router.put('/profile', authenticateJWT, validateUserUpdate, updateProfile);
router.post('/change-password', authenticateJWT, validatePasswordChange, changePassword);
router.post('/regenerate-api-key', authenticateJWT, regenerateApiKey);
router.delete('/account', authenticateJWT, deleteAccount);

module.exports = router; 