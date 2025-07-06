const whatsappService = require('../services/whatsappService');
const sessionService = require('../services/sessionService');
const messageService = require('../services/messageService');
const { logger } = require('../utils/logger');
const { formatPhoneNumber, isValidPhoneNumber } = require('../utils/phoneNumber');
const path = require('path');
const fs = require('fs').promises;

/**
 * Send a text message
 */
const sendTextMessage = async (req, res) => {
  try {
    const { sessionId, to, message, text } = req.body;
    const username = req.user.username;

    // Handle both 'message' and 'text' parameters for backward compatibility
    const messageText = message || text;
    
    if (!messageText) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required (use either "message" or "text" parameter)'
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use digits only (e.g., "1234567890")'
      });
    }

    // Format phone number for WhatsApp JID
    const formattedTo = formatPhoneNumber(to);

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Send message
    const result = await whatsappService.sendMessage(sessionId, formattedTo, {
      text: messageText
    });

    // Store outgoing message
    await messageService.storeOutgoingMessage(
      sessionId, 
      formattedTo, 
      messageText, 
      'text', 
      result.key.id
    );

    // Increment message statistics
    try {
      await session.incrementMessageStats('sent');
    } catch (error) {
      logger.error('Error incrementing sent message stats:', error);
    }

    logger.info('Text message sent successfully', {
      sessionId,
      to: formattedTo,
      messageId: result.key.id,
      username
    });

    res.json({
      success: true,
      message: 'Text message sent successfully',
      data: {
        messageId: result.key.id,
        to: formattedTo,
        text: messageText,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending text message', {
      error: error.message,
      sessionId: req.body.sessionId,
      to: req.body.to
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send text message',
      message: error.message
    });
  }
};

/**
 * Send an image message
 */
const sendImageMessage = async (req, res) => {
  try {
    const { sessionId, to, image, caption } = req.body;
    const username = req.user.username;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use digits only (e.g., "1234567890")'
      });
    }

    // Format phone number for WhatsApp JID
    const formattedTo = formatPhoneNumber(to);

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Prepare image message
    const imageMessage = {
      image: { url: image },
      caption: caption || ''
    };

    // Send message
    const result = await whatsappService.sendMessage(sessionId, formattedTo, imageMessage);

    // Store outgoing message
    await messageService.storeOutgoingMessage(
      sessionId, 
      formattedTo, 
      { url: image, caption }, 
      'image', 
      result.key.id
    );

    // Increment message statistics
    try {
      await session.incrementMessageStats('sent');
    } catch (error) {
      logger.error('Error incrementing sent message stats:', error);
    }

    logger.info('Image message sent successfully', {
      sessionId,
      to: formattedTo,
      messageId: result.key.id,
      username
    });

    res.json({
      success: true,
      message: 'Image message sent successfully',
      data: {
        messageId: result.key.id,
        to: formattedTo,
        image,
        caption,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending image message', {
      error: error.message,
      sessionId: req.body.sessionId,
      to: req.body.to
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send image message',
      message: error.message
    });
  }
};

/**
 * Send a document message
 */
