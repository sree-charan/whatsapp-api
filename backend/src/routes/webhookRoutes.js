const express = require('express');
const { authenticateEither } = require('../middleware/auth');
const { webhookRateLimit, generalRateLimit } = require('../middleware/rateLimit');
const { validateWebhookUrl } = require('../middleware/validation');
const {
  testWebhook,
  updateWebhookConfig,
  getWebhookConfig,
  getWebhookStats,
  clearWebhookQueue,
  getWebhookQueue,
  sendTestWebhook,
  getWebhookEventTypes
} = require('../controllers/webhookController');

const router = express.Router();

// All webhook routes require authentication
router.use(authenticateEither);

// Test webhook endpoint
router.post('/test', generalRateLimit, testWebhook);

// Update webhook configuration
router.put('/config/:sessionId', generalRateLimit, updateWebhookConfig);

// Get webhook configuration
router.get('/config/:sessionId', generalRateLimit, getWebhookConfig);

// Get webhook statistics
router.get('/stats/:sessionId?', generalRateLimit, getWebhookStats);

// Clear webhook queue for session
router.delete('/queue/:sessionId', generalRateLimit, clearWebhookQueue);

// Get webhook queue status
router.get('/queue', generalRateLimit, getWebhookQueue);

// Send test webhook manually
router.post('/send-test/:sessionId', generalRateLimit, sendTestWebhook);

// Get webhook event types
router.get('/event-types', generalRateLimit, getWebhookEventTypes);

// Legacy routes for backward compatibility
router.post('/', webhookRateLimit, validateWebhookUrl, updateWebhookConfig);
router.get('/', generalRateLimit, getWebhookQueue);
router.delete('/', generalRateLimit, clearWebhookQueue);

module.exports = router; 