# Examples

This section provides practical code examples for common WhatsApp API use cases in multiple programming languages.

## Table of Contents

1. [Getting Started Examples](#getting-started-examples)
2. [Authentication Examples](#authentication-examples)
3. [Session Management Examples](#session-management-examples)
4. [Messaging Examples](#messaging-examples)
5. [Webhook Examples](#webhook-examples)
6. [Bulk Messaging Examples](#bulk-messaging-examples)
7. [Chatbot Examples](#chatbot-examples)
8. [Integration Examples](#integration-examples)

## Getting Started Examples

### Quick Setup - Node.js

```javascript
// whatsapp-client.js
const axios = require('axios');

class WhatsAppClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.yourwhatsappapi.com/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async createSession(name, description) {
    const response = await this.api.post('/sessions', {
      name,
      description
    });
    return response.data;
  }

  async startSession(sessionId) {
    const response = await this.api.post(`/sessions/${sessionId}/start`);
    return response.data;
  }

  async getQRCode(sessionId) {
    const response = await this.api.get(`/sessions/${sessionId}/qr`);
    return response.data;
  }

  async sendMessage(sessionId, to, text) {
    const response = await this.api.post('/messages/send/text', {
      sessionId,
      to,
      text
    });
    return response.data;
  }
}

// Usage example
async function quickStart() {
  const client = new WhatsAppClient(process.env.WHATSAPP_API_KEY);

  try {
    // Create and start session
    const session = await client.createSession('My Bot', 'Customer support bot');
    console.log('Session created:', session.session.id);

    await client.startSession(session.session.id);
    console.log('Session started');

    // Get QR code
    const qr = await client.getQRCode(session.session.id);
    console.log('Scan this QR code:', qr.qrCode);

    // Wait for connection (in real app, use webhooks)
    setTimeout(async () => {
      await client.sendMessage(session.session.id, '1234567890', 'Hello World!');
      console.log('Message sent');
    }, 30000);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

quickStart();
```

### Quick Setup - Python

```python
# whatsapp_client.py
import requests
import time
import os

class WhatsAppClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.yourwhatsappapi.com/api"
        self.headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
    
    def create_session(self, name, description):
        response = requests.post(
            f"{self.base_url}/sessions",
            headers=self.headers,
            json={"name": name, "description": description}
        )
        return response.json()
    
    def start_session(self, session_id):
        response = requests.post(
            f"{self.base_url}/sessions/{session_id}/start",
            headers=self.headers
        )
        return response.json()
    
    def get_qr_code(self, session_id):
        response = requests.get(
            f"{self.base_url}/sessions/{session_id}/qr",
            headers=self.headers
        )
        return response.json()
    
    def send_message(self, session_id, to, text):
        response = requests.post(
            f"{self.base_url}/messages/send/text",
            headers=self.headers,
            json={
                "sessionId": session_id,
                "to": to,
                "text": text
            }
        )
        return response.json()

# Usage example
def quick_start():
    client = WhatsAppClient(os.getenv('WHATSAPP_API_KEY'))
    
    try:
        # Create and start session
        session = client.create_session('My Bot', 'Customer support bot')
        session_id = session['session']['id']
        print(f"Session created: {session_id}")
        
        client.start_session(session_id)
        print("Session started")
        
        # Get QR code
        qr = client.get_qr_code(session_id)
        print(f"Scan this QR code: {qr['qrCode']}")
        
        # Wait for connection (in real app, use webhooks)
        time.sleep(30)
        
        client.send_message(session_id, '1234567890', 'Hello World!')
        print("Message sent")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    quick_start()
```

## Authentication Examples

### JWT Token Management

```javascript
// auth-manager.js
class AuthManager {
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this.token = null;
    this.tokenExpiry = null;
    this.baseURL = 'https://api.yourwhatsappapi.com/api';
  }

  async login() {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password
      })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.token = data.token;
    this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    return data;
  }

  async refreshToken() {
    if (!this.token) {
      throw new Error('No token to refresh');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token })
    });

    const data = await response.json();
    this.token = data.token;
    this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
    
    return data;
  }

  async getValidToken() {
    if (!this.token || Date.now() > this.tokenExpiry - 60000) {
      if (this.token) {
        await this.refreshToken();
      } else {
        await this.login();
      }
    }
    return this.token;
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = await this.getValidToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
}

// Usage
const auth = new AuthManager('your_username', 'your_password');

// Make authenticated request
const response = await auth.makeAuthenticatedRequest(
  'https://api.yourwhatsappapi.com/api/sessions',
  { method: 'GET' }
);
```

## Session Management Examples

### Complete Session Lifecycle

```javascript
// session-manager.js
class SessionManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.yourwhatsappapi.com/api';
    this.sessions = new Map();
  }

  async createSession(name, description) {
    const response = await this.apiCall('POST', '/sessions', {
      name,
      description
    });

    const session = response.session;
    this.sessions.set(session.id, session);
    return session;
  }

  async startSessionWithQR(sessionId) {
    // Start the session
    await this.apiCall('POST', `/sessions/${sessionId}/start`);
    
    // Poll for QR code
    let qrCode = null;
    for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
      try {
        const qrResponse = await this.apiCall('GET', `/sessions/${sessionId}/qr`);
        qrCode = qrResponse.qrCode;
        break;
      } catch (error) {
        if (error.status !== 400) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!qrCode) {
      throw new Error('QR code not generated');
    }

    console.log('QR Code generated. Please scan with WhatsApp.');
    
    // Wait for connection
    return this.waitForConnection(sessionId);
  }

  async waitForConnection(sessionId, timeoutMs = 120000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getSessionStatus(sessionId);
      
      if (status.status === 'connected') {
        console.log(`Session ${sessionId} connected: ${status.phoneNumber}`);
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Connection timeout');
  }

  async getSessionStatus(sessionId) {
    return this.apiCall('GET', `/sessions/${sessionId}/status`);
  }

  async restartSession(sessionId) {
    console.log(`Restarting session ${sessionId}`);
    return this.apiCall('POST', `/sessions/${sessionId}/restart`);
  }

  async monitorSessions() {
    const sessions = await this.apiCall('GET', '/sessions');
    
    for (const session of sessions.sessions) {
      if (session.status === 'disconnected') {
        console.log(`Auto-restarting disconnected session: ${session.id}`);
        await this.restartSession(session.id);
      }
    }
  }

  async apiCall(method, endpoint, data = null) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : null
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  }
}

// Usage
const sessionManager = new SessionManager(process.env.WHATSAPP_API_KEY);

async function setupSession() {
  try {
    const session = await sessionManager.createSession(
      'Customer Support',
      'Main customer support session'
    );
    
    console.log('Session created:', session.id);
    
    const status = await sessionManager.startSessionWithQR(session.id);
    console.log('Session connected:', status.phoneNumber);
    
    // Start monitoring
    setInterval(() => {
      sessionManager.monitorSessions();
    }, 60000); // Check every minute
    
  } catch (error) {
    console.error('Setup failed:', error.message);
  }
}

setupSession();
```

## Messaging Examples

### Rich Message Sender

```javascript
// message-sender.js
class MessageSender {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.yourwhatsappapi.com/api';
  }

  // Send text with formatting
  async sendFormattedText(sessionId, to, message) {
    const formattedText = this.formatMessage(message);
    return this.sendText(sessionId, to, formattedText);
  }

  // Send image with caption
  async sendImageWithCaption(sessionId, to, imageUrl, caption) {
    return this.apiCall('/messages/send/image', {
      sessionId,
      to,
      imageUrl,
      caption
    });
  }

  // Send document
  async sendDocument(sessionId, to, documentUrl, filename, caption) {
    return this.apiCall('/messages/send/document', {
      sessionId,
      to,
      documentUrl,
      filename,
      caption
    });
  }

  // Send location
  async sendLocation(sessionId, to, latitude, longitude, name, address) {
    return this.apiCall('/messages/send/location', {
      sessionId,
      to,
      latitude,
      longitude,
      name,
      address
    });
  }

  // Send contact
  async sendContact(sessionId, to, contact) {
    return this.apiCall('/messages/send/contact', {
      sessionId,
      to,
      contact
    });
  }

  // Upload and send file
  async uploadAndSendFile(sessionId, to, filePath, type = 'document') {
    // First upload the file
    const uploadResponse = await this.uploadFile(filePath);
    
    if (!uploadResponse.success) {
      throw new Error('File upload failed');
    }

    const fileUrl = uploadResponse.data.url;
    const filename = uploadResponse.data.originalname;

    // Send based on type
    switch (type) {
      case 'image':
        return this.sendImageWithCaption(sessionId, to, fileUrl, `📎 ${filename}`);
      case 'document':
        return this.sendDocument(sessionId, to, fileUrl, filename, 'Document attached');
      case 'video':
        return this.apiCall('/messages/send/video', {
          sessionId, to, videoUrl: fileUrl, caption: `🎥 ${filename}`
        });
      default:
        return this.sendDocument(sessionId, to, fileUrl, filename, 'File attached');
    }
  }

  async uploadFile(filePath) {
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await fetch(`${this.baseURL}/messages/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        ...form.getHeaders()
      },
      body: form
    });

    return response.json();
  }

  formatMessage(message) {
    return message
      .replace(/\*\*(.*?)\*\*/g, '*$1*')  // Bold
      .replace(/__(.*?)__/g, '_$1_')      // Italic
      .replace(/~~(.*?)~~/g, '~$1~')      // Strikethrough
      .replace(/`(.*?)`/g, '```$1```');   // Monospace
  }

  async sendText(sessionId, to, text) {
    return this.apiCall('/messages/send/text', {
      sessionId,
      to,
      text
    });
  }

  async apiCall(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return response.json();
  }
}

// Usage examples
const sender = new MessageSender(process.env.WHATSAPP_API_KEY);

// Send formatted text
await sender.sendFormattedText('session_id', '1234567890', `
**Welcome to Our Service!** 🎉

Hi there! Thanks for joining us.

__Your account details:__
• Account ID: 12345
• Email: user@example.com
• Status: ~~Pending~~ **Active**

Use this code: \`WELCOME2024\`

Questions? Just reply to this message!
`);

// Send image with caption
await sender.sendImageWithCaption(
  'session_id',
  '1234567890',
  'https://example.com/welcome.jpg',
  'Welcome to our service! 🎊'
);

// Send location
await sender.sendLocation(
  'session_id',
  '1234567890',
  37.7749,
  -122.4194,
  'Our Office',
  '123 Main St, San Francisco, CA'
);

// Upload and send document
await sender.uploadAndSendFile(
  'session_id',
  '1234567890',
  './invoice.pdf',
  'document'
);
```

## Webhook Examples

### Complete Webhook Server

```javascript
// webhook-server.js
const express = require('express');
const crypto = require('crypto');
const app = express();

// Use raw body parsing for webhook signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));

class WebhookServer {
  constructor(secret, whatsappApiKey) {
    this.secret = secret;
    this.whatsappApiKey = whatsappApiKey;
    this.messageHandlers = new Map();
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    // Auto-reply for common messages
    this.addMessageHandler(/hello|hi|hey/i, this.handleGreeting.bind(this));
    this.addMessageHandler(/help|support/i, this.handleHelpRequest.bind(this));
    this.addMessageHandler(/hours|time/i, this.handleBusinessHours.bind(this));
    this.addMessageHandler(/contact|phone|email/i, this.handleContactInfo.bind(this));
    this.addMessageHandler(/price|cost|pricing/i, this.handlePricing.bind(this));
  }

  addMessageHandler(pattern, handler) {
    this.messageHandlers.set(pattern, handler);
  }

  verifySignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  }

  async handleWebhook(payload, signature) {
    if (!this.verifySignature(payload, signature)) {
      throw new Error('Invalid signature');
    }

    const event = JSON.parse(payload);
    console.log(`Received event: ${event.event}`);

    switch (event.event) {
      case 'message.received':
        await this.handleIncomingMessage(event);
        break;
      case 'session.connected':
        await this.handleSessionConnected(event);
        break;
      case 'session.disconnected':
        await this.handleSessionDisconnected(event);
        break;
      default:
        console.log('Unknown event type:', event.event);
    }
  }

  async handleIncomingMessage(event) {
    const { sessionId, from, text } = event;

    // Don't respond to our own messages
    if (from === 'me') return;

    console.log(`Message from ${from}: ${text}`);

    // Try to find a matching handler
    for (const [pattern, handler] of this.messageHandlers) {
      if (pattern.test(text)) {
        await handler(sessionId, from, text, event);
        return;
      }
    }

    // No handler found, send default response
    await this.sendDefaultResponse(sessionId, from);
  }

  async handleGreeting(sessionId, from, text) {
    const responses = [
      "Hello! 👋 How can I help you today?",
      "Hi there! 😊 What can I do for you?",
      "Hey! 🌟 Thanks for reaching out. How may I assist you?"
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    await this.sendReply(sessionId, from, response);
  }

  async handleHelpRequest(sessionId, from, text) {
    const helpMessage = `
🤖 **How can I help you?**

Here are some things you can ask me:

• Type "*hours*" for business hours
• Type "*contact*" for contact information  
• Type "*pricing*" for pricing information
• Type "*human*" to talk to a human agent

Just send me any message and I'll do my best to help! 😊
    `;
    
    await this.sendReply(sessionId, from, helpMessage.trim());
  }

  async handleBusinessHours(sessionId, from, text) {
    const hoursMessage = `
🕒 **Business Hours**

**Monday - Friday:** 9:00 AM - 6:00 PM
**Saturday:** 10:00 AM - 4:00 PM  
**Sunday:** Closed

**Timezone:** Pacific Standard Time (PST)

We'll respond to messages during business hours. For urgent matters, please call us directly.
    `;
    
    await this.sendReply(sessionId, from, hoursMessage.trim());
  }

  async handleContactInfo(sessionId, from, text) {
    const contactMessage = `
📞 **Contact Information**

**Phone:** +1 (555) 123-4567
**Email:** support@example.com
**Website:** www.example.com

**Address:**
123 Business St
Suite 100
City, State 12345

**Live Chat:** Available on our website
**WhatsApp:** You're already here! 😊
    `;
    
    await this.sendReply(sessionId, from, contactMessage.trim());
  }

  async handlePricing(sessionId, from, text) {
    const pricingMessage = `
💰 **Pricing Information**

**Basic Plan:** $29/month
• Up to 1,000 messages
• 1 WhatsApp session
• Email support

**Pro Plan:** $79/month
• Up to 10,000 messages
• 5 WhatsApp sessions
• Priority support
• Advanced analytics

**Enterprise:** Custom pricing
• Unlimited messages
• Unlimited sessions
• Dedicated support
• Custom integrations

Would you like more details about any plan? 📊
    `;
    
    await this.sendReply(sessionId, from, pricingMessage.trim());
  }

  async sendDefaultResponse(sessionId, from) {
    const defaultMessage = `
Thanks for your message! 😊

I'm an automated assistant. Type "*help*" to see what I can do, or someone from our team will get back to you soon.

**Quick links:**
• Business hours: Type "*hours*"
• Contact info: Type "*contact*"
• Pricing: Type "*pricing*"
    `;
    
    await this.sendReply(sessionId, from, defaultMessage.trim());
  }

  async handleSessionConnected(event) {
    console.log(`✅ Session ${event.sessionId} connected: ${event.phoneNumber}`);
    
    // Send notification to admin
    await this.notifyAdmin(`Session ${event.sessionId} connected: ${event.phoneNumber}`);
  }

  async handleSessionDisconnected(event) {
    console.log(`❌ Session ${event.sessionId} disconnected: ${event.reason}`);
    
    // Try to reconnect
    await this.reconnectSession(event.sessionId);
  }

  async sendReply(sessionId, to, text) {
    try {
      const response = await fetch('https://api.yourwhatsappapi.com/api/messages/send/text', {
        method: 'POST',
        headers: {
          'X-API-Key': this.whatsappApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          to,
          text
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to send reply:', result);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  }

  async reconnectSession(sessionId) {
    try {
      await fetch(`https://api.yourwhatsappapi.com/api/sessions/${sessionId}/restart`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.whatsappApiKey
        }
      });
      console.log(`🔄 Attempting to reconnect session ${sessionId}`);
    } catch (error) {
      console.error('Error reconnecting session:', error);
    }
  }

  async notifyAdmin(message) {
    // Send notification to admin phone number
    const adminNumber = process.env.ADMIN_PHONE;
    if (adminNumber) {
      // Use the first available session to send admin notification
      // This is a simplified example
      console.log(`Admin notification: ${message}`);
    }
  }
}

// Initialize webhook server
const webhookServer = new WebhookServer(
  process.env.WEBHOOK_SECRET,
  process.env.WHATSAPP_API_KEY
);

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;

    await webhookServer.handleWebhook(payload, signature);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Bad Request');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
```

## Bulk Messaging Examples

### Newsletter Campaign

```javascript
// newsletter-campaign.js
class NewsletterCampaign {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.yourwhatsappapi.com/api';
  }

  async sendNewsletter(sessionId, subscribers, newsletter) {
    const messages = subscribers.map(subscriber => ({
      to: subscriber.phone,
      text: this.personalizeNewsletter(newsletter, subscriber),
      variables: {
        name: subscriber.name,
        email: subscriber.email
      }
    }));

    // Send in batches to avoid rate limiting
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      try {
        const batchResult = await this.sendBatch(sessionId, batch);
        results.push(...batchResult.results);
        
        // Delay between batches
        if (i + batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error);
      }
    }

    return this.generateReport(results);
  }

  personalizeNewsletter(template, subscriber) {
    return template
      .replace('{{name}}', subscriber.name)
      .replace('{{email}}', subscriber.email)
      .replace('{{company}}', subscriber.company || '')
      .replace('{{custom_field}}', subscriber.customField || '');
  }

  async sendBatch(sessionId, messages) {
    const response = await fetch(`${this.baseURL}/messages/send/bulk`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        messages
      })
    });

    return response.json();
  }

  generateReport(results) {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;

    return {
      total,
      successful,
      failed,
      successRate: ((successful / total) * 100).toFixed(2) + '%',
      failedNumbers: results
        .filter(r => !r.success)
        .map(r => r.to)
    };
  }
}

// Usage example
const campaign = new NewsletterCampaign(process.env.WHATSAPP_API_KEY);

const newsletterTemplate = `
🌟 **Weekly Newsletter** 🌟

Hi {{name}}! 👋

Here's what's new this week:

**📊 This Week's Highlights:**
• New feature: Advanced analytics dashboard
• 50% off premium plans this month
• Customer spotlight: Amazing success stories

**🎉 Special Offer for You:**
Use code NEWSLETTER20 for 20% off your next purchase!

**📅 Upcoming Events:**
• Webinar: "Best Practices" - Jan 15th
• Product Demo: "New Features" - Jan 20th

Thanks for being part of our community!

Best regards,
The Team

---
*Unsubscribe: Reply STOP*
*Update preferences: {{email}}*
`;

const subscribers = [
  { name: 'John Doe', phone: '1234567890', email: 'john@example.com', company: 'ABC Corp' },
  { name: 'Jane Smith', phone: '0987654321', email: 'jane@example.com', company: 'XYZ Inc' },
  // ... more subscribers
];

async function runCampaign() {
  try {
    const results = await campaign.sendNewsletter(
      'your_session_id',
      subscribers,
      newsletterTemplate
    );
    
    console.log('Campaign Results:', results);
  } catch (error) {
    console.error('Campaign failed:', error);
  }
}

runCampaign();
```

## Chatbot Examples

### Advanced Customer Service Bot

```javascript
// customer-service-bot.js
class CustomerServiceBot {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.yourwhatsappapi.com/api';
    this.conversations = new Map(); // Store conversation state
    this.setupCommands();
  }

  setupCommands() {
    this.commands = {
      '/start': this.handleStart.bind(this),
      '/help': this.handleHelp.bind(this),
      '/track': this.handleTrackOrder.bind(this),
      '/support': this.handleSupportRequest.bind(this),
      '/hours': this.handleBusinessHours.bind(this),
      '/reset': this.handleReset.bind(this)
    };
  }

  async processMessage(sessionId, from, text) {
    // Get or create conversation state
    const conversationKey = `${sessionId}:${from}`;
    let conversation = this.conversations.get(conversationKey) || {
      state: 'idle',
      data: {},
      lastActivity: Date.now()
    };

    // Update last activity
    conversation.lastActivity = Date.now();

    // Check for commands
    if (text.startsWith('/')) {
      const command = text.split(' ')[0].toLowerCase();
      if (this.commands[command]) {
        await this.commands[command](sessionId, from, text, conversation);
        this.conversations.set(conversationKey, conversation);
        return;
      }
    }

    // Handle based on conversation state
    switch (conversation.state) {
      case 'waiting_order_number':
        await this.handleOrderNumber(sessionId, from, text, conversation);
        break;
      case 'waiting_support_details':
        await this.handleSupportDetails(sessionId, from, text, conversation);
        break;
      case 'waiting_feedback':
        await this.handleFeedback(sessionId, from, text, conversation);
        break;
      default:
        await this.handleGeneralMessage(sessionId, from, text, conversation);
    }

    this.conversations.set(conversationKey, conversation);
  }

  async handleStart(sessionId, from, text, conversation) {
    conversation.state = 'idle';
    
    const welcomeMessage = `
🌟 **Welcome to Customer Service!** 🌟

I'm your virtual assistant. Here's how I can help:

**📦 Order Tracking**
Type \`/track\` to track your order

**🆘 Technical Support**  
Type \`/support\` for technical help

**🕒 Business Hours**
Type \`/hours\` for our operating hours

**❓ Help**
Type \`/help\` anytime for assistance

**🔄 Reset**
Type \`/reset\` to start over

What can I help you with today? 😊
    `;

    await this.sendMessage(sessionId, from, welcomeMessage.trim());
  }

  async handleTrackOrder(sessionId, from, text, conversation) {
    conversation.state = 'waiting_order_number';
    
    await this.sendMessage(sessionId, from, `
📦 **Order Tracking**

Please provide your order number (e.g., ORD-12345):

*Note: You can find your order number in your confirmation email.*
    `.trim());
  }

  async handleOrderNumber(sessionId, from, orderNumber, conversation) {
    // Validate order number format
    if (!/^(ORD-|#)?\d{4,6}$/i.test(orderNumber.trim())) {
      await this.sendMessage(sessionId, from, `
❌ Invalid order number format.

Please provide a valid order number (e.g., ORD-12345 or 12345):
      `.trim());
      return;
    }

    // Simulate order lookup
    const orderStatus = await this.lookupOrder(orderNumber);
    
    if (orderStatus) {
      await this.sendMessage(sessionId, from, `
📦 **Order Status: ${orderStatus.status}**

**Order #:** ${orderStatus.id}
**Date:** ${orderStatus.date}
**Items:** ${orderStatus.items}
**Total:** $${orderStatus.total}

**Shipping Info:**
${orderStatus.shipping}

**Tracking:** ${orderStatus.tracking || 'Not available yet'}

Is there anything else I can help you with? 😊
      `.trim());
    } else {
      await this.sendMessage(sessionId, from, `
❌ Order not found.

Please double-check your order number, or contact our support team if you need assistance.

Type \`/support\` to get help from a human agent.
      `.trim());
    }

    conversation.state = 'idle';
  }

  async handleSupportRequest(sessionId, from, text, conversation) {
    conversation.state = 'waiting_support_details';
    
    await this.sendMessage(sessionId, from, `
🆘 **Technical Support**

I'll connect you with our support team. First, please briefly describe your issue:

*Examples:*
• "App crashes when I open it"
• "Can't login to my account"  
• "Payment not processing"
• "Feature not working properly"

What issue are you experiencing?
    `.trim());
  }

  async handleSupportDetails(sessionId, from, issue, conversation) {
    // Create support ticket
    const ticketId = await this.createSupportTicket(from, issue);
    
    await this.sendMessage(sessionId, from, `
✅ **Support Ticket Created**

**Ticket ID:** ${ticketId}
**Issue:** ${issue}
**Status:** Open

Our support team will contact you within 2-4 hours during business hours.

**Next Steps:**
1. Keep this ticket ID for reference
2. You'll receive updates via WhatsApp
3. Our team may ask for additional details

**Urgent issue?** Call us: +1-800-SUPPORT

Thank you for your patience! 🙏
    `.trim());

    // Notify support team
    await this.notifySupportTeam(ticketId, from, issue);
    
    conversation.state = 'idle';
  }

  async handleGeneralMessage(sessionId, from, text, conversation) {
    // Simple keyword matching
    const keywords = {
      refund: 'For refund requests, please type `/support` to create a support ticket.',
      cancel: 'To cancel an order, please type `/track` to find your order first.',
      delivery: 'For delivery questions, please type `/track` to check your order status.',
      account: 'For account issues, please type `/support` to get help from our team.',
      payment: 'For payment problems, please type `/support` to create a support ticket.'
    };

    const lowerText = text.toLowerCase();
    for (const [keyword, response] of Object.entries(keywords)) {
      if (lowerText.includes(keyword)) {
        await this.sendMessage(sessionId, from, response);
        return;
      }
    }

    // Default response
    await this.sendMessage(sessionId, from, `
I didn't quite understand that. 🤔

Here are some things you can try:

• Type \`/help\` to see all available commands
• Type \`/track\` to track an order
• Type \`/support\` for technical help
• Type \`/start\` to see the main menu

Or just describe what you need help with!
    `.trim());
  }

  async lookupOrder(orderNumber) {
    // Simulate database lookup
    const orders = {
      '12345': {
        id: 'ORD-12345',
        status: 'Shipped',
        date: '2024-01-15',
        items: '2x T-Shirt, 1x Jeans',
        total: '89.99',
        shipping: 'Express Delivery\nEstimated: Jan 20, 2024',
        tracking: 'TRK-789123456'
      },
      '67890': {
        id: 'ORD-67890', 
        status: 'Processing',
        date: '2024-01-18',
        items: '1x Laptop',
        total: '1299.99',
        shipping: 'Standard Delivery\nEstimated: Jan 25, 2024',
        tracking: null
      }
    };

    return orders[orderNumber.replace(/^(ORD-|#)/, '')];
  }

  async createSupportTicket(phoneNumber, issue) {
    // Generate ticket ID
    const ticketId = 'SUP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // In a real implementation, save to database
    console.log(`Support ticket created: ${ticketId} for ${phoneNumber}`);
    
    return ticketId;
  }

  async notifySupportTeam(ticketId, phoneNumber, issue) {
    // In a real implementation, notify support team via email/Slack
    console.log(`🚨 New support ticket: ${ticketId}\nFrom: ${phoneNumber}\nIssue: ${issue}`);
  }

  async sendMessage(sessionId, to, text) {
    try {
      const response = await fetch(`${this.baseURL}/messages/send/text`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          to,
          text
        })
      });

      return response.json();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Cleanup old conversations
  cleanupConversations() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [key, conversation] of this.conversations) {
      if (now - conversation.lastActivity > timeout) {
        this.conversations.delete(key);
      }
    }
  }
}

// Usage
const bot = new CustomerServiceBot(process.env.WHATSAPP_API_KEY);

// Cleanup old conversations every 10 minutes
setInterval(() => {
  bot.cleanupConversations();
}, 10 * 60 * 1000);

module.exports = bot;
```

---

**Next Steps:** Learn about [Error Codes](./error-codes.md) or explore [Rate Limiting](./rate-limiting.md) 