const sendDocumentMessage = async (req, res) => {
  try {
    const { sessionId, to, document, fileName, caption } = req.body;
    const username = req.user.username;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    if (!document) {
      return res.status(400).json({
        success: false,
        error: 'Document URL is required'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use digits only (e.g., "1234567890")'
      });
    }

    // Format phone number for WhatsApp JID
    const formattedTo = formatPhoneNumber(to);

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Prepare document message
    const documentMessage = {
      document: { url: document },
      fileName: fileName || 'document',
      caption: caption || ''
    };

    // Send message
    const result = await whatsappService.sendMessage(sessionId, formattedTo, documentMessage);

    // Store outgoing message
    await messageService.storeOutgoingMessage(
      sessionId, 
      formattedTo, 
      { url: document, fileName, caption }, 
      'document', 
      result.key.id
    );

    // Increment message statistics
    try {
      await session.incrementMessageStats('sent');
    } catch (error) {
      logger.error('Error incrementing sent message stats:', error);
    }

    logger.info('Document message sent successfully', {
      sessionId,
      to: formattedTo,
      messageId: result.key.id,
      fileName,
      username
    });

    res.json({
      success: true,
      message: 'Document message sent successfully',
      data: {
        messageId: result.key.id,
        to: formattedTo,
        document,
        fileName,
        caption,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending document message', {
      error: error.message,
      sessionId: req.body.sessionId,
      to: req.body.to
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send document message',
      message: error.message
    });
  }
};

/**
 * Send a location message
 */
const sendLocationMessage = async (req, res) => {
  try {
    const { sessionId, to, latitude, longitude, address } = req.body;
    const username = req.user.username;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use digits only (e.g., "1234567890")'
      });
    }

    // Format phone number for WhatsApp JID
    const formattedTo = formatPhoneNumber(to);

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Prepare location message
    const locationMessage = {
      location: {
        degreesLatitude: parseFloat(latitude),
        degreesLongitude: parseFloat(longitude),
        name: address || `${latitude}, ${longitude}`
      }
    };

    // Send message
    const result = await whatsappService.sendMessage(sessionId, formattedTo, locationMessage);

    // Store outgoing message
    await messageService.storeOutgoingMessage(
      sessionId, 
      formattedTo, 
      { latitude, longitude, address }, 
      'location', 
      result.key.id
    );

    // Increment message statistics
    try {
      await session.incrementMessageStats('sent');
    } catch (error) {
      logger.error('Error incrementing sent message stats:', error);
    }

    logger.info('Location message sent successfully', {
      sessionId,
      to: formattedTo,
      messageId: result.key.id,
      coordinates: `${latitude}, ${longitude}`,
      username
    });

    res.json({
      success: true,
      message: 'Location message sent successfully',
      data: {
        messageId: result.key.id,
        to: formattedTo,
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending location message', {
      error: error.message,
      sessionId: req.body.sessionId,
      to: req.body.to
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send location message',
      message: error.message
    });
  }
};

/**
 * Send a contact message
 */
