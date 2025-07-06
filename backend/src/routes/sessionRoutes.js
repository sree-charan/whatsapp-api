const express = require('express');
const {
  createSession,
  getSessions,
  getSession,
  startSession,
  stopSession,
  deleteSession,
  getSessionStatus,
  getSessionQR,
  updateSessionSettings,
  restartSession,
  clearAuthSession
} = require('../controllers/sessionController');

const {
  authenticateEither,
  checkSessionOwnership,
  checkSessionLimits
} = require('../middleware/auth');

const {
  validateSessionCreation,
  validateSessionId
} = require('../middleware/validation');

const {
  sessionCreationRateLimit,
  qrCodeRateLimit,
  generalRateLimit
} = require('../middleware/rateLimit');

const router = express.Router();

// All session routes require authentication
router.use(authenticateEither);

// Session management routes
router.post('/', sessionCreationRateLimit, checkSessionLimits, validateSessionCreation, createSession);
router.get('/', getSessions);
router.get('/:sessionId', validateSessionId, checkSessionOwnership, getSession);
router.delete('/:sessionId', validateSessionId, checkSessionOwnership, deleteSession);

// Session control routes
router.post('/:sessionId/start', validateSessionId, checkSessionOwnership, startSession);
router.post('/:sessionId/stop', validateSessionId, checkSessionOwnership, stopSession);
router.post('/:sessionId/restart', validateSessionId, checkSessionOwnership, restartSession);
router.post('/:sessionId/clear-auth', validateSessionId, checkSessionOwnership, clearAuthSession);

// Session status and QR code routes
router.get('/:sessionId/status', validateSessionId, checkSessionOwnership, getSessionStatus);
router.get('/:sessionId/qr', qrCodeRateLimit, validateSessionId, checkSessionOwnership, getSessionQR);

// Session settings
router.put('/:sessionId/settings', validateSessionId, checkSessionOwnership, updateSessionSettings);

module.exports = router; 