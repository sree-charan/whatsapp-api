const express = require('express');
const {
  getSystemStatus,
  getSystemStats,
  getHealthCheck,
  getApiInfo
} = require('../controllers/statusController');

const {
  authenticateEither,
  requireAdmin
} = require('../middleware/auth');

const {
  generalRateLimit
} = require('../middleware/rateLimit');

const router = express.Router();

// Public health check
router.get('/health', getHealthCheck);

// Public API info
router.get('/info', getApiInfo);

// Protected system status (requires authentication)
router.get('/', authenticateEither, generalRateLimit, getSystemStatus);

// Detailed system statistics (requires authentication)
router.get('/stats', authenticateEither, generalRateLimit, getSystemStats);

// Admin-only detailed system information
router.get('/admin', authenticateEither, requireAdmin, generalRateLimit, getSystemStats);

module.exports = router; 