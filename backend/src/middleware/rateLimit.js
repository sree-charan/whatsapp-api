const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');
const config = require('../../config/default');

// In-memory store for rate limiting (for production, consider Redis)
const rateLimitStore = new Map();

/**
 * Custom rate limit store that works with user-specific limits
 */
class CustomRateLimitStore {
  constructor() {
    this.clients = new Map();
  }

  incr(key, cb) {
    const client = this.clients.get(key) || { count: 0, resetTime: Date.now() + config.rateLimit.windowMs };
    
    if (Date.now() > client.resetTime) {
      client.count = 0;
      client.resetTime = Date.now() + config.rateLimit.windowMs;
    }
    
    client.count++;
    this.clients.set(key, client);
    
    const resetTime = new Date(client.resetTime);
    cb(null, client.count, resetTime);
  }

  decrement(key) {
    const client = this.clients.get(key);
    if (client && client.count > 0) {
      client.count--;
      this.clients.set(key, client);
    }
  }

  resetKey(key) {
    this.clients.delete(key);
  }

  resetAll() {
    this.clients.clear();
  }
}

/**
 * General API rate limiter
 */
const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60
    });
  }
});

/**
 * API key rate limiter (more permissive for programmatic access)
 */
const apiKeyRateLimit = rateLimit({
  windowMs: config.rateLimit.apiWindowMs,
  max: config.rateLimit.apiMaxRequests,
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.apiWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  keyGenerator: (req) => {
    // Use API key as the rate limit key
    return req.apiKey || req.ip;
  },
  handler: (req, res) => {
    const apiKey = req.apiKey ? req.apiKey.substring(0, 8) + '...' : 'unknown';
    logger.warn(`API rate limit exceeded for key: ${apiKey}`);
    res.status(429).json({
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: Math.ceil(config.rateLimit.apiWindowMs / 1000)
    });
  }
});

/**
 * User-specific rate limiter for messaging
 */
const createUserMessageRateLimit = (user) => {
  const limits = user.rateLimits || {
    messagesPerMinute: 60,
    messagesPerHour: 1000,
    messagesPerDay: 10000
  };

  return [
    // Per minute limit
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: limits.messagesPerMinute,
      keyGenerator: (req) => `${user.username}:minute`,
      store: new CustomRateLimitStore(),
      handler: (req, res) => {
        logger.warn(`Message rate limit (minute) exceeded for user: ${user.username}`);
        res.status(429).json({
          error: 'Message rate limit exceeded (per minute)',
          retryAfter: 60
        });
      }
    }),
    
    // Per hour limit
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: limits.messagesPerHour,
      keyGenerator: (req) => `${user.username}:hour`,
      store: new CustomRateLimitStore(),
      handler: (req, res) => {
        logger.warn(`Message rate limit (hour) exceeded for user: ${user.username}`);
        res.status(429).json({
          error: 'Message rate limit exceeded (per hour)',
          retryAfter: 60 * 60
        });
      }
    }),
    
    // Per day limit
    rateLimit({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: limits.messagesPerDay,
      keyGenerator: (req) => `${user.username}:day`,
      store: new CustomRateLimitStore(),
      handler: (req, res) => {
        logger.warn(`Message rate limit (day) exceeded for user: ${user.username}`);
        res.status(429).json({
          error: 'Message rate limit exceeded (per day)',
          retryAfter: 24 * 60 * 60
        });
      }
    })
  ];
};

/**
 * Middleware to apply user-specific message rate limits
 */
const userMessageRateLimit = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const rateLimiters = createUserMessageRateLimit(req.user);
  
  // Apply rate limiters sequentially
  let currentIndex = 0;
  
  const applyNextLimiter = (req, res, next) => {
    if (currentIndex >= rateLimiters.length) {
      return next();
    }
    
    const limiter = rateLimiters[currentIndex];
    currentIndex++;
    
    limiter(req, res, (err) => {
      if (err) {
        return next(err);
      }
      applyNextLimiter(req, res, next);
    });
  };
  
  applyNextLimiter(req, res, next);
};

