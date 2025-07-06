const webhookService = require('../services/webhookService');
const sessionService = require('../services/sessionService');
const { logger } = require('../utils/logger');

/**
 * Test webhook endpoint
 */
const testWebhook = async (req, res) => {
  try {
    const { sessionId, webhookUrl } = req.body;
    const username = req.user.username;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Test webhook URL
    const testUrl = webhookUrl || session.webhookUrl;
    if (!testUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL is required'
      });
    }

    const result = await webhookService.testWebhook(sessionId, testUrl);

    if (result.success) {
      res.json({
        success: true,
        message: 'Webhook test successful',
        data: {
          statusCode: result.statusCode,
          testedUrl: testUrl,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Webhook test failed',
        message: result.error,
        data: {
          testedUrl: testUrl,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    logger.error('Error testing webhook', {
      error: error.message,
      sessionId: req.body.sessionId,
      username: req.user.username
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to test webhook',
      message: error.message
    });
  }
};

/**
 * Update webhook configuration
 */
const updateWebhookConfig = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { webhookUrl, events, retryConfig } = req.body;
    const username = req.user.username;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Update webhook configuration
    const updateData = {};
    
    if (webhookUrl !== undefined) {
      updateData.webhookUrl = webhookUrl;
    }
    
    if (events !== undefined) {
      updateData.webhookEvents = events;
    }
    
    if (retryConfig !== undefined) {
      updateData.webhookRetryConfig = retryConfig;
    }

    await sessionService.updateSession(sessionId, updateData);

    logger.info('Webhook configuration updated', {
      sessionId,
      username,
      webhookUrl: webhookUrl || session.webhookUrl
    });

    res.json({
      success: true,
      message: 'Webhook configuration updated successfully',
      data: {
        sessionId,
        webhookUrl: webhookUrl || session.webhookUrl,
        events: events || session.webhookEvents,
        retryConfig: retryConfig || session.webhookRetryConfig
      }
    });

  } catch (error) {
    logger.error('Error updating webhook config', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update webhook configuration',
      message: error.message
    });
  }
};

/**
 * Get webhook configuration
 */
const getWebhookConfig = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const username = req.user.username;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Webhook configuration retrieved successfully',
      data: {
        sessionId,
        webhookUrl: session.webhookUrl,
        events: session.webhookEvents || [],
        retryConfig: session.webhookRetryConfig || {},
        stats: session.webhookStats || {}
      }
    });

  } catch (error) {
    logger.error('Error getting webhook config', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook configuration',
      message: error.message
    });
  }
};

/**
 * Get webhook statistics
 */
const getWebhookStats = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const username = req.user.username;

    // Validate session ownership if sessionId is provided
    if (sessionId) {
      const session = await sessionService.getSession(sessionId);
      if (!session || session.username !== username) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        });
      }

      // Return session-specific stats
      res.json({
        success: true,
        message: 'Webhook statistics retrieved successfully',
        data: {
          sessionId,
          stats: session.webhookStats || {},
          queueStatus: webhookService.getQueueStatus()
        }
      });
    } else {
      // Return global stats
      res.json({
        success: true,
        message: 'Global webhook statistics retrieved successfully',
        data: {
          globalStats: webhookService.getWebhookStats(),
          queueStatus: webhookService.getQueueStatus()
        }
      });
    }

  } catch (error) {
    logger.error('Error getting webhook stats', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook statistics',
      message: error.message
    });
  }
};

/**
 * Clear webhook queue for session
 */
const clearWebhookQueue = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const username = req.user.username;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Clear webhook queue for the session
    webhookService.clearSessionQueue(sessionId);

    logger.info('Webhook queue cleared', {
      sessionId,
      username
    });

    res.json({
      success: true,
      message: 'Webhook queue cleared successfully',
      data: {
        sessionId,
        clearedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error clearing webhook queue', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear webhook queue',
      message: error.message
    });
  }
};

/**
 * Get webhook queue status
 */
const getWebhookQueue = async (req, res) => {
  try {
    const username = req.user.username;

    // Get queue status
    const queueStatus = webhookService.getQueueStatus();

    res.json({
      success: true,
      message: 'Webhook queue status retrieved successfully',
      data: queueStatus
    });

  } catch (error) {
    logger.error('Error getting webhook queue', {
      error: error.message,
      username: req.user.username
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook queue status',
      message: error.message
    });
  }
};

/**
 * Send test webhook manually
 */
const sendTestWebhook = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, data } = req.body;
    const username = req.user.username;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if webhook URL is configured
    if (!session.webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL not configured for this session'
      });
    }

    // Send test webhook
    const testData = data || {
      message: 'This is a manual test webhook',
      timestamp: new Date().toISOString()
    };

    await webhookService.addWebhook(sessionId, eventType || 'test.manual', testData, 'high');

    logger.info('Manual test webhook queued', {
      sessionId,
      eventType: eventType || 'test.manual',
      username
    });

    res.json({
      success: true,
      message: 'Test webhook queued successfully',
      data: {
        sessionId,
        eventType: eventType || 'test.manual',
        queuedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending test webhook', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send test webhook',
      message: error.message
    });
  }
};

/**
 * Get webhook event types
 */
const getWebhookEventTypes = async (req, res) => {
  try {
    const eventTypes = [
      {
        type: 'message.received',
        description: 'Triggered when a message is received',
        priority: 'high'
      },
      {
        type: 'message.sent',
        description: 'Triggered when a message is sent',
        priority: 'normal'
      },
      {
        type: 'message.status',
        description: 'Triggered when message status changes (delivered, read, etc.)',
        priority: 'normal'
      },
      {
        type: 'session.status',
        description: 'Triggered when session status changes',
        priority: 'high'
      },
      {
        type: 'connection.status',
        description: 'Triggered when connection status changes',
        priority: 'high'
      },
      {
        type: 'presence.update',
        description: 'Triggered when contact presence changes',
        priority: 'low'
      },
      {
        type: 'group.event',
        description: 'Triggered for group events (join, leave, etc.)',
        priority: 'normal'
      },
      {
        type: 'contact.update',
        description: 'Triggered when contact information changes',
        priority: 'low'
      },
      {
        type: 'webhook.test',
        description: 'Test webhook event',
        priority: 'normal'
      }
    ];

    res.json({
      success: true,
      message: 'Webhook event types retrieved successfully',
      data: {
        eventTypes,
        total: eventTypes.length
      }
    });

  } catch (error) {
    logger.error('Error getting webhook event types', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook event types',
      message: error.message
    });
  }
};

module.exports = {
  testWebhook,
  updateWebhookConfig,
  getWebhookConfig,
  getWebhookStats,
  clearWebhookQueue,
  getWebhookQueue,
  sendTestWebhook,
  getWebhookEventTypes
}; 