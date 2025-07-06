const Session = require('../models/Session');
const User = require('../models/User');
const whatsappService = require('../services/whatsappService');
const sessionService = require('../services/sessionService');
const { logger } = require('../utils/logger');

/**
 * Create a new session
 */
const createSession = async (req, res) => {
  try {
    const user = req.user;
    const { webhookUrl, settings, metadata } = req.body;
    
    // Create new session using sessionService (this establishes username mapping)
    const session = await sessionService.createSession(user.username, {
      webhookUrl,
      settings,
      metadata
    });
    
    // Add session to user
    await user.addSession({
      id: session.id,
      status: session.status,
      createdAt: session.createdAt
    });
    
    logger.session(session.id, `Session created for user: ${user.username}`);
    
    res.status(201).json({
      message: 'Session created successfully',
      session: session.toPublicJSON()
    });
  } catch (error) {
    logger.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

/**
 * Get all sessions for the authenticated user
 */
const getSessions = async (req, res) => {
  try {
    const user = req.user;
    
    // Load all sessions for the user
    const sessions = await Session.loadAllForUser(user.username);
    
    res.json({
      sessions: sessions.map(session => session.toPublicJSON()),
      total: sessions.length,
      active: sessions.filter(s => s.isActive()).length,
      connected: sessions.filter(s => s.isConnected()).length
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

/**
 * Get a specific session
 */
const getSession = async (req, res) => {
  try {
    const session = req.session; // Set by checkSessionOwnership middleware
    
    res.json({
      session: session.toPublicJSON()
    });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
};

/**
 * Start a WhatsApp session
 */
const startSession = async (req, res) => {
  try {
    const session = req.session;
    const user = req.user;
    
    // Check if session is marked as connected but not in WhatsApp service memory
    // This happens after server restarts
    if (session.isConnected()) {
      const whatsappInfo = whatsappService.getSessionInfo(session.id);
      if (!whatsappInfo) {
        logger.session(session.id, 'Session marked as connected but not in WhatsApp service. Resetting status.');
        await session.updateStatus('disconnected', { 
          reason: 'server_restart_sync' 
        });
      } else {
        return res.status(400).json({ 
          error: 'Session is already connected',
          currentStatus: session.status
        });
      }
    }
    
    if (!session.canStart()) {
      return res.status(400).json({ 
        error: 'Session cannot be started',
        currentStatus: session.status
      });
    }
    
    // Initialize WhatsApp connection
    await whatsappService.initializeSession(session.id, user.username);
    
    // Update session status
    await session.updateStatus('connecting', { 
      startedAt: new Date().toISOString() 
    });
    
    logger.session(session.id, 'WhatsApp session initialization started');
    
    res.json({
      message: 'WhatsApp session initialization started',
      session: session.toPublicJSON(),
      note: 'QR code will be generated shortly. Use /sessions/:id/qr to get it.'
    });
  } catch (error) {
    logger.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session: ' + error.message });
  }
};

/**
 * Stop a WhatsApp session
 */
const stopSession = async (req, res) => {
  try {
    const session = req.session;
    
    if (!session.isActive()) {
      return res.status(400).json({ 
        error: 'Session is not active',
        currentStatus: session.status
      });
    }
    
    // Disconnect WhatsApp session
    await whatsappService.disconnectSession(session.id);
    
    // Update session status
    await session.updateStatus('disconnected', { 
      stoppedAt: new Date().toISOString() 
    });
    
    logger.session(session.id, 'WhatsApp session stopped');
    
    res.json({
      message: 'WhatsApp session stopped successfully',
      session: session.toPublicJSON()
    });
  } catch (error) {
    logger.error('Stop session error:', error);
    res.status(500).json({ error: 'Failed to stop session: ' + error.message });
  }
};

/**
 * Delete a session
 */
const deleteSession = async (req, res) => {
  try {
    const session = req.session;
    const user = req.user;
    
    // Stop session if it's active
    if (session.isActive()) {
      await session.updateStatus('disconnected');
    }
    
    // Remove from user's session list
    await user.removeSession(session.id);
    
    // Delete session files
    await session.delete();
    
    logger.session(session.id, 'Session deleted');
    
    res.json({
      message: 'Session deleted successfully'
    });
  } catch (error) {
    logger.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

/**
 * Get session status
 */
const getSessionStatus = async (req, res) => {
  try {
    const session = req.session;
    
    // Get real-time status from WhatsApp service
    const whatsappInfo = whatsappService.getSessionInfo(session.id);
    
    const status = {
      id: session.id,
      status: session.status,
      phoneNumber: session.phoneNumber,
      lastSeenAt: session.lastSeenAt,
      connectionRetries: session.connectionRetries,
      isActive: session.isActive(),
      isConnected: session.isConnected(),
      uptime: session.getAge(),
      stats: session.stats,
      whatsapp: whatsappInfo
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Get session status error:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
};

/**
 * Get QR code for session
 */
const getSessionQR = async (req, res) => {
  try {
    const session = req.session;
    
    if (session.status !== 'connecting' && session.status !== 'qr_generated') {
      return res.status(400).json({ 
        error: 'QR code only available when session is connecting or QR generated',
        currentStatus: session.status
      });
    }
    
    try {
      // Get QR code from WhatsApp service
      const qrData = await whatsappService.getQRCode(session.id);
      
      res.json({
        qr: qrData.qr, // Frontend expects 'qr' field
        qrCode: qrData.qr, // Keep backward compatibility
        timestamp: qrData.timestamp,
        expiresAt: new Date(qrData.timestamp + 120000).toISOString() // 2 minutes
      });
    } catch (error) {
      res.status(404).json({ 
        error: 'QR code not available',
        message: error.message
      });
    }
  } catch (error) {
    logger.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
};

/**
 * Update session settings
 */
const updateSessionSettings = async (req, res) => {
  try {
    const session = req.session;
    const { settings } = req.body;
    
    await session.update({ 
      settings: { ...session.settings, ...settings } 
    });
    
    logger.session(session.id, 'Session settings updated');
    
    res.json({
      message: 'Session settings updated successfully',
      session: session.toPublicJSON()
    });
  } catch (error) {
    logger.error('Update session settings error:', error);
    res.status(500).json({ error: 'Failed to update session settings' });
  }
};

/**
 * Restart a session
 */
const restartSession = async (req, res) => {
  try {
    const session = req.session;
    
    // Restart WhatsApp session
    await whatsappService.restartSession(session.id);
    
    // Reset connection retries
    await session.update({ 
      connectionRetries: 0,
      qrCode: null 
    });
    
    // Update status
    await session.updateStatus('connecting', { 
      restartedAt: new Date().toISOString() 
    });
    
    logger.session(session.id, 'WhatsApp session restarted');
    
    res.json({
      message: 'WhatsApp session restarted successfully',
      session: session.toPublicJSON(),
      note: 'New QR code will be generated shortly'
    });
  } catch (error) {
    logger.error('Restart session error:', error);
    res.status(500).json({ error: 'Failed to restart session: ' + error.message });
  }
};

/**
 * Clear auth state for a session (force fresh QR)
 */
const clearAuthSession = async (req, res) => {
  try {
    logger.info('clearAuthSession controller called', { sessionId: req.params.sessionId });
    
    const session = req.session;
    
    if (!session) {
      logger.error('Session not found in request', { sessionId: req.params.sessionId });
      return res.status(404).json({ error: 'Session not found' });
    }
    
    logger.session(session.id, 'Starting auth clear and restart');
    
    // Clear auth state and restart session
    await whatsappService.clearAuthAndRestart(session.id);
    
    logger.session(session.id, 'Auth cleared and session restarted, updating database');
    
    // Reset connection retries
    await session.update({ 
      connectionRetries: 0,
      qrCode: null 
    });
    
    // Update status
    await session.updateStatus('connecting', { 
      authClearedAt: new Date().toISOString(),
      restartedAt: new Date().toISOString() 
    });
    
    logger.session(session.id, 'WhatsApp session auth cleared and restarted successfully');
    
    res.json({
      message: 'Session auth cleared and restarted successfully',
      session: session.toPublicJSON(),
      note: 'Fresh QR code will be generated shortly'
    });
  } catch (error) {
    logger.error('Clear auth session error:', error);
    res.status(500).json({ error: 'Failed to clear auth and restart session: ' + error.message });
  }
};

module.exports = {
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
}; 