/**
 * Webhook rate limiter
 */
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 webhook updates per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  keyGenerator: (req) => {
    return req.user ? req.user.username : req.ip;
  },
  handler: (req, res) => {
    const user = req.user ? req.user.username : req.ip;
    logger.warn(`Webhook rate limit exceeded for user: ${user}`);
    res.status(429).json({
      error: 'Webhook rate limit exceeded, please try again later.',
      retryAfter: 60
    });
  }
});

/**
 * Session creation rate limiter
 */
const sessionCreationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 session creations per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  keyGenerator: (req) => {
    return req.user ? req.user.username : req.ip;
  },
  handler: (req, res) => {
    const user = req.user ? req.user.username : req.ip;
    logger.warn(`Session creation rate limit exceeded for user: ${user}`);
    res.status(429).json({
      error: 'Session creation rate limit exceeded, please try again later.',
      retryAfter: 60
    });
  }
});

/**
 * QR code generation rate limiter
 */
const qrCodeRateLimit = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5, // 5 QR code requests per 30 seconds
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  keyGenerator: (req) => {
    return req.user ? req.user.username : req.ip;
  },
  handler: (req, res) => {
    const user = req.user ? req.user.username : req.ip;
    logger.warn(`QR code rate limit exceeded for user: ${user}`);
    res.status(429).json({
      error: 'QR code generation rate limit exceeded, please try again later.',
      retryAfter: 30
    });
  }
});

/**
 * File upload rate limiter
 */
const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 file uploads per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  keyGenerator: (req) => {
    return req.user ? req.user.username : req.ip;
  },
  handler: (req, res) => {
    const user = req.user ? req.user.username : req.ip;
    logger.warn(`File upload rate limit exceeded for user: ${user}`);
    res.status(429).json({
      error: 'File upload rate limit exceeded, please try again later.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter for password reset attempts
 */
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: new CustomRateLimitStore(),
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for: ${req.body.email || req.ip}`);
    res.status(429).json({
      error: 'Password reset rate limit exceeded, please try again later.',
      retryAfter: 60 * 60
    });
  }
});

/**
 * Create a dynamic rate limiter based on user type or subscription
 */
const createDynamicRateLimit = (getUserLimits) => {
  return async (req, res, next) => {
    if (!req.user) {
      return generalRateLimit(req, res, next);
    }

    try {
      const userLimits = await getUserLimits(req.user);
      
      const dynamicLimiter = rateLimit({
        windowMs: userLimits.windowMs || config.rateLimit.windowMs,
        max: userLimits.maxRequests || config.rateLimit.maxRequests,
        keyGenerator: (req) => req.user.username,
        store: new CustomRateLimitStore(),
        handler: (req, res) => {
          logger.warn(`Dynamic rate limit exceeded for user: ${req.user.username}`);
          res.status(429).json({
            error: 'Rate limit exceeded for your account type',
            retryAfter: Math.ceil((userLimits.windowMs || config.rateLimit.windowMs) / 1000)
          });
        }
      });

      dynamicLimiter(req, res, next);
    } catch (error) {
      logger.error('Error in dynamic rate limiter:', error);
      generalRateLimit(req, res, next);
    }
  };
};

/**
 * Reset rate limit for a specific key
 */
const resetRateLimit = (key) => {
  const store = new CustomRateLimitStore();
  store.resetKey(key);
  logger.info(`Rate limit reset for key: ${key}`);
};

/**
 * Get rate limit status for a key
 */
const getRateLimitStatus = (key) => {
  const store = new CustomRateLimitStore();
  const client = store.clients.get(key);
  
  if (!client) {
    return { count: 0, resetTime: null };
  }
  
  return {
    count: client.count,
    resetTime: new Date(client.resetTime),
    remaining: Math.max(0, config.rateLimit.maxRequests - client.count)
  };
};

module.exports = {
  generalRateLimit,
  authRateLimit,
  apiKeyRateLimit,
  userMessageRateLimit,
  webhookRateLimit,
  sessionCreationRateLimit,
  qrCodeRateLimit,
  fileUploadRateLimit,
  passwordResetRateLimit,
  createDynamicRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  CustomRateLimitStore
}; 