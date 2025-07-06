/**
 * Format phone number for WhatsApp JID
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number with @s.whatsapp.net suffix
 */
function formatPhoneNumber(phone) {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add @s.whatsapp.net if not already present
  if (!cleaned.includes('@')) {
    return `${cleaned}@s.whatsapp.net`;
  }
  
  return cleaned;
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhoneNumber(phone) {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Extract phone number from WhatsApp JID
 * @param {string} jid - WhatsApp JID
 * @returns {string} Phone number without suffix
 */
function extractPhoneNumber(jid) {
  if (!jid) return '';
  
  return jid.split('@')[0];
}

module.exports = {
  formatPhoneNumber,
  isValidPhoneNumber,
  extractPhoneNumber
}; 