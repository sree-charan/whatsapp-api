const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Session = require('../models/Session');
const { logger } = require('../utils/logger');
const config = require('../../config/default');
const packageJson = require('../../package.json');

/**
 * Get system health check
 */
const getHealthCheck = async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: packageJson.version,
      environment: config.server.env
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};

/**
 * Get API information
 */
const getApiInfo = async (req, res) => {
  try {
    const info = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license,
      endpoints: {
        auth: '/api/auth',
        sessions: '/api/sessions',
        messages: '/api/messages',
        webhook: '/api/webhook',
        status: '/api/status'
      },
      documentation: 'https://github.com/yourusername/whatsapp-api-platform',
      support: 'https://github.com/yourusername/whatsapp-api-platform/issues'
    };
    
    res.json(info);
  } catch (error) {
    logger.error('API info error:', error);
    res.status(500).json({ error: 'Failed to get API information' });
  }
};

/**
 * Get basic system status
 */
const getSystemStatus = async (req, res) => {
  try {
    // Get basic system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get user and session counts
    const users = await User.findAll();
    const totalSessions = users.reduce((total, user) => total + user.sessions.length, 0);
    const activeSessions = users.reduce((total, user) => total + user.getActiveSessionsCount(), 0);
    
    const status = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      },
      process: {
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      application: {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.isActive).length,
        totalSessions: totalSessions,
        activeSessions: activeSessions,
        maxSessions: config.sessions.maxGlobal
      }
    };
    
    res.json(status);
  } catch (error) {
    logger.error('System status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
};

/**
 * Get detailed system statistics
 */
const getSystemStats = async (req, res) => {
  try {
    // Get all users and their sessions
    const users = await User.findAll();
    
    // Calculate detailed statistics
    const userStats = {
      total: users.length,
      active: users.filter(user => user.isActive).length,
      inactive: users.filter(user => !user.isActive).length,
      registeredToday: users.filter(user => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(user.createdAt) >= today;
      }).length,
      lastLoginToday: users.filter(user => {
        if (!user.lastLoginAt) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(user.lastLoginAt) >= today;
      }).length
    };
    
    // Get session statistics from all users
    const allSessions = [];
    for (const user of users) {
      try {
        const userSessions = await Session.loadAllForUser(user.username);
        allSessions.push(...userSessions);
      } catch (error) {
        logger.warn(`Failed to load sessions for user ${user.username}:`, error);
      }
    }
    
    const sessionStats = {
      total: allSessions.length,
      byStatus: allSessions.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {}),
      active: allSessions.filter(s => s.isActive()).length,
      connected: allSessions.filter(s => s.isConnected()).length,
      createdToday: allSessions.filter(session => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(session.createdAt) >= today;
      }).length,
      averageAge: allSessions.length > 0 
        ? allSessions.reduce((sum, session) => sum + session.getAge(), 0) / allSessions.length 
        : 0
    };
    
    const messageStats = allSessions.reduce((acc, session) => {
      acc.sent += session.stats.messagesSent || 0;
      acc.received += session.stats.messagesReceived || 0;
      acc.webhooksSent += session.stats.webhooksSent || 0;
      acc.webhooksFailed += session.stats.webhooksFailed || 0;
      return acc;
    }, { sent: 0, received: 0, webhooksSent: 0, webhooksFailed: 0 });
    
    // System resource usage
    const memoryUsage = process.memoryUsage();
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      hostname: os.hostname(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        process: memoryUsage
      }
    };
    
    // File system usage (data directory)
    let fsStats = null;
    try {
      const dataDir = config.storage.dataDir;
      const stats = await fs.stat(dataDir);
      fsStats = {
        dataDirectory: dataDir,
        accessible: true,
        lastModified: stats.mtime
      };
    } catch (error) {
      fsStats = {
        dataDirectory: config.storage.dataDir,
        accessible: false,
        error: error.message
      };
    }
    
    const response = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: packageJson.version,
      environment: config.server.env,
      users: userStats,
      sessions: sessionStats,
      messages: messageStats,
      system: systemInfo,
      filesystem: fsStats,
      limits: {
        maxSessionsPerUser: config.sessions.maxPerUser,
        maxGlobalSessions: config.sessions.maxGlobal,
        rateLimits: config.rateLimit
      }
    };
    
    res.json(response);
  } catch (error) {
    logger.error('System stats error:', error);
    res.status(500).json({ error: 'Failed to get system statistics' });
  }
};

/**
 * Get performance metrics
 */
const getPerformanceMetrics = async (req, res) => {
  try {
    const startTime = process.hrtime.bigint();
    
    // Test database read performance
    const users = await User.findAll();
    
    // Test file system performance
    const testData = { test: 'performance', timestamp: Date.now() };
    const testFile = path.join(config.storage.dataDir, 'performance-test.json');
    
    await fs.writeFile(testFile, JSON.stringify(testData));
    await fs.readFile(testFile);
    await fs.unlink(testFile);
    
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const metrics = {
      timestamp: new Date().toISOString(),
      executionTime: `${executionTime.toFixed(2)}ms`,
      userCount: users.length,
      memoryUsage: process.memoryUsage(),
      eventLoopDelay: await new Promise((resolve) => {
        const start = process.hrtime.bigint();
        setImmediate(() => {
          const delay = Number(process.hrtime.bigint() - start) / 1000000;
          resolve(delay);
        });
      })
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
};

module.exports = {
  getHealthCheck,
  getApiInfo,
  getSystemStatus,
  getSystemStats,
  getPerformanceMetrics
}; 