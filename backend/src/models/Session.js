const { 
  readJsonFile, 
  writeJsonFile, 
  getSessionFilePath, 
  getSessionMetaFilePath,
  getAuthStateDir,
  createUserSessionDir,
  cleanupSession 
} = require('../utils/fileSystem');
const { generateSessionId } = require('../utils/crypto');
const { logger } = require('../utils/logger');
const config = require('../../config/default');

class Session {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.status = data.status || 'inactive'; // inactive, connecting, connected, disconnected, error
    this.qrCode = data.qrCode || null;
    this.phoneNumber = data.phoneNumber || null;
    this.webhookUrl = data.webhookUrl || null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastSeenAt = data.lastSeenAt;
    this.connectionRetries = data.connectionRetries || 0;
    this.maxRetries = data.maxRetries || 3;
    this.settings = data.settings || {
      autoReconnect: true,
      markOnlineOnConnect: true,
      markOnlineOnMessageReceived: true,
      syncFullHistory: false,
      defaultPresence: 'available'
    };
    this.stats = data.stats || {
      messagesReceived: 0,
      messagesSent: 0,
      webhooksSent: 0,
      webhooksFailed: 0,
      lastMessageAt: null,
      connectionUptime: 0
    };
    this.metadata = data.metadata || {};
  }

  /**
   * Create a new session
   */
  static async create(username, options = {}) {
    try {
      const sessionId = generateSessionId();
      const now = new Date().toISOString();
      
      // Create user session directory
      await createUserSessionDir(username);
      
      // Create session object
      const session = new Session({
        id: sessionId,
        username: username,
        status: 'inactive',
        webhookUrl: options.webhookUrl || null,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: null,
        settings: { ...Session.defaultSettings(), ...options.settings },
        stats: Session.defaultStats(),
        metadata: options.metadata || {}
      });
      
      // Save session metadata
      await session.saveMeta();
      
      logger.session(sessionId, `Session created for user: ${username}`);
      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Load session by ID
   */
  static async load(username, sessionId) {
    try {
      const metaFilePath = getSessionMetaFilePath(username, sessionId);
      const sessionData = await readJsonFile(metaFilePath);
      
      if (!sessionData) {
        return null;
      }
      
      return new Session(sessionData);
    } catch (error) {
      logger.error('Error loading session:', error);
      throw error;
    }
  }

  /**
   * Load all sessions for a user
   */
  static async loadAllForUser(username) {
    try {
      const { listUserSessions } = require('../utils/fileSystem');
      const sessionIds = await listUserSessions(username);
      
      const sessions = await Promise.all(
        sessionIds.map(sessionId => Session.load(username, sessionId))
      );
      
      return sessions.filter(session => session !== null);
    } catch (error) {
      logger.error('Error loading user sessions:', error);
      throw error;
    }
  }

  /**
   * Find a session by ID across all users
   */
  static async findBySessionId(sessionId) {
    try {
      const User = require('./User');
      const users = await User.findAll();
      
      for (const user of users) {
        try {
          const session = await Session.load(user.username, sessionId);
          if (session) {
            return session;
          }
        } catch (error) {
          // Continue searching if session not found for this user
          continue;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding session by ID:', error);
      throw error;
    }
  }

  /**
   * Save session metadata
   */
  async saveMeta() {
    try {
      // Ensure user session directory exists first
      await createUserSessionDir(this.username);
      
      const metaFilePath = getSessionMetaFilePath(this.username, this.id);
      const data = this.toJSON();
      await writeJsonFile(metaFilePath, data);
      
      logger.session(this.id, 'Session metadata saved');
    } catch (error) {
      logger.error('Error saving session metadata:', error);
      throw error;
    }
  }

  /**
   * Update session data
   */
  async update(updates) {
    try {
      Object.assign(this, updates, {
        updatedAt: new Date().toISOString()
      });
      
      await this.saveMeta();
      
      logger.session(this.id, 'Session updated');
      return this;
    } catch (error) {
      logger.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Update session status
   */
  async updateStatus(status, metadata = {}) {
    try {
      const updates = {
        status,
        lastSeenAt: new Date().toISOString(),
        metadata: { ...this.metadata, ...metadata }
      };
      
      if (status === 'connected') {
        updates.connectionRetries = 0;
      } else if (status === 'error' || status === 'disconnected') {
        updates.connectionRetries = this.connectionRetries + 1;
      }
      
      await this.update(updates);
      
      logger.session(this.id, `Status updated to: ${status}`);
      return this;
    } catch (error) {
      logger.error('Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Set QR code
   */
  async setQRCode(qrCode) {
    try {
      await this.update({ qrCode, status: 'connecting' });
      logger.session(this.id, 'QR code updated');
    } catch (error) {
      logger.error('Error setting QR code:', error);
      throw error;
    }
  }

  /**
   * Set phone number (after successful connection)
   */
  async setPhoneNumber(phoneNumber) {
    try {
      await this.update({ 
        phoneNumber, 
        status: 'connected',
        qrCode: null 
      });
      logger.session(this.id, `Phone number set: ${phoneNumber}`);
    } catch (error) {
      logger.error('Error setting phone number:', error);
      throw error;
    }
  }

  /**
   * Set webhook URL
   */
  async setWebhookUrl(webhookUrl) {
    try {
      await this.update({ webhookUrl });
      logger.session(this.id, `Webhook URL set: ${webhookUrl}`);
    } catch (error) {
      logger.error('Error setting webhook URL:', error);
      throw error;
    }
  }

  /**
   * Increment message statistics
   */
  async incrementMessageStats(type) {
    try {
      const stats = { ...this.stats };
      
      if (type === 'sent') {
        stats.messagesSent++;
      } else if (type === 'received') {
        stats.messagesReceived++;
      } else if (type === 'webhook_sent') {
        stats.webhooksSent++;
      } else if (type === 'webhook_failed') {
        stats.webhooksFailed++;
      }
      
      stats.lastMessageAt = new Date().toISOString();
      
      await this.update({ stats });
    } catch (error) {
      logger.error('Error incrementing message stats:', error);
      throw error;
    }
  }

  /**
   * Update connection uptime
   */
  async updateUptime() {
    try {
      if (this.status === 'connected' && this.lastSeenAt) {
        const uptime = Date.now() - new Date(this.lastSeenAt).getTime();
        const stats = { ...this.stats };
        stats.connectionUptime += uptime;
        
        await this.update({ stats });
      }
    } catch (error) {
      logger.error('Error updating uptime:', error);
      throw error;
    }
  }

  /**
   * Check if session should auto-reconnect
   */
  shouldAutoReconnect() {
    return this.settings.autoReconnect && 
           this.connectionRetries < this.maxRetries &&
           this.status !== 'connected';
  }

  /**
   * Get auth state directory
   */
  getAuthStateDir() {
    return getAuthStateDir(this.username, this.id);
  }

  /**
   * Get session file path
   */
  getFilePath() {
    return getSessionFilePath(this.username, this.id);
  }

  /**
   * Get session metadata file path
   */
  getMetaFilePath() {
    return getSessionMetaFilePath(this.username, this.id);
  }

  /**
   * Check if session is active
   */
  isActive() {
    return ['connecting', 'connected'].includes(this.status);
  }

  /**
   * Check if session is connected
   */
  isConnected() {
    return this.status === 'connected';
  }

  /**
   * Check if session can be started
   */
  canStart() {
    return ['inactive', 'disconnected', 'error'].includes(this.status);
  }

  /**
   * Delete session
   */
  async delete() {
    try {
      await cleanupSession(this.username, this.id);
      logger.session(this.id, 'Session deleted');
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Get session age in milliseconds
   */
  getAge() {
    return Date.now() - new Date(this.createdAt).getTime();
  }

  /**
   * Get time since last activity
   */
  getInactiveTime() {
    if (!this.lastSeenAt) return null;
    return Date.now() - new Date(this.lastSeenAt).getTime();
  }

  /**
   * Default settings
   */
  static defaultSettings() {
    return {
      autoReconnect: true,
      markOnlineOnConnect: true,
      markOnlineOnMessageReceived: true,
      syncFullHistory: false,
      defaultPresence: 'available'
    };
  }

  /**
   * Default stats
   */
  static defaultStats() {
    return {
      messagesReceived: 0,
      messagesSent: 0,
      webhooksSent: 0,
      webhooksFailed: 0,
      lastMessageAt: null,
      connectionUptime: 0
    };
  }

  /**
   * Convert session to JSON
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      status: this.status,
      qrCode: this.qrCode,
      phoneNumber: this.phoneNumber,
      webhookUrl: this.webhookUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastSeenAt: this.lastSeenAt,
      connectionRetries: this.connectionRetries,
      maxRetries: this.maxRetries,
      settings: this.settings,
      stats: this.stats,
      metadata: this.metadata
    };
  }

  /**
   * Convert session to public JSON (for API responses)
   */
  toPublicJSON() {
    return {
      id: this.id,
      status: this.status,
      phoneNumber: this.phoneNumber,
      webhookUrl: this.webhookUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastSeenAt: this.lastSeenAt,
      connectionRetries: this.connectionRetries,
      settings: this.settings,
      stats: this.stats,
      isActive: this.isActive(),
      isConnected: this.isConnected(),
      age: this.getAge(),
      inactiveTime: this.getInactiveTime()
    };
  }
}

module.exports = Session; 