const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const sessionService = require('./sessionService');

class WebhookService {
    constructor() {
        this.webhookQueue = [];
        this.retryQueue = [];
        this.maxRetries = 5;
        this.retryDelay = 1000; // 1 second
        this.maxRetryDelay = 60000; // 60 seconds
        this.processingQueue = false;
        this.webhookTimeout = 10000; // 10 seconds

        // Start queue processing
        this.startQueueProcessing();
    }

    /**
     * Add webhook to queue
     */
    async addWebhook(sessionId, eventType, data, priority = 'normal') {
        try {
            const session = await sessionService.getSession(sessionId);
            if (!session || !session.webhookUrl) {
                logger.debug('No webhook URL configured for session', { sessionId });
                return;
            }

            const webhookData = {
                id: crypto.randomUUID(),
                sessionId,
                eventType,
                data,
                webhookUrl: session.webhookUrl,
                priority,
                attempts: 0,
                maxRetries: this.maxRetries,
                createdAt: new Date().toISOString(),
                nextRetry: null
            };

            // Add to appropriate queue based on priority
            if (priority === 'high') {
                this.webhookQueue.unshift(webhookData);
            } else {
                this.webhookQueue.push(webhookData);
            }

            logger.debug('Webhook added to queue', { 
                webhookId: webhookData.id,
                sessionId,
                eventType,
                priority
            });

        } catch (error) {
            logger.error('Error adding webhook to queue', { 
                sessionId,
                eventType,
                error: error.message
            });
        }
    }

    /**
     * Process webhook queue
     */
    async startQueueProcessing() {
        setInterval(async () => {
            if (this.processingQueue) return;

            this.processingQueue = true;
            
            try {
                // Process main queue
                await this.processQueue();
                
                // Process retry queue
                await this.processRetryQueue();
                
            } catch (error) {
                logger.error('Error processing webhook queue', { error: error.message });
            } finally {
                this.processingQueue = false;
            }
        }, 1000); // Process every second
    }

    /**
     * Process main webhook queue
     */
    async processQueue() {
        while (this.webhookQueue.length > 0) {
            const webhook = this.webhookQueue.shift();
            await this.sendWebhook(webhook);
        }
    }

    /**
     * Process retry queue
     */
    async processRetryQueue() {
        const now = Date.now();
        const readyToRetry = this.retryQueue.filter(webhook => {
            return webhook.nextRetry && new Date(webhook.nextRetry).getTime() <= now;
        });

        for (const webhook of readyToRetry) {
            const index = this.retryQueue.indexOf(webhook);
            if (index > -1) {
                this.retryQueue.splice(index, 1);
                await this.sendWebhook(webhook);
            }
        }
    }

