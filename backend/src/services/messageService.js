const path = require('path');
const { readFileData, writeFileData, ensureDirectoryExists } = require('../utils/fileSystem');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

class MessageService {
  constructor() {
    this.messagesDir = path.join(process.cwd(), '../data/messages');
    this.initializeMessageStorage();
  }

  async initializeMessageStorage() {
    try {
      await ensureDirectoryExists(this.messagesDir);
      logger.info('Message storage initialized');
    } catch (error) {
      logger.error('Failed to initialize message storage:', error);
    }
  }

  /**
   * Store a message
   */
  async storeMessage(sessionId, messageData) {
    try {
      const messageId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      
      const message = {
        id: messageId,
        sessionId,
        timestamp,
        ...messageData
      };

      // Get or create session message file
      const sessionMessages = await this.getSessionMessages(sessionId);
      sessionMessages.push(message);

      // Keep only last 1000 messages per session
      if (sessionMessages.length > 1000) {
        sessionMessages.splice(0, sessionMessages.length - 1000);
      }

      await this.saveSessionMessages(sessionId, sessionMessages);
      
      logger.debug('Message stored', { 
        sessionId, 
        messageId, 
        type: messageData.type 
      });

      return message;
    } catch (error) {
      logger.error('Error storing message:', error);
      throw error;
    }
  }

  /**
   * Store incoming message
   */
  async storeIncomingMessage(sessionId, from, messageContent, messageType = 'text') {
    return await this.storeMessage(sessionId, {
      type: 'incoming',
      from,
      content: messageContent,
      messageType,
      status: 'received'
    });
  }

  /**
   * Store outgoing message
   */
  async storeOutgoingMessage(sessionId, to, messageContent, messageType = 'text', messageId = null) {
    return await this.storeMessage(sessionId, {
      type: 'outgoing',
      to,
      content: messageContent,
      messageType,
      status: 'sent',
      whatsappMessageId: messageId
    });
  }

  /**
   * Update message status
   */
  async updateMessageStatus(sessionId, messageId, status, metadata = {}) {
    try {
      const sessionMessages = await this.getSessionMessages(sessionId);
      const messageIndex = sessionMessages.findIndex(msg => 
        msg.id === messageId || msg.whatsappMessageId === messageId
      );

      if (messageIndex !== -1) {
        sessionMessages[messageIndex].status = status;
        sessionMessages[messageIndex].statusUpdatedAt = new Date().toISOString();
        if (metadata) {
          sessionMessages[messageIndex].metadata = {
            ...sessionMessages[messageIndex].metadata,
            ...metadata
          };
        }

        await this.saveSessionMessages(sessionId, sessionMessages);
        logger.debug('Message status updated', { sessionId, messageId, status });
      }
    } catch (error) {
      logger.error('Error updating message status:', error);
    }
  }

  /**
   * Get message history for a session
   */
  async getMessageHistory(sessionId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        type = null, // 'incoming', 'outgoing', or null for all
        messageType = null, // 'text', 'image', 'document', etc.
        startDate = null,
        endDate = null
      } = options;

      const sessionMessages = await this.getSessionMessages(sessionId);
      
      // Apply filters
      let filteredMessages = sessionMessages;

      if (type && type !== 'all') {
        filteredMessages = filteredMessages.filter(msg => msg.type === type);
      }

      if (messageType) {
        filteredMessages = filteredMessages.filter(msg => msg.messageType === messageType);
      }

      if (startDate) {
        filteredMessages = filteredMessages.filter(msg => 
          new Date(msg.timestamp) >= new Date(startDate)
        );
      }

      if (endDate) {
        filteredMessages = filteredMessages.filter(msg => 
          new Date(msg.timestamp) <= new Date(endDate)
        );
      }

      // Sort by timestamp (newest first)
      filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

      return {
        messages: paginatedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredMessages.length,
          totalPages: Math.ceil(filteredMessages.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting message history:', error);
      throw error;
    }
  }

