const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const config = require('../../config/default');

/**
 * Middleware to authenticate JWT tokens (for frontend users)
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const decoded = jwt.verify(token, config.security.jwtSecret);
    const user = await User.findByUsername(decoded.username);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is inactive' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else {
      logger.error('JWT authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

/**
 * Middleware to authenticate API keys (for programmatic access)
 */
const authenticateAPIKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No API key provided' });
    }
    
    const apiKey = authHeader.split(' ')[1]; // Bearer <api_key>
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }
    
    const user = await User.findByApiKey(apiKey);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is inactive' });
    }
    
    req.user = user;
    req.apiKey = apiKey;
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to authenticate either JWT or API key
 */
const authenticateEither = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authentication provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Try to determine if it's a JWT or API key
  // JWT tokens are typically longer and contain dots
  if (token.includes('.')) {
    // Likely a JWT token
    return authenticateJWT(req, res, next);
  } else {
    // Likely an API key
    return authenticateAPIKey(req, res, next);
  }
};

/**
 * Middleware to check if user is admin (for future admin features)
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

/**
 * Middleware to check session ownership
 */
const checkSessionOwnership = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const username = req.user.username;
    
    const Session = require('../models/Session');
    const session = await Session.load(username, sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.username !== username) {
      return res.status(403).json({ error: 'Access denied - not your session' });
    }
    
    req.session = session;
    next();
  } catch (error) {
    logger.error('Session ownership check error:', error);
    return res.status(500).json({ error: 'Access check failed' });
  }
};

/**
 * Middleware to check if user can create more sessions
 */
const checkSessionLimits = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user.canCreateSession()) {
      return res.status(429).json({ 
        error: 'Session limit reached',
        maxSessions: user.maxSessions,
        currentSessions: user.sessions.length
      });
    }
    
    // Check global session limit
    const Session = require('../models/Session');
    const allUsers = await User.findAll(); // We'll need to implement this
    const totalActiveSessions = allUsers.reduce((total, user) => {
      return total + user.getActiveSessionsCount();
    }, 0);
    
    if (totalActiveSessions >= config.sessions.maxGlobal) {
      return res.status(503).json({ 
        error: 'Global session limit reached',
        maxGlobalSessions: config.sessions.maxGlobal
      });
    }
    
    next();
  } catch (error) {
    logger.error('Session limit check error:', error);
    return res.status(500).json({ error: 'Limit check failed' });
  }
};

/**
 * Generate JWT token for user
 */
const generateJWT = (user) => {
  return jwt.sign(
    { 
      username: user.username,
      id: user.id,
      email: user.email
    },
    config.security.jwtSecret,
    { 
      expiresIn: config.security.jwtExpiresIn,
      issuer: 'whatsapp-api-platform',
      audience: 'whatsapp-api-users'
    }
  );
};

/**
 * Verify JWT token
 */
const verifyJWT = (token) => {
  return jwt.verify(token, config.security.jwtSecret);
};

/**
 * Middleware to log API requests
 */
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const user = req.user ? req.user.username : 'anonymous';
    const apiKey = req.apiKey ? req.apiKey.substring(0, 8) + '...' : 'none';
    
    logger.api(
      req.method,
      req.path,
      user,
      `${res.statusCode} - ${duration}ms`,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        apiKey: apiKey,
        body: req.method === 'POST' ? req.body : undefined
      }
    );
  });
  
  next();
};

module.exports = {
  authenticateJWT,
  authenticateAPIKey,
  authenticateEither,
  requireAdmin,
  checkSessionOwnership,
  checkSessionLimits,
  generateJWT,
  verifyJWT,
  logRequest
}; 