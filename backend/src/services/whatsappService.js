const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../utils/logger');
const { ensureDirectoryExists } = require('../utils/fileSystem');
const sessionService = require('./sessionService');
const webhookService = require('./webhookService');
const messageService = require('./messageService');

class WhatsAppService {
    constructor() {
        this.activeSessions = new Map();
        this.qrCodeData = new Map();
        this.connectionAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
    }

    async initializeSession(sessionId, userId) {
        try {
            logger.info('Initializing WhatsApp session', { sessionId, userId });

            // Check if session already exists and is actually connected
            if (this.activeSessions.has(sessionId)) {
                const existingSession = this.activeSessions.get(sessionId);
                // Only throw error if session is truly active with a valid connection
                if (existingSession.sock?.user?.id && existingSession.status === 'connected') {
                    throw new Error('Session already active and connected');
                }
                // If session exists but not connected, clean it up first
                logger.info('Cleaning up existing inactive session', { sessionId });
                await this.cleanupSession(sessionId, false);
            }

            // Create auth directory for session
            const authDir = path.join(process.cwd(), 'data/auth', sessionId);
            await ensureDirectoryExists(authDir);

            // Initialize auth state
            const { state, saveCreds } = await useMultiFileAuthState(authDir);
            const { version } = await fetchLatestBaileysVersion();

            // Create Baileys-compatible logger
            const baileysLogger = {
                trace: (msg) => logger.debug(msg),
                debug: (msg) => logger.debug(msg),
                info: (msg) => logger.info(msg),
                warn: (msg) => logger.warn(msg),
                error: (msg) => logger.error(msg),
                child: () => baileysLogger
            };

            // Create WhatsApp socket
            const sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: baileysLogger,
                browser: ['WhatsApp API', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 30000,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                markOnlineOnConnect: false,
                fireInitQueries: true,
                emitOwnEvents: true,
                getUserDevicesFromServer: false,
                shouldIgnoreJid: () => false,
                shouldSyncHistoryMessage: () => false,
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(
                        message.buttonsMessage ||
                        message.listMessage ||
                        message.templateMessage
                    );
                    if (requiresPatch) {
                        message = {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: {
                                        deviceListMetadataVersion: 2,
                                        deviceListMetadata: {}
                                    },
                                    ...message
                                }
                            }
                        };
                    }
                    return message;
                }
            });

            // Store session info
            const sessionInfo = {
                sock,
                userId,
                sessionId,
                authDir,
                saveCreds,
                reconnectAttempts: 0,
                lastActivity: Date.now(),
                status: 'connecting',
                connectedAt: null,
                disconnectedAt: null
            };

            this.activeSessions.set(sessionId, sessionInfo);

            // Set up event handlers
            await this.setupEventHandlers(sessionId, sessionInfo);

            // Update session status - only if session exists
            try {
                await sessionService.updateSessionStatus(sessionId, 'connecting');
            } catch (error) {
                logger.warn('Could not update session status, session may not exist in database', { sessionId });
            }

            logger.info('WhatsApp session initialized successfully', { sessionId, userId });
            return sessionInfo;

        } catch (error) {
            logger.error('Error initializing WhatsApp session', { 
                sessionId, 
                userId, 
                error: error.message 
            });
            
            // Clean up failed session
            await this.cleanupSession(sessionId);
            throw error;
        }
    }

    async setupEventHandlers(sessionId, sessionInfo) {
        const { sock } = sessionInfo;

        // Connection updates
        sock.ev.on('connection.update', async (update) => {
            await this.handleConnectionUpdate(sessionId, update);
        });

        // Credentials update
        sock.ev.on('creds.update', async () => {
            await sessionInfo.saveCreds();
        });

        // Messages
        sock.ev.on('messages.upsert', async (messageUpdate) => {
            await this.handleIncomingMessages(sessionId, messageUpdate);
        });

        // Message updates (read receipts, etc.)
        sock.ev.on('messages.update', async (updates) => {
            await this.handleMessageUpdates(sessionId, updates);
        });

        // Presence updates
        sock.ev.on('presence.update', async (update) => {
            await this.handlePresenceUpdate(sessionId, update);
        });

        // Contacts update
        sock.ev.on('contacts.update', async (contacts) => {
            await this.handleContactsUpdate(sessionId, contacts);
        });

        // Chats update
        sock.ev.on('chats.update', async (chats) => {
            await this.handleChatsUpdate(sessionId, chats);
        });

        // Groups update
        sock.ev.on('groups.update', async (groups) => {
            await this.handleGroupsUpdate(sessionId, groups);
        });

        // Blocklist update
        sock.ev.on('blocklist.update', async (update) => {
            await this.handleBlocklistUpdate(sessionId, update);
        });

        logger.info('Event handlers set up for session', { sessionId });
    }

    async handleConnectionUpdate(sessionId, update) {
        const { connection, lastDisconnect, qr } = update;
        const sessionInfo = this.activeSessions.get(sessionId);

        if (!sessionInfo) {
            logger.warn('Session not found during connection update', { sessionId });
            return;
        }

        logger.info('Connection update received', { 
            sessionId, 
            connection, 
            lastDisconnect: lastDisconnect?.error?.output?.statusCode,
            hasQR: !!qr
        });

        try {
            if (qr) {
                await this.handleQRCode(sessionId, qr);
            }

            if (connection === 'close') {
                await this.handleDisconnection(sessionId, lastDisconnect);
            } else if (connection === 'open') {
                await this.handleConnection(sessionId);
            } else if (connection === 'connecting') {
                await this.handleConnecting(sessionId);
            }
        } catch (error) {
            logger.error('Error handling connection update', { 
                sessionId, 
                error: error.message 
            });
        }
    }

    async handleQRCode(sessionId, qr) {
        try {
            // Generate QR code as data URL
            const qrDataUrl = await QRCode.toDataURL(qr, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Store QR code data
            this.qrCodeData.set(sessionId, {
                qr: qrDataUrl,
                timestamp: Date.now(),
                raw: qr
            });

            // Update session status (don't fail if session update fails)
            const sessionUpdate = await sessionService.updateSessionStatus(sessionId, 'qr_generated');
            if (!sessionUpdate) {
                logger.warn(`Failed to update session status for ${sessionId}, but continuing with QR generation`);
            }

            // Emit session status webhook
            await webhookService.sendSessionStatus(sessionId, {
                status: 'qr_generated',
                qrCode: qrDataUrl,
                timestamp: Date.now()
            });

            logger.info('QR code generated for session', { sessionId });

        } catch (error) {
            logger.error('Error generating QR code', { 
                sessionId, 
                error: error.message 
            });
        }
    }

    async handleConnecting(sessionId) {
        const sessionInfo = this.activeSessions.get(sessionId);
        if (sessionInfo) {
            sessionInfo.status = 'connecting';
            sessionInfo.lastActivity = Date.now();
            
            // Update session status (don't fail if session update fails)
            const sessionUpdate = await sessionService.updateSessionStatus(sessionId, 'connecting');
            if (!sessionUpdate) {
                logger.warn(`Failed to update session status for ${sessionId}, but continuing with connection`);
            }
        }
    }

    async handleConnection(sessionId) {
        const sessionInfo = this.activeSessions.get(sessionId);
        if (!sessionInfo) return;

        try {
            const { sock } = sessionInfo;
            
            // Update session info
            sessionInfo.status = 'connected';
            sessionInfo.connectedAt = Date.now();
            sessionInfo.lastActivity = Date.now();
            sessionInfo.reconnectAttempts = 0;
            sessionInfo.phoneNumber = sock.user?.id?.split(':')[0] || 'Unknown';
            sessionInfo.whatsappId = sock.user?.id || 'Unknown';

            // Clear QR code data
            this.qrCodeData.delete(sessionId);

            // Update session in database (don't fail if session update fails)
            const sessionUpdate = await sessionService.updateSession(sessionId, {
                status: 'connected',
                connectedAt: new Date().toISOString(),
                phoneNumber: sessionInfo.phoneNumber,
                whatsappId: sessionInfo.whatsappId,
                metadata: {
                    ...sessionInfo.metadata,
                    lastConnected: new Date().toISOString(),
                    connectionCount: (sessionInfo.metadata?.connectionCount || 0) + 1
                }
            });

            if (!sessionUpdate) {
                logger.warn(`Failed to update session data for ${sessionId}, but continuing with connection`);
            }

            // Emit connection status webhook
            await webhookService.sendConnectionStatus(sessionId, {
                status: 'connected',
                phoneNumber: sessionInfo.phoneNumber,
                whatsappId: sessionInfo.whatsappId,
                connectedAt: sessionInfo.connectedAt
            });

            logger.info('WhatsApp session connected successfully', { 
                sessionId, 
                phoneNumber: sessionInfo.phoneNumber 
            });

        } catch (error) {
            logger.error('Error handling connection', { 
                sessionId, 
                error: error.message 
            });
        }
    }

    async handleDisconnection(sessionId, lastDisconnect) {
        const sessionInfo = this.activeSessions.get(sessionId);
        if (!sessionInfo) return;

        let shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        logger.info('WhatsApp session disconnected', { 
            sessionId, 
            statusCode, 
            shouldReconnect,
            reconnectAttempts: sessionInfo.reconnectAttempts
        });

        try {
            // Update session info
            sessionInfo.status = shouldReconnect ? 'disconnected' : 'inactive';
            sessionInfo.disconnectedAt = Date.now();
            sessionInfo.lastActivity = Date.now();

            // Check if session is in rapid disconnect loop (connected for less than 30 seconds)
            const connectionDuration = sessionInfo.connectedAt ? 
                (Date.now() - sessionInfo.connectedAt) : 0;
            const isRapidDisconnect = connectionDuration < 30000; // 30 seconds

            // If we've had multiple rapid disconnects, increase the cooldown significantly
            const recentDisconnects = sessionInfo.recentDisconnects || [];
            const now = Date.now();
            
            // Clean old disconnect timestamps (older than 5 minutes)
            sessionInfo.recentDisconnects = recentDisconnects.filter(t => now - t < 300000);
            
            if (isRapidDisconnect) {
                sessionInfo.recentDisconnects.push(now);
            }

            // If we have too many rapid disconnects, stop reconnecting for a while
            const rapidDisconnectCount = sessionInfo.recentDisconnects.length;
            const shouldEnterCooldown = rapidDisconnectCount >= 3;

            if (shouldEnterCooldown) {
                logger.warn('Session entering cooldown mode due to rapid disconnects', {
                    sessionId,
                    rapidDisconnectCount,
                    cooldownPeriod: '10 minutes'
                });
                
                sessionInfo.cooldownUntil = Date.now() + (10 * 60 * 1000); // 10 minutes cooldown
                sessionInfo.status = 'inactive';
                shouldReconnect = false;
            }

            // Update session in database
            const sessionUpdate = await sessionService.updateSession(sessionId, {
                status: sessionInfo.status,
                disconnectedAt: new Date().toISOString(),
                metadata: {
                    ...sessionInfo.metadata,
                    lastDisconnected: new Date().toISOString(),
                    disconnectReason: this.getDisconnectReason(statusCode),
                    connectionDuration: connectionDuration,
                    rapidDisconnectCount: rapidDisconnectCount,
                    cooldownUntil: sessionInfo.cooldownUntil || null
                }
            });

            if (!sessionUpdate) {
                logger.warn(`Failed to update session data for ${sessionId}, but continuing with disconnection`);
            }

            // Emit connection status webhook
            await webhookService.sendConnectionStatus(sessionId, {
                status: sessionInfo.status,
                disconnectedAt: sessionInfo.disconnectedAt,
                disconnectReason: this.getDisconnectReason(statusCode),
                willReconnect: shouldReconnect && sessionInfo.reconnectAttempts < this.maxReconnectAttempts && !shouldEnterCooldown
            });

            // Handle reconnection with improved circuit breaker
            if (shouldReconnect && !shouldEnterCooldown && sessionInfo.reconnectAttempts < this.maxReconnectAttempts) {
                // Calculate progressive delay
                let delay = this.reconnectDelay; // Start with base delay (5 seconds)
                
                if (isRapidDisconnect) {
                    delay = Math.min(30000 * Math.pow(2, sessionInfo.reconnectAttempts), 300000); // 30s to 5min
                } else {
                    delay = Math.min(this.reconnectDelay * Math.pow(1.5, sessionInfo.reconnectAttempts), 60000); // Up to 1min
                }
                
                sessionInfo.reconnectAttempts++;
                sessionInfo.nextReconnectAt = Date.now() + delay;
                
                logger.info('Scheduling session reconnection', { 
                    sessionId, 
                    attempt: sessionInfo.reconnectAttempts,
                    delay: delay,
                    isRapidDisconnect,
                    rapidDisconnectCount
                });

                // Clear any existing reconnect timeout
                if (sessionInfo.reconnectTimeout) {
                    clearTimeout(sessionInfo.reconnectTimeout);
                }

                sessionInfo.reconnectTimeout = setTimeout(async () => {
                    try {
                        // Double-check session still exists and should reconnect
                        const currentSessionInfo = this.activeSessions.get(sessionId);
                        if (!currentSessionInfo || currentSessionInfo.status === 'inactive') {
                            logger.info('Session no longer exists or is inactive, skipping reconnection', { sessionId });
                            return;
                        }

                        // Check if we're still in cooldown
                        if (currentSessionInfo.cooldownUntil && Date.now() < currentSessionInfo.cooldownUntil) {
                            logger.info('Session still in cooldown, skipping reconnection', { 
                                sessionId,
                                cooldownEndsAt: new Date(currentSessionInfo.cooldownUntil).toISOString()
                            });
                            return;
                        }

                        // Check if session is already connected
                        if (currentSessionInfo.status === 'connected') {
                            logger.info('Session already connected, skipping reconnection', { sessionId });
                            return;
                        }

                        logger.info('Attempting session reconnection', { sessionId, attempt: currentSessionInfo.reconnectAttempts });
                        
                        // Mark as connecting to prevent multiple reconnection attempts
                        currentSessionInfo.status = 'connecting';
                        currentSessionInfo.connectingAt = Date.now();

                        // Clean up the current session more thoroughly
                        if (currentSessionInfo.sock) {
                            try {
                                await currentSessionInfo.sock.logout();
                            } catch (logoutError) {
                                logger.warn('Error during logout before reconnection', { sessionId, error: logoutError.message });
                            }
                            
                            try {
                                await currentSessionInfo.sock.end();
                            } catch (endError) {
                                logger.warn('Error ending socket before reconnection', { sessionId, error: endError.message });
                            }
                        }
                        
                        // Remove from active sessions temporarily
                        this.activeSessions.delete(sessionId);
                        
                        // Wait for cleanup to complete
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        // Reinitialize the session
                        await this.initializeSession(sessionId, currentSessionInfo.userId);
                        
                        logger.info('Session reconnection successful', { sessionId });
                        
                    } catch (error) {
                        logger.error('Error during reconnection', { 
                            sessionId, 
                            error: error.message,
                            attempt: sessionInfo.reconnectAttempts
                        });
                        
                        // Mark session as disconnected and potentially try again later
                        const sessionInfo = this.activeSessions.get(sessionId);
                        if (sessionInfo) {
                            sessionInfo.status = 'disconnected';
                        }
                        
                        try {
                            await sessionService.updateSessionStatus(sessionId, 'disconnected');
                        } catch (dbError) {
                            logger.error('Failed to update session status after reconnection failure', {
                                sessionId,
                                error: dbError.message
                            });
                        }
                    }
                }, delay);
            } else {
                // Clean up session if not reconnecting or max attempts reached
                const shouldMarkInactive = statusCode === DisconnectReason.loggedOut || 
                    sessionInfo.reconnectAttempts >= this.maxReconnectAttempts ||
                    shouldEnterCooldown;
                
                if (sessionInfo.reconnectAttempts >= this.maxReconnectAttempts) {
                    logger.error('Maximum reconnection attempts reached for session', { 
                        sessionId, 
                        attempts: sessionInfo.reconnectAttempts 
                    });
                }
                
                await this.cleanupSession(sessionId, shouldMarkInactive);
            }

        } catch (error) {
            logger.error('Error handling disconnection', { 
                sessionId, 
                error: error.message 
            });
        }
    }

    async handleIncomingMessages(sessionId, messageUpdate) {
        const { messages } = messageUpdate;
        const sessionInfo = this.activeSessions.get(sessionId);

        if (!sessionInfo) return;

        try {
            for (const message of messages) {
                // Skip if message is from self
                if (message.key.fromMe) continue;

                // Process message based on type
                await this.processIncomingMessage(sessionId, message);
            }
        } catch (error) {
            logger.error('Error handling incoming messages', { 
                sessionId, 
                error: error.message 
            });
        }
    }

    async processIncomingMessage(sessionId, message) {
        try {
            const messageData = {
                sessionId,
                messageId: message.key.id,
                from: message.key.remoteJid,
                fromMe: message.key.fromMe,
                timestamp: message.messageTimestamp,
                type: this.getMessageType(message.message),
                content: this.extractMessageContent(message.message),
                participant: message.key.participant,
                isGroup: message.key.remoteJid.includes('@g.us'),
                raw: message
            };

            // Log message
            logger.info('Incoming message received', { 
                sessionId,
                messageId: messageData.messageId,
                from: messageData.from,
                type: messageData.type
            });

            // Store incoming message in message service
            await messageService.storeIncomingMessage(
                sessionId,
                messageData.from,
                messageData.content,
                messageData.type
            );

            // Increment message statistics
            try {
                const session = await sessionService.getSession(sessionId);
                if (session) {
                    await session.incrementMessageStats('received');
                }
            } catch (error) {
                logger.error('Error incrementing received message stats:', error);
            }

            // Emit to webhook system
            await webhookService.sendMessageReceived(sessionId, messageData);

        } catch (error) {
            logger.error('Error processing incoming message', { 
                sessionId, 
                error: error.message 
            });
        }
    }

    async handleMessageUpdates(sessionId, updates) {
        // Handle message status updates (delivered, read, etc.)
        for (const update of updates) {
            logger.debug('Message update received', { 
                sessionId, 
                messageId: update.key.id, 
                update: update.update 
            });

            // Update message status in message service
            if (update.update.status) {
                try {
                    await messageService.updateMessageStatus(
                        sessionId,
                        update.key.id,
                        update.update.status,
                        { updatedAt: new Date().toISOString() }
                    );
                } catch (error) {
                    logger.error('Error updating message status', { 
                        sessionId, 
                        messageId: update.key.id, 
                        error: error.message 
                    });
                }
            }
        }
    }

    async handlePresenceUpdate(sessionId, update) {
        logger.debug('Presence update received', { sessionId, update });
    }

    async handleContactsUpdate(sessionId, contacts) {
        logger.debug('Contacts update received', { sessionId, contactCount: contacts.length });
    }

    async handleChatsUpdate(sessionId, chats) {
        logger.debug('Chats update received', { sessionId, chatCount: chats.length });
    }

    async handleGroupsUpdate(sessionId, groups) {
        logger.debug('Groups update received', { sessionId, groupCount: groups.length });
    }

    async handleBlocklistUpdate(sessionId, update) {
        logger.debug('Blocklist update received', { sessionId, update });
    }

    async sendMessage(sessionId, to, message) {
        const sessionInfo = this.activeSessions.get(sessionId);
        
        if (!sessionInfo || sessionInfo.status !== 'connected') {
            throw new Error('Session not connected');
        }

        try {
            const { sock } = sessionInfo;
            
            // Send message
            const result = await sock.sendMessage(to, message);
            
            // Emit message sent webhook
            await webhookService.sendMessageSent(sessionId, {
                messageId: result.key.id,
                to,
                message,
                timestamp: new Date().toISOString()
            });
            
            logger.info('Message sent successfully', { 
                sessionId, 
                to, 
                messageId: result.key.id 
            });

            return result;

        } catch (error) {
            logger.error('Error sending message', { 
                sessionId, 
                to, 
                error: error.message 
            });
            throw error;
        }
    }

    async getQRCode(sessionId) {
        const qrData = this.qrCodeData.get(sessionId);
        if (!qrData) {
            throw new Error('QR code not available');
        }

        // Check if QR code is still valid (expires after 2 minutes)
        const qrAge = Date.now() - qrData.timestamp;
        if (qrAge > 120000) { // 2 minutes
            this.qrCodeData.delete(sessionId);
            throw new Error('QR code expired');
        }

        return qrData;
    }

    async disconnectSession(sessionId) {
        const sessionInfo = this.activeSessions.get(sessionId);
        if (!sessionInfo) {
            throw new Error('Session not found');
        }

        try {
            const { sock } = sessionInfo;
            
            // Close connection
            await sock.logout();
            
            // Clean up session and mark as inactive (manual disconnection)
            await this.cleanupSession(sessionId, true);
            
            logger.info('Session disconnected successfully', { sessionId });

        } catch (error) {
            logger.error('Error disconnecting session', { 
                sessionId, 
                error: error.message 
            });
            throw error;
        }
    }

    async cleanupSession(sessionId, markAsInactive = false) {
        const sessionInfo = this.activeSessions.get(sessionId);
        
        try {
            if (sessionInfo) {
                logger.info('Cleaning up session', { sessionId, markAsInactive });

                // Clear any pending reconnect timeout
                if (sessionInfo.reconnectTimeout) {
                    clearTimeout(sessionInfo.reconnectTimeout);
                    sessionInfo.reconnectTimeout = null;
                }

                // Close socket connection
                if (sessionInfo.sock) {
                    try {
                        await sessionInfo.sock.logout();
                    } catch (logoutError) {
                        logger.warn('Error during session logout', { sessionId, error: logoutError.message });
                    }
                    
                    try {
                        await sessionInfo.sock.end();
                    } catch (endError) {
                        logger.warn('Error ending session socket', { sessionId, error: endError.message });
                    }
                }

                // Remove from active sessions
                this.activeSessions.delete(sessionId);

                // Update database status if requested
                if (markAsInactive) {
                    await sessionService.updateSessionStatus(sessionId, 'inactive');
                }

                logger.info('Session cleaned up successfully', { sessionId });
            }
        } catch (error) {
            logger.error('Error during session cleanup', { 
                sessionId, 
                error: error.message 
            });
        }
    }

    getMessageType(message) {
        if (message.conversation) return 'text';
        if (message.extendedTextMessage) return 'text';
        if (message.imageMessage) return 'image';
        if (message.videoMessage) return 'video';
        if (message.audioMessage) return 'audio';
        if (message.documentMessage) return 'document';
        if (message.stickerMessage) return 'sticker';
        if (message.locationMessage) return 'location';
        if (message.contactMessage) return 'contact';
        if (message.buttonsMessage) return 'buttons';
        if (message.listMessage) return 'list';
        if (message.templateMessage) return 'template';
        return 'unknown';
    }

    extractMessageContent(message) {
        if (message.conversation) {
            return { text: message.conversation };
        }
        if (message.extendedTextMessage) {
            return { text: message.extendedTextMessage.text };
        }
        if (message.imageMessage) {
            return { 
                caption: message.imageMessage.caption,
                mimetype: message.imageMessage.mimetype,
                fileLength: message.imageMessage.fileLength
            };
        }
        if (message.videoMessage) {
            return { 
                caption: message.videoMessage.caption,
                mimetype: message.videoMessage.mimetype,
                fileLength: message.videoMessage.fileLength,
                duration: message.videoMessage.seconds
            };
        }
        if (message.audioMessage) {
            return { 
                mimetype: message.audioMessage.mimetype,
                fileLength: message.audioMessage.fileLength,
                duration: message.audioMessage.seconds,
                ptt: message.audioMessage.ptt
            };
        }
        if (message.documentMessage) {
            return { 
                fileName: message.documentMessage.fileName,
                mimetype: message.documentMessage.mimetype,
                fileLength: message.documentMessage.fileLength,
                title: message.documentMessage.title
            };
        }
        if (message.locationMessage) {
            return { 
                latitude: message.locationMessage.degreesLatitude,
                longitude: message.locationMessage.degreesLongitude,
                name: message.locationMessage.name,
                address: message.locationMessage.address
            };
        }
        if (message.contactMessage) {
            return { 
                displayName: message.contactMessage.displayName,
                vcard: message.contactMessage.vcard
            };
        }
        return {};
    }

    getDisconnectReason(statusCode) {
        switch (statusCode) {
            case DisconnectReason.badSession:
                return 'Bad session file, please delete and re-scan';
            case DisconnectReason.connectionClosed:
                return 'Connection closed';
            case DisconnectReason.connectionLost:
                return 'Connection lost';
            case DisconnectReason.connectionReplaced:
                return 'Connection replaced';
            case DisconnectReason.loggedOut:
                return 'Logged out';
            case DisconnectReason.restartRequired:
                return 'Restart required';
            case DisconnectReason.timedOut:
                return 'Connection timed out';
            default:
                return 'Unknown disconnect reason';
        }
    }

    getSessionInfo(sessionId) {
        const sessionInfo = this.activeSessions.get(sessionId);
        if (!sessionInfo) {
            return null;
        }

        return {
            sessionId,
            userId: sessionInfo.userId,
            status: sessionInfo.status,
            connectedAt: sessionInfo.connectedAt,
            disconnectedAt: sessionInfo.disconnectedAt,
            lastActivity: sessionInfo.lastActivity,
            phoneNumber: sessionInfo.phoneNumber,
            whatsappId: sessionInfo.whatsappId,
            reconnectAttempts: sessionInfo.reconnectAttempts,
            hasQRCode: this.qrCodeData.has(sessionId)
        };
    }

    getAllActiveSessions() {
        const sessions = [];
        for (const [sessionId, sessionInfo] of this.activeSessions) {
            sessions.push(this.getSessionInfo(sessionId));
        }
        return sessions;
    }

    async restartSession(sessionId) {
        // First try to get session info from memory
        let sessionInfo = this.activeSessions.get(sessionId);
        let userId = sessionInfo?.userId;
        
        // If not found in memory, try to find it in the database
        if (!sessionInfo) {
            try {
                const Session = require('../models/Session');
                const session = await Session.findBySessionId(sessionId);
                if (!session) {
                    throw new Error('Session not found');
                }
                userId = session.username;
                logger.info('Session found in database for restart', { sessionId, userId });
            } catch (error) {
                logger.error('Error finding session for restart', { sessionId, error: error.message });
                throw new Error('Session not found');
            }
        }
        
        // Clean up current session (don't mark as inactive - we're restarting)
        await this.cleanupSession(sessionId, false);
        
        // Initialize new session
        return await this.initializeSession(sessionId, userId);
    }

    /**
     * Clear session cooldown to allow immediate reconnection
     */
    async clearSessionCooldown(sessionId) {
        const sessionInfo = this.activeSessions.get(sessionId);
        
        if (sessionInfo) {
            sessionInfo.cooldownUntil = null;
            sessionInfo.recentDisconnects = [];
            sessionInfo.reconnectAttempts = 0;
            
            logger.info('Session cooldown cleared', { sessionId });
            
            // Update database
            try {
                await sessionService.updateSession(sessionId, {
                    metadata: {
                        ...sessionInfo.metadata,
                        cooldownUntil: null,
                        rapidDisconnectCount: 0
                    }
                });
            } catch (error) {
                logger.warn('Failed to update session cooldown in database', { 
                    sessionId, 
                    error: error.message 
                });
            }
            
            return true;
        }
        
        return false;
    }

    async clearAuthAndRestart(sessionId) {
        logger.info('clearAuthAndRestart called', { sessionId });
        
        // First try to get session info from memory
        let sessionInfo = this.activeSessions.get(sessionId);
        let userId = sessionInfo?.userId;
        
        // If not found in memory, try to find it in the database
        if (!sessionInfo) {
            try {
                const Session = require('../models/Session');
                const session = await Session.findBySessionId(sessionId);
                if (!session) {
                    throw new Error('Session not found');
                }
                userId = session.username;
                logger.info('Session found in database for auth clear and restart', { sessionId, userId });
            } catch (error) {
                logger.error('Error finding session for auth clear and restart', { sessionId, error: error.message });
                throw new Error('Session not found');
            }
        }
        
        logger.info('Cleaning up current session', { sessionId });
        
        // Clean up current session (don't mark as inactive - we're restarting)
        await this.cleanupSession(sessionId, false);
        
        // Clear auth state to force fresh QR generation
        const authDir = path.join(process.cwd(), 'data/auth', sessionId);
        try {
            await fs.rm(authDir, { recursive: true, force: true });
            logger.info('Auth state manually cleared for session', { sessionId });
        } catch (authError) {
            logger.warn('Failed to clear auth state (may not exist)', { sessionId, error: authError.message });
        }
        
        logger.info('Initializing new session after auth clear', { sessionId, userId });
        
        // Initialize new session
        return await this.initializeSession(sessionId, userId);
    }
}

module.exports = new WhatsAppService(); 