const { body, param, query, validationResult } = require('express-validator');
const { validatePasswordStrength } = require('../utils/crypto');
const { logger } = require('../utils/logger');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    logger.warn('Validation errors:', errorMessages);
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
  
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  // Either username or email must be provided
  body()
    .custom((value, { req }) => {
      if (!req.body.username && !req.body.email) {
        throw new Error('Either username or email must be provided');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Session creation validation
 */
const validateSessionCreation = [
  body('webhookUrl')
    .optional()
    .isURL()
    .withMessage('Webhook URL must be a valid URL'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
  
  body('settings.autoReconnect')
    .optional()
    .isBoolean()
    .withMessage('autoReconnect must be a boolean'),
  
  body('settings.markOnlineOnConnect')
    .optional()
    .isBoolean()
    .withMessage('markOnlineOnConnect must be a boolean'),
  
  body('settings.syncFullHistory')
    .optional()
    .isBoolean()
    .withMessage('syncFullHistory must be a boolean'),
  
  body('settings.defaultPresence')
    .optional()
    .isIn(['available', 'unavailable', 'composing', 'recording', 'paused'])
    .withMessage('defaultPresence must be one of: available, unavailable, composing, recording, paused'),
  
  handleValidationErrors
];

/**
 * Session ID parameter validation
 */
const validateSessionId = [
  param('sessionId')
    .isLength({ min: 32, max: 32 })
    .withMessage('Session ID must be 32 characters long')
    .matches(/^[a-f0-9]+$/)
    .withMessage('Session ID must be a valid hexadecimal string'),
  
  handleValidationErrors
];

/**
 * Message sending validation
 */
const validateSendMessage = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
  
  body('message')
    .optional()
    .isLength({ min: 1, max: 4096 })
    .withMessage('Message must be between 1 and 4096 characters'),
  
  body('media')
    .optional()
    .isObject()
    .withMessage('Media must be an object'),
  
  body('media.type')
    .if(body('media').exists())
    .isIn(['image', 'video', 'audio', 'document'])
    .withMessage('Media type must be one of: image, video, audio, document'),
  
  body('media.url')
    .if(body('media').exists())
    .isURL()
    .withMessage('Media URL must be a valid URL'),
  
  body('media.caption')
    .optional()
    .isLength({ max: 1024 })
    .withMessage('Media caption must be less than 1024 characters'),
  
  // At least one of message or media must be provided
  body()
    .custom((value, { req }) => {
      if (!req.body.message && !req.body.media) {
        throw new Error('Either message or media must be provided');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Webhook URL validation
 */
const validateWebhookUrl = [
  body('webhookUrl')
    .isURL()
    .withMessage('Webhook URL must be a valid URL')
    .custom((value) => {
      // Check if URL is HTTPS in production
      if (process.env.NODE_ENV === 'production' && !value.startsWith('https://')) {
        throw new Error('Webhook URL must use HTTPS in production');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Phone number validation (for various endpoints)
 */
const validatePhoneNumber = [
  body('phoneNumber')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
  
  handleValidationErrors
];

/**
 * User update validation
 */
const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('maxSessions')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max sessions must be between 1 and 50'),
  
  body('rateLimits')
    .optional()
    .isObject()
    .withMessage('Rate limits must be an object'),
  
  body('rateLimits.messagesPerMinute')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Messages per minute must be between 1 and 1000'),
  
  body('rateLimits.messagesPerHour')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Messages per hour must be between 1 and 10000'),
  
  body('rateLimits.messagesPerDay')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Messages per day must be between 1 and 100000'),
  
  handleValidationErrors
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .custom((value) => {
      const validation = validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Contact validation
 */
const validateContact = [
  body('name')
    .notEmpty()
    .withMessage('Contact name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact name must be between 1 and 100 characters'),
  
  body('phoneNumber')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
  
  handleValidationErrors
];

/**
 * Bulk message validation
 */
const validateBulkMessage = [
  body('recipients')
    .isArray({ min: 1, max: 100 })
    .withMessage('Recipients must be an array with 1-100 entries'),
  
  body('recipients.*')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('All phone numbers must be in E.164 format'),
  
  body('message')
    .optional()
    .isLength({ min: 1, max: 4096 })
    .withMessage('Message must be between 1 and 4096 characters'),
  
  body('media')
    .optional()
    .isObject()
    .withMessage('Media must be an object'),
  
  // At least one of message or media must be provided
  body()
    .custom((value, { req }) => {
      if (!req.body.message && !req.body.media) {
        throw new Error('Either message or media must be provided');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Custom validation function for file uploads
 */
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Check file size (10MB limit)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size too large (max 10MB)' });
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'application/pdf'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateSessionCreation,
  validateSessionId,
  validateSendMessage,
  validateWebhookUrl,
  validatePagination,
  validatePhoneNumber,
  validateUserUpdate,
  validatePasswordChange,
  validateContact,
  validateBulkMessage,
  validateFileUpload
}; 