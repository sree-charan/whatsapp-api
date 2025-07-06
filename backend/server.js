const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { logger } = require('./src/utils/logger');
const { initializeDataStructure } = require('./src/utils/fileSystem');
const { gracefulShutdown, initializeSessionService } = require('./src/services/sessionService');
const messageService = require('./src/services/messageService');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const statusRoutes = require('./src/routes/statusRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting and forwarded headers
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy in production
} else {
  app.set('trust proxy', 'loopback'); // Only trust loopback addresses in development
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://3000.sreecharan.in',
    'http://3000.sreecharan.in'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for localhost and private IPs in development
    const ip = req.ip;
    if (process.env.NODE_ENV !== 'production') {
      return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
    }
    return false;
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/status', statusRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize data structure and start server
async function startServer() {
  try {
    await initializeDataStructure();
    logger.info('Data structure initialized');

    // Initialize session service
    await initializeSessionService();
    logger.info('Session service initialized');

    // Message service initializes itself in constructor
    logger.info('Message service initialized');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer(); 