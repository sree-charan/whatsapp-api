const { readJsonFile, writeJsonFile, updateJsonFile } = require('../utils/fileSystem');
const { generateApiKey, hashPassword, comparePassword, generateUUID } = require('../utils/crypto');
const { logger } = require('../utils/logger');
const config = require('../../config/default');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.apiKey = data.apiKey;
    this.sessions = data.sessions || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLoginAt = data.lastLoginAt;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.maxSessions = data.maxSessions || config.sessions.maxPerUser;
    this.rateLimits = data.rateLimits || {
      messagesPerMinute: 60,
      messagesPerHour: 1000,
      messagesPerDay: 10000
    };
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    try {
      const users = await readJsonFile(config.storage.usersFile, {});
      
      // Check if username already exists
      if (users[userData.username]) {
        throw new Error('Username already exists');
      }
      
      // Check if email already exists
      const existingUser = Object.values(users).find(user => user.email === userData.email);
      if (existingUser) {
        throw new Error('Email already exists');
      }
      
      // Hash password
      const passwordHash = await hashPassword(userData.password);
      
      // Generate API key
      const apiKey = generateApiKey();
      
      // Create user object
      const user = new User({
        id: generateUUID(),
        username: userData.username,
        email: userData.email,
        passwordHash,
        apiKey,
        sessions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
        isActive: true,
        maxSessions: userData.maxSessions || config.sessions.maxPerUser
      });
      
      // Save user
      users[userData.username] = user.toJSON(true);
      await writeJsonFile(config.storage.usersFile, users);
      
      logger.auth(userData.username, 'User created successfully');
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    try {
      const users = await readJsonFile(config.storage.usersFile, {});
      const userData = users[username];
      
      if (!userData) {
        return null;
      }
      
      return new User(userData);
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find user by API key
   */
  static async findByApiKey(apiKey) {
    try {
      const users = await readJsonFile(config.storage.usersFile, {});
      const userData = Object.values(users).find(user => user.apiKey === apiKey);
      
      if (!userData) {
        return null;
      }
      
      return new User(userData);
    } catch (error) {
      logger.error('Error finding user by API key:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const users = await readJsonFile(config.storage.usersFile, {});
      const userData = Object.values(users).find(user => user.email === email);
      
      if (!userData) {
        return null;
      }
      
      return new User(userData);
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find all users
   */
  static async findAll() {
    try {
      const users = await readJsonFile(config.storage.usersFile, {});
      return Object.values(users).map(userData => new User(userData));
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with password
   */
  async authenticate(password) {
    try {
      if (!this.passwordHash) {
        logger.auth(this.username, 'Authentication failed - no password hash stored');
        return false;
      }
      
      const isValid = await comparePassword(password, this.passwordHash);
      
      if (isValid) {
        await this.updateLastLogin();
        logger.auth(this.username, 'Authentication successful');
      } else {
        logger.auth(this.username, 'Authentication failed - invalid password');
      }
      
      return isValid;
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Update user data
   */
  async update(updates) {
    try {
      const users = await updateJsonFile(config.storage.usersFile, (data) => {
        if (data[this.username]) {
          Object.assign(data[this.username], updates, {
            updatedAt: new Date().toISOString()
          });
          // Only preserve sensitive data if it's not being explicitly updated
          if (!updates.hasOwnProperty('passwordHash')) {
            data[this.username].passwordHash = this.passwordHash;
          }
          if (!updates.hasOwnProperty('apiKey')) {
            data[this.username].apiKey = this.apiKey;
          }
        }
        return data;
      });
      
      // Update instance
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();
      
      logger.auth(this.username, 'User updated successfully');
      return this;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin() {
    const lastLoginAt = new Date().toISOString();
    await this.update({ lastLoginAt });
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey() {
    try {
      const newApiKey = generateApiKey();
      await this.update({ apiKey: newApiKey });
      
      logger.auth(this.username, 'API key regenerated');
      return newApiKey;
    } catch (error) {
      logger.error('Error regenerating API key:', error);
      throw error;
    }
  }

  /**
   * Add session to user
   */
  async addSession(sessionData) {
    try {
      const sessions = [...this.sessions, sessionData];
      await this.update({ sessions });
      
      logger.auth(this.username, `Session added: ${sessionData.id}`);
      return sessionData;
    } catch (error) {
      logger.error('Error adding session:', error);
      throw error;
    }
  }

  /**
   * Remove session from user
   */
  async removeSession(sessionId) {
    try {
      const sessions = this.sessions.filter(session => session.id !== sessionId);
      await this.update({ sessions });
      
      logger.auth(this.username, `Session removed: ${sessionId}`);
      return sessions;
    } catch (error) {
      logger.error('Error removing session:', error);
      throw error;
    }
  }

  /**
   * Update session status
   */
  async updateSession(sessionId, updates) {
    try {
      const sessions = this.sessions.map(session => 
        session.id === sessionId ? { ...session, ...updates } : session
      );
      await this.update({ sessions });
      
      logger.auth(this.username, `Session updated: ${sessionId}`);
      return sessions.find(s => s.id === sessionId);
    } catch (error) {
      logger.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount() {
    return this.sessions.filter(session => session.status === 'connected').length;
  }

  /**
   * Check if user can create more sessions
   */
  canCreateSession() {
    return this.sessions.length < this.maxSessions;
  }

  /**
   * Deactivate user
   */
  async deactivate() {
    await this.update({ isActive: false });
    logger.auth(this.username, 'User deactivated');
  }

  /**
   * Activate user
   */
  async activate() {
    await this.update({ isActive: true });
    logger.auth(this.username, 'User activated');
  }

  /**
   * Delete user
   */
  async delete() {
    try {
      await updateJsonFile(config.storage.usersFile, (data) => {
        delete data[this.username];
        return data;
      });
      
      logger.auth(this.username, 'User deleted');
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.length,
      activeSessions: this.getActiveSessionsCount(),
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive
    };
  }

  /**
   * Convert user to JSON (excluding sensitive data)
   */
  toJSON(includeSensitive = false) {
    const data = {
      id: this.id,
      username: this.username,
      email: this.email,
      sessions: this.sessions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive,
      maxSessions: this.maxSessions,
      rateLimits: this.rateLimits
    };
    
    if (includeSensitive) {
      data.passwordHash = this.passwordHash;
      data.apiKey = this.apiKey;
    }
    
    return data;
  }

  /**
   * Convert user to public JSON (for API responses)
   */
  toPublicJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive,
      maxSessions: this.maxSessions,
      stats: this.getStats()
    };
  }
}

module.exports = User; 