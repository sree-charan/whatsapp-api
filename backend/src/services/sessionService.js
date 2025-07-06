const Session = require('../models/Session');
const User = require('../models/User');
const { logger } = require('../utils/logger');

/**
 * Active sessions store (for Baileys connections)
 */
const activeSessions = new Map();

/**
 * Session to username mapping
 */
const sessionUserMap = new Map();

/**
 * Get a session by ID
 */
const getSession = async (sessionId) => {
  try {
    const username = sessionUserMap.get(sessionId);
    if (!username) {
      logger.warn(`No username found for session ${sessionId}`);
      return null;
    }
    const session = await Session.load(username, sessionId);
    return session;
  } catch (error) {
    logger.warn(`Session ${sessionId} not found:`, error.message);
    return null;
  }
};

/**
 * Create a new session
 */
const createSession = async (userId, sessionData) => {
  try {
    const session = await Session.create(userId, sessionData);
    // Track session to user mapping
    sessionUserMap.set(session.id, userId);
    logger.info('Session created', { sessionId: session.id, userId });
    return session;
  } catch (error) {
    logger.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Update a session
 */
const updateSession = async (sessionId, updateData) => {
  try {
    const username = sessionUserMap.get(sessionId);
    if (!username) {
      logger.warn(`No username mapping for session ${sessionId}, skipping update`);
      return null;
    }
    
    const session = await Session.load(username, sessionId);
    if (!session) {
      logger.warn(`Session ${sessionId} not found, removing from mapping and skipping update`);
      // Clean up the orphaned mapping
      sessionUserMap.delete(sessionId);
      return null;
    }
    
    await session.update(updateData);
    logger.info('Session updated', { sessionId, updateData });
    return session;
  } catch (error) {
    logger.error('Error updating session:', error);
    // Don't throw the error to prevent cascade failures
    return null;
  }
};

/**
 * Update session status
 */
const updateSessionStatus = async (sessionId, status, metadata = {}) => {
  try {
    const username = sessionUserMap.get(sessionId);
    if (!username) {
      logger.warn(`No username mapping for session ${sessionId}, skipping status update`);
      return null;
    }
    
    const session = await Session.load(username, sessionId);
    if (!session) {
      logger.warn(`Session ${sessionId} not found, removing from mapping and skipping status update`);
      // Clean up the orphaned mapping
      sessionUserMap.delete(sessionId);
      return null;
    }
    
    await session.updateStatus(status, metadata);
    logger.info('Session status updated', { sessionId, status, metadata });
    return session;
  } catch (error) {
    logger.error('Error updating session status:', error);
    // Don't throw the error to prevent cascade failures
    return null;
  }
};

/**
 * Delete a session
 */
const deleteSession = async (sessionId) => {
  try {
    const username = sessionUserMap.get(sessionId);
    if (!username) {
      throw new Error('Session not found - no username mapping');
    }
    
    const session = await Session.load(username, sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.delete();
    activeSessions.delete(sessionId);
    sessionUserMap.delete(sessionId);
    logger.info('Session deleted', { sessionId });
    return true;
  } catch (error) {
    logger.error('Error deleting session:', error);
    throw error;
  }
};

/**
 * Get all sessions for a user
 */
const getUserSessions = async (userId) => {
  try {
    const sessions = await Session.loadAllForUser(userId);
    return sessions;
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    throw error;
  }
};

/**
 * Register active session
 */
const registerActiveSession = (sessionId, sessionInfo) => {
  activeSessions.set(sessionId, sessionInfo);
  logger.debug('Active session registered', { sessionId });
};

/**
 * Unregister active session
 */
const unregisterActiveSession = (sessionId) => {
  activeSessions.delete(sessionId);
  logger.debug('Active session unregistered', { sessionId });
};

/**
 * Get active session info
 */
const getActiveSession = (sessionId) => {
  return activeSessions.get(sessionId);
};

/**
 * Get all active sessions
 */
const getAllActiveSessions = () => {
  return Array.from(activeSessions.entries()).map(([sessionId, info]) => ({
    sessionId,
    ...info
  }));
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Get all active sessions
    const users = await User.findAll();
    const allSessions = [];
    
    for (const user of users) {
      try {
        const userSessions = await Session.loadAllForUser(user.username);
        allSessions.push(...userSessions);
      } catch (error) {
        logger.error(`Failed to load sessions for user ${user.username}:`, error);
      }
    }
    
    // Update active sessions to disconnected status and close WhatsApp connections
    const activeSessions = allSessions.filter(session => session.isActive());
    
    logger.info(`Updating ${activeSessions.length} active sessions to disconnected status...`);
    
    for (const session of activeSessions) {
      try {
        await session.updateStatus('disconnected', {
          shutdownAt: new Date().toISOString(),
          reason: 'Server shutdown'
        });
        
        // Close Baileys connection if active
        const activeSession = getActiveSession(session.id);
        if (activeSession?.sock) {
          try {
            await activeSession.sock.logout();
            unregisterActiveSession(session.id);
            logger.session(session.id, 'WhatsApp connection closed during shutdown');
          } catch (error) {
            logger.warn(`Failed to close WhatsApp connection for session ${session.id}:`, error.message);
          }
        }
        logger.session(session.id, 'Session marked as disconnected due to shutdown');
      } catch (error) {
        logger.error(`Failed to update session ${session.id}:`, error);
      }
    }
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

/**
 * Initialize session service
 */
const initializeSessionService = async () => {
  try {
    logger.info('Initializing session service...');
    
    // Load all users and their sessions
    const users = await User.findAll();
    let restoredCount = 0;
    
    for (const user of users) {
      try {
        const userSessions = await Session.loadAllForUser(user.username);
        
        // Populate session to username mapping
        for (const session of userSessions) {
          sessionUserMap.set(session.id, user.username);
        }
        
        // Find sessions that were connected before shutdown
        const connectedSessions = userSessions.filter(session => 
          session.status === 'connected' || session.status === 'connecting'
        );
        
        for (const session of connectedSessions) {
          try {
            // Mark previously connected sessions as disconnected
            await session.updateStatus('disconnected', {
              restoreAt: new Date().toISOString(),
              reason: 'Server restart - connection lost'
            });
            
            logger.session(session.id, 'Session marked as disconnected after server restart');
            restoredCount++;
          } catch (error) {
            logger.error(`Failed to restore session ${session.id}:`, error);
          }
        }
      } catch (error) {
        logger.error(`Failed to load sessions for user ${user.username}:`, error);
      }
    }
    
    logger.info(`Session service initialized. Restored ${restoredCount} sessions.`);
  } catch (error) {
    logger.error('Failed to initialize session service:', error);
    throw error;
  }
};

/**
 * Get session statistics
 */
const getSessionStats = async () => {
  try {
    const users = await User.findAll();
    const allSessions = [];
    
    for (const user of users) {
      try {
        const userSessions = await Session.loadAllForUser(user.username);
        allSessions.push(...userSessions);
      } catch (error) {
        logger.warn(`Failed to load sessions for user ${user.username}:`, error);
      }
    }
    
    return {
      total: allSessions.length,
      active: allSessions.filter(s => s.isActive()).length,
      connected: allSessions.filter(s => s.isConnected()).length,
      byStatus: allSessions.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {}),
      byUser: users.map(user => ({
        username: user.username,
        sessionCount: user.sessions.length,
        activeCount: user.getActiveSessionsCount()
      }))
    };
  } catch (error) {
    logger.error('Error getting session stats:', error);
    throw error;
  }
};

/**
 * Cleanup inactive sessions (maintenance task)
 */
const cleanupInactiveSessions = async () => {
  try {
    logger.info('Starting inactive session cleanup...');
    
    const users = await User.findAll();
    let cleanedCount = 0;
    
    for (const user of users) {
      try {
        const userSessions = await Session.loadAllForUser(user.username);
        
        for (const session of userSessions) {
          // Clean up sessions inactive for more than 24 hours
          const inactiveTime = session.getInactiveTime();
          if (inactiveTime && inactiveTime > 24 * 60 * 60 * 1000) { // 24 hours
            if (session.status === 'disconnected' || session.status === 'error') {
              await session.delete();
              await user.removeSession(session.id);
              cleanedCount++;
              logger.session(session.id, 'Cleaned up inactive session');
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to cleanup sessions for user ${user.username}:`, error);
      }
    }
    
    logger.info(`Session cleanup completed. Cleaned ${cleanedCount} sessions.`);
    return cleanedCount;
  } catch (error) {
    logger.error('Error during session cleanup:', error);
    throw error;
  }
};

/**
 * Health check for sessions
 */
const healthCheckSessions = async () => {
  try {
    const stats = await getSessionStats();
    
    return {
      healthy: true,
      stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Session health check failed:', error);
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  // Session CRUD operations
  getSession,
  createSession,
  updateSession,
  updateSessionStatus,
  deleteSession,
  getUserSessions,
  
  // Active session management
  registerActiveSession,
  unregisterActiveSession,
  getActiveSession,
  getAllActiveSessions,
  
  // Service lifecycle
  gracefulShutdown,
  initializeSessionService,
  
  // Utilities
  getSessionStats,
  cleanupInactiveSessions,
  healthCheckSessions,
  activeSessions
}; 