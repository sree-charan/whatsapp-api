require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    apiKeyLength: parseInt(process.env.API_KEY_LENGTH) || 32,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  sessions: {
    maxPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER) || 10,
    maxGlobal: parseInt(process.env.MAX_GLOBAL_SESSIONS) || 1000,
    qrTimeout: parseInt(process.env.QR_TIMEOUT) || 60000, // 1 minute
    authTimeout: parseInt(process.env.AUTH_TIMEOUT) || 300000 // 5 minutes
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    apiWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 60000,
    apiMaxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 1000
  },
  
  webhook: {
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 1000,
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 10000
  },
  
  storage: {
    dataDir: process.env.DATA_DIR || './data',
    sessionsDir: process.env.SESSIONS_DIR || './data/sessions',
    usersFile: process.env.USERS_FILE || './data/users.json',
    backupDir: process.env.BACKUP_DIR || './data/backups'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
  },
  
  baileys: {
    printQRInTerminal: process.env.PRINT_QR_IN_TERMINAL === 'true',
    defaultConnectionOptions: {
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
      qrTimeout: 60000
    }
  }
}; 