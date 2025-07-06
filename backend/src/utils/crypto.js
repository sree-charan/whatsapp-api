const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../../config/default');
const { logger } = require('./logger');

/**
 * Generate a cryptographically secure random API key
 */
function generateApiKey(length = config.security.apiKeyLength) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a random session ID
 */
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  try {
    const saltRounds = config.security.bcryptRounds;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw error;
  }
}

/**
 * Compare a password with its hash
 */
async function comparePassword(password, hash) {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw error;
  }
}

/**
 * Generate a secure random string
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Create a SHA-256 hash
 */
function createHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  // Require at least 2 of the 4 character types for basic security
  const characterTypeCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (characterTypeCount < 2) {
    errors.push('Password must contain at least two of: uppercase letters, lowercase letters, numbers, or special characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: calculatePasswordScore(password)
  };
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordScore(password) {
  let score = 0;
  
  // Length score
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;
  
  // Character variety score
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;
  
  // Complexity score
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) score += 10;
  
  return Math.min(score, 100);
}

/**
 * Generate a secure OTP
 */
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  
  return otp;
}

/**
 * Time-safe string comparison to prevent timing attacks
 */
function timeSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(text, key) {
  try {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('whatsapp-api', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    logger.error('Error encrypting data:', error);
    throw error;
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData, key) {
  try {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    decipher.setAAD(Buffer.from('whatsapp-api', 'utf8'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting data:', error);
    throw error;
  }
}

module.exports = {
  generateApiKey,
  generateSessionId,
  hashPassword,
  comparePassword,
  generateSecureToken,
  createHash,
  generateUUID,
  validatePasswordStrength,
  calculatePasswordScore,
  generateOTP,
  timeSafeEqual,
  encrypt,
  decrypt
}; 