  /**
   * Get session messages from file
   */
  async getSessionMessages(sessionId) {
    try {
      const filePath = path.join(this.messagesDir, `${sessionId}.json`);
      const data = await readFileData(filePath);
      return data.messages || [];
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // Return empty array if file doesn't exist
      }
      throw error;
    }
  }

  /**
   * Save session messages to file
   */
  async saveSessionMessages(sessionId, messages) {
    try {
      const filePath = path.join(this.messagesDir, `${sessionId}.json`);
      await writeFileData(filePath, {
        sessionId,
        lastUpdated: new Date().toISOString(),
        messageCount: messages.length,
        messages
      });
    } catch (error) {
      logger.error('Error saving session messages:', error);
      throw error;
    }
  }

  /**
   * Delete all messages for a session
   */
  async deleteSessionMessages(sessionId) {
    try {
      const filePath = path.join(this.messagesDir, `${sessionId}.json`);
      const fs = require('fs').promises;
      await fs.unlink(filePath);
      logger.info('Session messages deleted', { sessionId });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error deleting session messages:', error);
      }
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(sessionId = null) {
    try {
      if (sessionId) {
        // Get stats for specific session
        const messages = await this.getSessionMessages(sessionId);
        return {
          total: messages.length,
          incoming: messages.filter(m => m.type === 'incoming').length,
          outgoing: messages.filter(m => m.type === 'outgoing').length,
          byType: messages.reduce((acc, msg) => {
            acc[msg.messageType] = (acc[msg.messageType] || 0) + 1;
            return acc;
          }, {}),
          lastMessage: messages.length > 0 ? messages[messages.length - 1] : null
        };
      } else {
        // Get global stats
        const fs = require('fs').promises;
        const files = await fs.readdir(this.messagesDir);
        const sessionFiles = files.filter(f => f.endsWith('.json'));
        
        let totalMessages = 0;
        let totalIncoming = 0;
        let totalOutgoing = 0;
        const typeStats = {};

        for (const file of sessionFiles) {
          try {
            const sessionId = file.replace('.json', '');
            const messages = await this.getSessionMessages(sessionId);
            totalMessages += messages.length;
            totalIncoming += messages.filter(m => m.type === 'incoming').length;
            totalOutgoing += messages.filter(m => m.type === 'outgoing').length;

            messages.forEach(msg => {
              typeStats[msg.messageType] = (typeStats[msg.messageType] || 0) + 1;
            });
          } catch (error) {
            logger.warn(`Error reading messages for ${file}:`, error.message);
          }
        }

        return {
          totalSessions: sessionFiles.length,
          totalMessages,
          totalIncoming,
          totalOutgoing,
          byType: typeStats
        };
      }
    } catch (error) {
      logger.error('Error getting message stats:', error);
      throw error;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(sessionId, query, options = {}) {
    try {
      const { limit = 50, type = null } = options;
      const messages = await this.getSessionMessages(sessionId);
      
      // Filter by type if specified
      let filteredMessages = type ? 
        messages.filter(msg => msg.type === type) : 
        messages;

      // Search in message content
      const searchResults = filteredMessages.filter(msg => {
        if (!msg.content) return false;
        
        // Search in text content
        if (typeof msg.content === 'string') {
          return msg.content.toLowerCase().includes(query.toLowerCase());
        }
        
        // Search in structured content (like captions)
        if (typeof msg.content === 'object') {
          const searchableText = JSON.stringify(msg.content).toLowerCase();
          return searchableText.includes(query.toLowerCase());
        }
        
        return false;
      });

      // Sort by relevance (newest first for now)
      searchResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return {
        query,
        results: searchResults.slice(0, limit),
        total: searchResults.length
      };
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw error;
    }
  }
}

// Create singleton instance
const messageService = new MessageService();

module.exports = messageService; 