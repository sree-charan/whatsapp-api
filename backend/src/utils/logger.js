const winston = require('winston');
const path = require('path');
const fs = require('fs');

const config = require('../../config/default');

// Ensure logs directory exists
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'whatsapp-api' },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    }),
    
    // Write errors to separate file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (config.server.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add custom logging methods
logger.session = (sessionId, message, meta = {}) => {
  logger.info(`[SESSION:${sessionId}] ${message}`, meta);
};

logger.webhook = (url, message, meta = {}) => {
  logger.info(`[WEBHOOK:${url}] ${message}`, meta);
};

logger.auth = (user, message, meta = {}) => {
  logger.info(`[AUTH:${user}] ${message}`, meta);
};

logger.api = (method, path, user, message, meta = {}) => {
  logger.info(`[API:${method} ${path}] [USER:${user}] ${message}`, meta);
};

module.exports = { logger }; 