const sendContactMessage = async (req, res) => {
  try {
    const { sessionId, to, contact } = req.body;
    const username = req.user.username;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use digits only (e.g., "1234567890")'
      });
    }

    // Format phone number for WhatsApp JID
    const formattedTo = formatPhoneNumber(to);

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Validate contact data
    if (!contact || !contact.name) {
      return res.status(400).json({
        success: false,
        error: 'Contact name is required'
      });
    }

    // Build vCard from contact data
    let vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}`;
    
    if (contact.organization) {
      vCard += `\nORG:${contact.organization}`;
    }
    
    // Add phone numbers
    if (contact.phones && Array.isArray(contact.phones)) {
      contact.phones.forEach(phone => {
        if (phone.number && phone.number.trim()) {
          const type = phone.type || 'CELL';
          vCard += `\nTEL;TYPE=${type.toUpperCase()}:${phone.number}`;
        }
      });
    }
    
    // Add emails
    if (contact.emails && Array.isArray(contact.emails)) {
      contact.emails.forEach(email => {
        if (email.email && email.email.trim()) {
          const type = email.type || 'INTERNET';
          vCard += `\nEMAIL;TYPE=${type.toUpperCase()}:${email.email}`;
        }
      });
    }
    
    vCard += '\nEND:VCARD';

    const contactMessage = {
      contacts: {
        displayName: contact.name,
        contacts: [{
          vcard: vCard
        }]
      }
    };

    // Send message
    const result = await whatsappService.sendMessage(sessionId, formattedTo, contactMessage);

    // Store outgoing message
    await messageService.storeOutgoingMessage(
      sessionId, 
      formattedTo, 
      contact, 
      'contact', 
      result.key.id
    );

    // Increment message statistics
    try {
      await session.incrementMessageStats('sent');
    } catch (error) {
      logger.error('Error incrementing sent message stats:', error);
    }

    logger.info('Contact message sent successfully', {
      sessionId,
      to: formattedTo,
      messageId: result.key.id,
      contactName: contact.name,
      username
    });

    res.json({
      success: true,
      message: 'Contact message sent successfully',
      data: {
        messageId: result.key.id,
        to: formattedTo,
        contact,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending contact message', {
      error: error.message,
      sessionId: req.body.sessionId,
      to: req.body.to
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send contact message',
      message: error.message
    });
  }
};

/**
 * Send bulk messages
 */
const sendBulkMessages = async (req, res) => {
  try {
    const { sessionId, recipients, message, type = 'text' } = req.body;
    const username = req.user.username;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Validate recipients array
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients must be a non-empty array'
      });
    }

    // Limit bulk message recipients (to prevent abuse)
    const maxRecipients = 50;
    if (recipients.length > maxRecipients) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${maxRecipients} recipients allowed per bulk message`
      });
    }

    const results = [];
    const errors = [];

    // Send messages with delay to prevent rate limiting
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Add delay between messages (1 second)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        let messageData;
        let messageContent;
        let messageType;

        if (type === 'text') {
          messageData = { text: message };
          messageContent = message;
          messageType = 'text';
        } else if (type === 'image') {
          messageData = { 
            image: { url: message.url }, 
            caption: message.caption || '' 
          };
          messageContent = { url: message.url, caption: message.caption };
          messageType = 'image';
        } else if (type === 'document') {
          messageData = { 
            document: { url: message.url }, 
            fileName: message.fileName || 'document',
            caption: message.caption || '' 
          };
          messageContent = { url: message.url, fileName: message.fileName, caption: message.caption };
          messageType = 'document';
        } else {
          throw new Error('Unsupported message type for bulk sending');
        }

        const result = await whatsappService.sendMessage(sessionId, recipient, messageData);
        
        // Store outgoing message
        await messageService.storeOutgoingMessage(
          sessionId, 
          recipient, 
          messageContent, 
          messageType, 
          result.key.id
        );

        // Increment message statistics
        try {
          await session.incrementMessageStats('sent');
        } catch (error) {
          logger.error('Error incrementing sent message stats:', error);
        }
        
        results.push({
          recipient,
          messageId: result.key.id,
          status: 'sent',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logger.error('Error sending message to recipient', {
          sessionId,
          recipient,
          error: error.message,
          stack: error.stack,
          username
        });
        
        errors.push({
          recipient,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    logger.info('Bulk message sending completed', {
      sessionId,
      totalRecipients: recipients.length,
      successful: results.length,
      failed: errors.length,
      username
    });

    res.json({
      success: true,
      message: 'Bulk message sending completed',
      data: {
        total: recipients.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    logger.error('Error sending bulk messages', {
      error: error.message,
      sessionId: req.body.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk messages',
      message: error.message
    });
  }
};

/**
 * Get message history with full functionality
 */
const getMessageHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const username = req.user.username;
    const { 
      page = 1, 
      limit = 50, 
      type, 
      messageType, 
      startDate, 
      endDate,
      search 
    } = req.query;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    let result;

    if (search) {
      // Search messages
      result = {
        ...await messageService.searchMessages(sessionId, search, { 
          limit: parseInt(limit), 
          type 
        }),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } else {
      // Get message history with filters
      result = await messageService.getMessageHistory(sessionId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        messageType,
        startDate,
        endDate
      });
    }

    logger.info('Message history retrieved', {
      sessionId,
      username,
      page,
      limit,
      total: result.pagination?.total || result.total,
      search: search || null
    });

    res.json({
      success: true,
      message: search ? 'Message search completed' : 'Message history retrieved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error getting message history', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get message history',
      message: error.message
    });
  }
};

/**
 * Get message statistics
 */
const getMessageStats = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const username = req.user.username;

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    const stats = await messageService.getMessageStats(sessionId);

    res.json({
      success: true,
      message: 'Message statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Error getting message stats', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get message statistics',
      message: error.message
    });
  }
};

/**
 * Send a video message
 */
const sendVideoMessage = async (req, res) => {
  try {
    const { sessionId, to, video, caption } = req.body;
    const username = req.user.username;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    if (!video) {
      return res.status(400).json({
        success: false,
        error: 'Video URL is required'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use digits only (e.g., "1234567890")'
      });
    }

    // Format phone number for WhatsApp JID
    const formattedTo = formatPhoneNumber(to);

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Prepare video message
    const videoMessage = {
      video: { url: video },
      caption: caption || ''
    };

    // Send message
    const result = await whatsappService.sendMessage(sessionId, formattedTo, videoMessage);

    // Store outgoing message
    await messageService.storeOutgoingMessage(
      sessionId, 
      formattedTo, 
      { url: video, caption }, 
      'video', 
      result.key.id
    );

    // Increment message statistics
    try {
      await session.incrementMessageStats('sent');
    } catch (error) {
      logger.error('Error incrementing sent message stats:', error);
    }

    logger.info('Video message sent successfully', {
      sessionId,
      to: formattedTo,
      messageId: result.key.id,
      username
    });

    res.json({
      success: true,
      message: 'Video message sent successfully',
      data: {
        messageId: result.key.id,
        to: formattedTo,
        video,
        caption,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending video message', {
      error: error.message,
      sessionId: req.body.sessionId,
      to: req.body.to
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send video message',
      message: error.message
    });
  }
};

/**
 * Send an audio message
 */
const sendAudioMessage = async (req, res) => {
  try {
    const { sessionId, to, audio } = req.body;
    const username = req.user.username;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number is required'
      });
    }

    if (!audio) {
      return res.status(400).json({
        success: false,
        error: 'Audio URL is required'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use digits only (e.g., "1234567890")'
      });
    }

    // Format phone number for WhatsApp JID
    const formattedTo = formatPhoneNumber(to);

    // Validate session ownership
    const session = await sessionService.getSession(sessionId);
    if (!session || session.username !== username) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Check if session is connected
    const sessionInfo = whatsappService.getSessionInfo(sessionId);
    if (!sessionInfo || sessionInfo.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Session is not connected',
        currentStatus: sessionInfo?.status || 'inactive'
      });
    }

    // Prepare audio message
    const audioMessage = {
      audio: { url: audio },
      mimetype: 'audio/mp4' // Default mimetype
    };

    // Send message
    const result = await whatsappService.sendMessage(sessionId, formattedTo, audioMessage);

    // Store outgoing message
    await messageService.storeOutgoingMessage(
      sessionId, 
      formattedTo, 
      { url: audio }, 
      'audio', 
      result.key.id
    );

    // Increment message statistics
    try {
      await session.incrementMessageStats('sent');
    } catch (error) {
      logger.error('Error incrementing sent message stats:', error);
    }

    logger.info('Audio message sent successfully', {
      sessionId,
      to: formattedTo,
      messageId: result.key.id,
      username
    });

    res.json({
      success: true,
      message: 'Audio message sent successfully',
      data: {
        messageId: result.key.id,
        to: formattedTo,
        audio,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error sending audio message', {
      error: error.message,
      sessionId: req.body.sessionId,
      to: req.body.to
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send audio message',
      message: error.message
    });
  }
};

module.exports = {
  sendTextMessage,
  sendImageMessage,
  sendDocumentMessage,
  sendLocationMessage,
  sendContactMessage,
  sendBulkMessages,
  getMessageHistory,
  getMessageStats,
  sendVideoMessage,
  sendAudioMessage
}; 