    /**
     * Send webhook
     */
    async sendWebhook(webhook) {
        try {
            webhook.attempts++;
            
            logger.debug('Sending webhook', { 
                webhookId: webhook.id,
                sessionId: webhook.sessionId,
                eventType: webhook.eventType,
                attempt: webhook.attempts,
                url: webhook.webhookUrl
            });

            const payload = {
                event: webhook.eventType,
                sessionId: webhook.sessionId,
                data: webhook.data,
                timestamp: new Date().toISOString(),
                webhookId: webhook.id
            };

            // Generate signature for webhook validation
            const signature = this.generateSignature(payload, webhook.sessionId);

            const response = await axios.post(webhook.webhookUrl, payload, {
                timeout: this.webhookTimeout,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': webhook.eventType,
                    'X-Session-ID': webhook.sessionId,
                    'User-Agent': 'WhatsApp-API-Webhook/1.0'
                }
            });

            // Success
            if (response.status >= 200 && response.status < 300) {
                logger.info('Webhook sent successfully', { 
                    webhookId: webhook.id,
                    sessionId: webhook.sessionId,
                    eventType: webhook.eventType,
                    attempt: webhook.attempts,
                    statusCode: response.status
                });
                
                // Update webhook stats
                await this.updateWebhookStats(webhook.sessionId, 'success');
                
                return;
            }

            // Non-2xx status code
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            logger.warn('Webhook delivery failed', { 
                webhookId: webhook.id,
                sessionId: webhook.sessionId,
                eventType: webhook.eventType,
                attempt: webhook.attempts,
                error: error.message
            });

            // Update webhook stats
            await this.updateWebhookStats(webhook.sessionId, 'failed');

            // Retry if within limits
            if (webhook.attempts < webhook.maxRetries) {
                await this.scheduleRetry(webhook);
            } else {
                logger.error('Webhook delivery failed permanently', { 
                    webhookId: webhook.id,
                    sessionId: webhook.sessionId,
                    eventType: webhook.eventType,
                    totalAttempts: webhook.attempts,
                    error: error.message
                });

                // Update webhook stats
                await this.updateWebhookStats(webhook.sessionId, 'permanently_failed');
            }
        }
    }

    /**
     * Schedule webhook retry
     */
    async scheduleRetry(webhook) {
        // Exponential backoff with jitter
        const backoffDelay = Math.min(
            this.retryDelay * Math.pow(2, webhook.attempts - 1),
            this.maxRetryDelay
        );
        
        // Add jitter (±25%)
        const jitter = backoffDelay * 0.25 * (Math.random() - 0.5);
        const delay = Math.max(1000, backoffDelay + jitter);

        webhook.nextRetry = new Date(Date.now() + delay).toISOString();
        
        this.retryQueue.push(webhook);

        logger.debug('Webhook scheduled for retry', { 
            webhookId: webhook.id,
            sessionId: webhook.sessionId,
            nextRetry: webhook.nextRetry,
            delay: Math.round(delay / 1000) + 's'
        });
    }

    /**
     * Generate webhook signature
     */
    generateSignature(payload, sessionId) {
        const secret = process.env.WEBHOOK_SECRET || 'default_webhook_secret';
        const data = JSON.stringify(payload) + sessionId;
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }

    /**
     * Update webhook statistics
     */
    async updateWebhookStats(sessionId, result) {
        try {
            const session = await sessionService.getSession(sessionId);
            if (!session) return;

            const stats = session.webhookStats || {
                totalSent: 0,
                successful: 0,
                failed: 0,
                permanentlyFailed: 0,
                lastSent: null,
                lastSuccess: null,
                lastFailure: null
            };

            stats.totalSent++;
            
            if (result === 'success') {
                stats.successful++;
                stats.lastSuccess = new Date().toISOString();
            } else if (result === 'failed') {
                stats.failed++;
                stats.lastFailure = new Date().toISOString();
            } else if (result === 'permanently_failed') {
                stats.permanentlyFailed++;
                stats.lastFailure = new Date().toISOString();
            }

            stats.lastSent = new Date().toISOString();

            await sessionService.updateSession(sessionId, {
                webhookStats: stats
            });

        } catch (error) {
            logger.error('Error updating webhook stats', { 
                sessionId,
                error: error.message
            });
        }
    }

    /**
     * Send message received webhook
     */
    async sendMessageReceived(sessionId, messageData) {
        await this.addWebhook(sessionId, 'message.received', messageData, 'high');
    }

    /**
     * Send message sent webhook
     */
    async sendMessageSent(sessionId, messageData) {
        await this.addWebhook(sessionId, 'message.sent', messageData, 'normal');
    }

    /**
     * Send message status webhook
     */
    async sendMessageStatus(sessionId, statusData) {
        await this.addWebhook(sessionId, 'message.status', statusData, 'normal');
    }

    /**
     * Send session status webhook
     */
    async sendSessionStatus(sessionId, statusData) {
        await this.addWebhook(sessionId, 'session.status', statusData, 'high');
    }

    /**
     * Send connection status webhook
     */
    async sendConnectionStatus(sessionId, connectionData) {
        await this.addWebhook(sessionId, 'connection.status', connectionData, 'high');
    }

    /**
     * Send presence update webhook
     */
    async sendPresenceUpdate(sessionId, presenceData) {
        await this.addWebhook(sessionId, 'presence.update', presenceData, 'low');
    }

    /**
     * Send group event webhook
     */
    async sendGroupEvent(sessionId, groupData) {
        await this.addWebhook(sessionId, 'group.event', groupData, 'normal');
    }

    /**
     * Send contact update webhook
     */
    async sendContactUpdate(sessionId, contactData) {
        await this.addWebhook(sessionId, 'contact.update', contactData, 'low');
    }

    /**
     * Test webhook endpoint
     */
    async testWebhook(sessionId, webhookUrl) {
        try {
            const testPayload = {
                event: 'webhook.test',
                sessionId,
                data: {
                    message: 'This is a test webhook from WhatsApp API',
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                webhookId: crypto.randomUUID()
            };

            const signature = this.generateSignature(testPayload, sessionId);

            const response = await axios.post(webhookUrl, testPayload, {
                timeout: this.webhookTimeout,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': 'webhook.test',
                    'X-Session-ID': sessionId,
                    'User-Agent': 'WhatsApp-API-Webhook/1.0'
                }
            });

            if (response.status >= 200 && response.status < 300) {
                logger.info('Webhook test successful', { 
                    sessionId,
                    webhookUrl,
                    statusCode: response.status
                });
                return { success: true, statusCode: response.status };
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            logger.error('Webhook test failed', { 
                sessionId,
                webhookUrl,
                error: error.message
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Get webhook queue status
     */
    getQueueStatus() {
        return {
            queueLength: this.webhookQueue.length,
            retryQueueLength: this.retryQueue.length,
            processingQueue: this.processingQueue,
            nextRetries: this.retryQueue
                .filter(w => w.nextRetry)
                .map(w => ({
                    webhookId: w.id,
                    sessionId: w.sessionId,
                    eventType: w.eventType,
                    attempts: w.attempts,
                    nextRetry: w.nextRetry
                }))
                .sort((a, b) => new Date(a.nextRetry) - new Date(b.nextRetry))
                .slice(0, 10) // First 10 upcoming retries
        };
    }

    /**
     * Clear webhook queue for session
     */
    clearSessionQueue(sessionId) {
        this.webhookQueue = this.webhookQueue.filter(w => w.sessionId !== sessionId);
        this.retryQueue = this.retryQueue.filter(w => w.sessionId !== sessionId);
        
        logger.info('Webhook queue cleared for session', { sessionId });
    }

    /**
     * Get webhook statistics
     */
    getWebhookStats() {
        const totalQueued = this.webhookQueue.length + this.retryQueue.length;
        const processingStats = {
            totalQueued,
            mainQueue: this.webhookQueue.length,
            retryQueue: this.retryQueue.length,
            processing: this.processingQueue
        };

        return processingStats;
    }
}

module.exports = new WebhookService(); 