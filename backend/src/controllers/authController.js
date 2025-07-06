const User = require('../models/User');
const { generateJWT } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { comparePassword, hashPassword } = require('../utils/crypto');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    
    // Generate username from email if not provided
    if (!username) {
      username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      // Ensure username is unique by appending timestamp if needed
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        username += Date.now().toString().slice(-6);
      }
    }
    
    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Generate JWT token
    const token = generateJWT(user);
    
    logger.auth(username, 'User registered successfully');
    
    res.status(201).json({
      message: 'User registered successfully',
      user: user.toPublicJSON(),
      token,
      apiKey: user.apiKey
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * User login
 */
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Find user by username or email
    let user;
    if (email) {
      user = await User.findByEmail(email);
    } else if (username) {
      user = await User.findByUsername(username);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }
    
    // Verify password
    const isValid = await user.authenticate(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateJWT(user);
    
    logger.auth(user.username, 'User logged in successfully');
    
    res.json({
      message: 'Login successful',
      user: user.toPublicJSON(),
      token,
      expiresIn: '24h'
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * User logout
 */
const logout = async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // But we can log the action for audit purposes
    const username = req.user ? req.user.username : 'unknown';
    logger.auth(username, 'User logged out');
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Refresh JWT token
 */
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { verifyJWT } = require('../middleware/auth');
    const decoded = verifyJWT(token);
    
    const user = await User.findByUsername(decoded.username);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const newToken = generateJWT(user);
    
    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: '24h'
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      user: user.toPublicJSON(),
      apiKey: user.apiKey,
      stats: user.getStats()
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.passwordHash;
    delete updates.apiKey;
    delete updates.id;
    delete updates.username;
    delete updates.sessions;
    delete updates.createdAt;
    
    await user.update(updates);
    
    logger.auth(user.username, 'Profile updated successfully');
    
    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update password
    await user.update({ passwordHash: newPasswordHash });
    
    logger.auth(user.username, 'Password changed successfully');
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

/**
 * Regenerate API key
 */
const regenerateApiKey = async (req, res) => {
  try {
    const user = req.user;
    
    const newApiKey = await user.regenerateApiKey();
    
    res.json({
      message: 'API key regenerated successfully',
      apiKey: newApiKey
    });
  } catch (error) {
    logger.error('Regenerate API key error:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    const { password } = req.body;
    
    // Verify password for security
    if (password) {
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Password is incorrect' });
      }
    }
    
    // First, clean up all user sessions
    const Session = require('../models/Session');
    const sessions = await Session.loadAllForUser(user.username);
    
    for (const session of sessions) {
      await session.delete();
    }
    
    // Delete user account
    await user.delete();
    
    logger.auth(user.username, 'Account deleted successfully');
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

/**
 * Get API key (for users who forgot it)
 */
const getApiKey = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      apiKey: user.apiKey
    });
  } catch (error) {
    logger.error('Get API key error:', error);
    res.status(500).json({ error: 'Failed to get API key' });
  }
};

/**
 * Verify API key
 */
const verifyApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const user = await User.findByApiKey(apiKey);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }
    
    res.json({
      valid: true,
      user: user.toPublicJSON()
    });
  } catch (error) {
    logger.error('Verify API key error:', error);
    res.status(500).json({ error: 'Failed to verify API key' });
  }
};

/**
 * Get user statistics
 */
const getStats = async (req, res) => {
  try {
    const user = req.user;
    
    // Get session statistics
    const Session = require('../models/Session');
    const sessions = await Session.loadAllForUser(user.username);
    
    const stats = {
      user: user.getStats(),
      sessions: {
        total: sessions.length,
        active: sessions.filter(s => s.isActive()).length,
        connected: sessions.filter(s => s.isConnected()).length,
        byStatus: sessions.reduce((acc, session) => {
          acc[session.status] = (acc[session.status] || 0) + 1;
          return acc;
        }, {})
      },
      messages: sessions.reduce((acc, session) => {
        acc.sent += session.stats.messagesSent;
        acc.received += session.stats.messagesReceived;
        return acc;
      }, { sent: 0, received: 0 }),
      webhooks: sessions.reduce((acc, session) => {
        acc.sent += session.stats.webhooksSent;
        acc.failed += session.stats.webhooksFailed;
        return acc;
      }, { sent: 0, failed: 0 })
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  regenerateApiKey,
  deleteAccount,
  getApiKey,
  verifyApiKey,
  getStats
}; 