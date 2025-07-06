# Webhooks

Webhooks allow you to receive real-time notifications about events happening in your WhatsApp sessions. This guide covers webhook setup, event types, security, and implementation examples.

## What are Webhooks?

Webhooks are HTTP POST requests sent to your server when specific events occur:
- **Incoming messages** - When someone sends you a message
- **Message status updates** - Delivery confirmations, read receipts
- **Session events** - Connection status changes
- **QR code events** - When QR codes are generated

## Event Types

### Message Events

#### message.received
Triggered when a new message is received.

```json
{
  "event": "message.received",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "messageId": "msg_1234567890",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "from": "1234567890",
  "to": "me",
  "type": "text",
  "text": "Hello! How can I help you?",
  "contact": {
    "name": "John Doe",
    "profilePicture": "https://example.com/avatar.jpg"
  }
}
```

#### message.sent
Triggered when a message is successfully sent.

```json
{
  "event": "message.sent",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "messageId": "msg_0987654321",
  "timestamp": "2024-01-01T12:01:00.000Z",
  "from": "me",
  "to": "1234567890",
  "type": "text",
  "text": "Thanks for contacting us!"
}
```

#### message.delivered
Triggered when a message is delivered to the recipient.

```json
{
  "event": "message.delivered",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "messageId": "msg_0987654321",
  "timestamp": "2024-01-01T12:01:05.000Z",
  "to": "1234567890"
}
```

#### message.read
Triggered when a message is read by the recipient.

```json
{
  "event": "message.read",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "messageId": "msg_0987654321",
  "timestamp": "2024-01-01T12:01:30.000Z",
  "to": "1234567890"
}
```

### Session Events

#### session.connected
Triggered when a session successfully connects.

```json
{
  "event": "session.connected",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "phoneNumber": "+1234567890",
  "deviceInfo": {
    "model": "iPhone 15 Pro",
    "version": "2.2408.10"
  }
}
```

#### session.disconnected
Triggered when a session loses connection.

```json
{
  "event": "session.disconnected",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "timestamp": "2024-01-01T15:00:00.000Z",
  "reason": "connection_lost"
}
```

#### session.qr_generated
Triggered when a QR code is generated.

```json
{
  "event": "session.qr_generated",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "timestamp": "2024-01-01T09:30:00.000Z",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "expiresAt": "2024-01-01T09:31:30.000Z"
}
```

### Contact Events

#### contact.updated
Triggered when contact information changes.

```json
{
  "event": "contact.updated",
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "phoneNumber": "1234567890",
  "contact": {
    "name": "John Doe",
    "profilePicture": "https://example.com/avatar.jpg",
    "status": "Available"
  }
}
```

## Webhook Configuration

### Configure Webhook for Session

```bash
curl -X PUT https://api.yourwhatsappapi.com/api/webhook/config/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["message.received", "message.sent", "session.connected"],
    "secret": "your_webhook_secret_key"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook configured successfully",
  "config": {
    "url": "https://your-server.com/webhook",
    "events": ["message.received", "message.sent", "session.connected"],
    "secret": "your_webhook_secret_key",
    "isActive": true
  }
}
```

### Get Webhook Configuration

```bash
curl -X GET https://api.yourwhatsappapi.com/api/webhook/config/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Webhook

```bash
curl -X POST https://api.yourwhatsappapi.com/api/webhook/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "payload": {
      "event": "test",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "message": "This is a test webhook"
    }
  }'
```

## Security

### Webhook Signature Verification

All webhook requests include a signature header for verification:

```http
X-Webhook-Signature: sha256=a8b2c3d4e5f6...
```

#### Verify Signature (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const expectedHeader = `sha256=${expectedSignature}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedHeader)
  );
}

// Express.js middleware
app.use('/webhook', express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  const event = JSON.parse(payload);
  handleWebhookEvent(event);
  res.status(200).send('OK');
});
```

#### Verify Signature (Python)

```python
import hashlib
import hmac
import json

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    expected_header = f"sha256={expected_signature}"
    
    return hmac.compare_digest(signature, expected_header)

# Flask example
from flask import Flask, request

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data()
    secret = os.getenv('WEBHOOK_SECRET')
    
    if not verify_webhook_signature(payload, signature, secret):
        return 'Unauthorized', 401
    
    event = json.loads(payload)
    handle_webhook_event(event)
    return 'OK', 200
```

### HTTPS Requirements

- **Webhooks require HTTPS** for security
- **Valid SSL certificate** required
- **Port 443** or **custom HTTPS port**

### IP Whitelisting

Restrict webhook access to API server IPs:

```nginx
# Nginx configuration
location /webhook {
    allow 192.168.1.100;  # API server IP
    allow 10.0.0.0/8;     # Private network
    deny all;
    
    proxy_pass http://localhost:3000;
}
```

## Implementation Examples

### Node.js Webhook Server

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware for raw body parsing
app.use('/webhook', express.raw({ type: 'application/json' }));

class WebhookHandler {
  constructor(secret) {
    this.secret = secret;
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

  async handleEvent(event) {
    console.log(`Received event: ${event.event}`);
    
    switch (event.event) {
      case 'message.received':
        await this.handleIncomingMessage(event);
        break;
      
      case 'message.delivered':
        await this.handleMessageDelivered(event);
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
    console.log(`New message from ${event.from}: ${event.text}`);
    
    // Auto-reply logic
    if (event.text.toLowerCase().includes('help')) {
      await this.sendAutoReply(event.sessionId, event.from, 
        'Hi! How can I help you today? 🤖\n\n' +
        '• Type "hours" for business hours\n' +
        '• Type "contact" for contact info\n' +
        '• Type "support" to talk to a human'
      );
    }
  }

  async handleMessageDelivered(event) {
    console.log(`Message ${event.messageId} delivered to ${event.to}`);
    // Update message status in database
  }

  async handleSessionConnected(event) {
    console.log(`Session ${event.sessionId} connected: ${event.phoneNumber}`);
    // Notify administrators
  }

  async handleSessionDisconnected(event) {
    console.log(`Session ${event.sessionId} disconnected: ${event.reason}`);
    // Attempt to reconnect
    await this.reconnectSession(event.sessionId);
  }

  async sendAutoReply(sessionId, to, text) {
    // Send reply using WhatsApp API
    const response = await fetch('https://api.yourwhatsappapi.com/api/messages/send/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        to,
        text
      })
    });
    
    return response.json();
  }

  async reconnectSession(sessionId) {
    const response = await fetch(`https://api.yourwhatsappapi.com/api/sessions/${sessionId}/restart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_JWT_TOKEN}`
      }
    });
    
    return response.json();
  }
}

const webhookHandler = new WebhookHandler(process.env.WEBHOOK_SECRET);

app.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;
    
    // Verify signature
    if (!webhookHandler.verifySignature(payload, signature)) {
      return res.status(401).send('Unauthorized');
    }
    
    // Parse and handle event
    const event = JSON.parse(payload);
    await webhookHandler.handleEvent(event);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

### Python Flask Webhook Server

```python
import os
import json
import hashlib
import hmac
import requests
from flask import Flask, request

app = Flask(__name__)

class WebhookHandler:
    def __init__(self, secret, api_token):
        self.secret = secret
        self.api_token = api_token
        self.api_base = "https://api.yourwhatsappapi.com/api"
    
    def verify_signature(self, payload, signature):
        expected_signature = hmac.new(
            self.secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        expected_header = f"sha256={expected_signature}"
        return hmac.compare_digest(signature, expected_header)
    
    async def handle_event(self, event):
        print(f"Received event: {event['event']}")
        
        event_handlers = {
            'message.received': self.handle_incoming_message,
            'message.delivered': self.handle_message_delivered,
            'session.connected': self.handle_session_connected,
            'session.disconnected': self.handle_session_disconnected,
        }
        
        handler = event_handlers.get(event['event'])
        if handler:
            await handler(event)
        else:
            print(f"Unknown event type: {event['event']}")
    
    def handle_incoming_message(self, event):
        print(f"New message from {event['from']}: {event['text']}")
        
        # Simple chatbot logic
        text = event['text'].lower()
        response = None
        
        if 'hello' in text or 'hi' in text:
            response = "Hello! 👋 How can I help you today?"
        elif 'hours' in text:
            response = "Our business hours are:\nMon-Fri: 9AM-6PM\nSat: 10AM-4PM\nSun: Closed"
        elif 'contact' in text:
            response = "📞 Phone: +1-234-567-8900\n📧 Email: support@example.com\n🌐 Website: www.example.com"
        elif 'support' in text:
            response = "I'm connecting you with a human agent. Please wait a moment..."
        
        if response:
            self.send_reply(event['sessionId'], event['from'], response)
    
    def handle_message_delivered(self, event):
        print(f"Message {event['messageId']} delivered to {event['to']}")
        # Update database with delivery status
    
    def handle_session_connected(self, event):
        print(f"Session {event['sessionId']} connected: {event['phoneNumber']}")
        # Send notification to admin
    
    def handle_session_disconnected(self, event):
        print(f"Session {event['sessionId']} disconnected: {event['reason']}")
        # Attempt to reconnect
        self.reconnect_session(event['sessionId'])
    
    def send_reply(self, session_id, to, text):
        url = f"{self.api_base}/messages/send/text"
        headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            'sessionId': session_id,
            'to': to,
            'text': text
        }
        
        response = requests.post(url, headers=headers, json=payload)
        return response.json()
    
    def reconnect_session(self, session_id):
        url = f"{self.api_base}/sessions/{session_id}/restart"
        headers = {'Authorization': f'Bearer {self.api_token}'}
        
        response = requests.post(url, headers=headers)
        return response.json()

webhook_handler = WebhookHandler(
    os.getenv('WEBHOOK_SECRET'),
    os.getenv('WHATSAPP_JWT_TOKEN')
)

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        signature = request.headers.get('X-Webhook-Signature')
        payload = request.get_data()
        
        # Verify signature
        if not webhook_handler.verify_signature(payload, signature):
            return 'Unauthorized', 401
        
        # Parse and handle event
        event = json.loads(payload)
        webhook_handler.handle_event(event)
        
        return 'OK', 200
    except Exception as e:
        print(f"Webhook error: {e}")
        return 'Internal Server Error', 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=False)
```

### PHP Webhook Handler

```php
<?php

class WebhookHandler {
    private $secret;
    private $apiToken;
    private $apiBase = 'https://api.yourwhatsappapi.com/api';
    
    public function __construct($secret, $apiToken) {
        $this->secret = $secret;
        $this->apiToken = $apiToken;
    }
    
    public function verifySignature($payload, $signature) {
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $this->secret);
        return hash_equals($signature, $expectedSignature);
    }
    
    public function handleEvent($event) {
        error_log("Received event: " . $event['event']);
        
        switch ($event['event']) {
            case 'message.received':
                $this->handleIncomingMessage($event);
                break;
            case 'message.delivered':
                $this->handleMessageDelivered($event);
                break;
            case 'session.connected':
                $this->handleSessionConnected($event);
                break;
            case 'session.disconnected':
                $this->handleSessionDisconnected($event);
                break;
            default:
                error_log("Unknown event type: " . $event['event']);
        }
    }
    
    private function handleIncomingMessage($event) {
        error_log("New message from {$event['from']}: {$event['text']}");
        
        $text = strtolower($event['text']);
        $response = null;
        
        if (strpos($text, 'hello') !== false || strpos($text, 'hi') !== false) {
            $response = "Hello! 👋 How can I help you today?";
        } elseif (strpos($text, 'hours') !== false) {
            $response = "Our business hours are:\nMon-Fri: 9AM-6PM\nSat: 10AM-4PM\nSun: Closed";
        } elseif (strpos($text, 'contact') !== false) {
            $response = "📞 Phone: +1-234-567-8900\n📧 Email: support@example.com\n🌐 Website: www.example.com";
        }
        
        if ($response) {
            $this->sendReply($event['sessionId'], $event['from'], $response);
        }
    }
    
    private function sendReply($sessionId, $to, $text) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiBase . '/messages/send/text');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'sessionId' => $sessionId,
            'to' => $to,
            'text' => $text
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}

// Main webhook handler
$webhookHandler = new WebhookHandler(
    $_ENV['WEBHOOK_SECRET'],
    $_ENV['WHATSAPP_JWT_TOKEN']
);

// Get request data
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

// Verify signature
if (!$webhookHandler->verifySignature($payload, $signature)) {
    http_response_code(401);
    exit('Unauthorized');
}

// Parse and handle event
$event = json_decode($payload, true);
$webhookHandler->handleEvent($event);

http_response_code(200);
echo 'OK';
?>
```

## Advanced Features

### Webhook Retry Logic

The API automatically retries failed webhook deliveries:

- **Initial delivery**: Immediate
- **First retry**: After 30 seconds
- **Second retry**: After 5 minutes  
- **Third retry**: After 30 minutes
- **Final retry**: After 2 hours

### Webhook Queue Management

Monitor webhook queue status:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/webhook/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "queue": {
    "pending": 5,
    "processing": 2,
    "failed": 1,
    "retrying": 3
  }
}
```

Clear webhook queue:

```bash
curl -X DELETE https://api.yourwhatsappapi.com/api/webhook/queue/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Webhook Statistics

Get webhook delivery statistics:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/webhook/stats/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSent": 1250,
    "successful": 1245,
    "failed": 5,
    "averageResponseTime": "145ms",
    "lastDelivery": "2024-01-01T12:00:00.000Z",
    "byEvent": {
      "message.received": 800,
      "message.sent": 300,
      "message.delivered": 120,
      "session.connected": 25
    }
  }
}
```

## Testing Webhooks

### ngrok for Local Development

```bash
# Install ngrok
npm install -g ngrok

# Start your local webhook server
node webhook-server.js

# Expose local server via ngrok
ngrok http 3000

# Use the ngrok URL in webhook configuration
# https://abc123.ngrok.io/webhook
```

### Webhook Testing Tools

#### Webhook.site
Use [webhook.site](https://webhook.site) for quick testing:

```bash
curl -X PUT https://api.yourwhatsappapi.com/api/webhook/config/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-unique-url",
    "events": ["message.received"]
  }'
```

#### Postman Mock Server
Create a mock server in Postman for testing.

### Test Script

```javascript
// webhook-test.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('Webhook received:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('Headers:');
  console.log(JSON.stringify(req.headers, null, 2));
  
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Test webhook server running on port 3000');
});
```

## Common Issues & Solutions

### Webhook Not Receiving Events

1. **Check URL accessibility**: Ensure URL is publicly accessible
2. **Verify HTTPS**: Webhooks require HTTPS
3. **Check firewall**: Ensure port is open
4. **Validate SSL certificate**: Must be valid and trusted

### Signature Verification Failing

1. **Check secret**: Ensure webhook secret matches
2. **Raw body parsing**: Use raw body, not parsed JSON
3. **Encoding issues**: Ensure UTF-8 encoding
4. **Timing attacks**: Use constant-time comparison

### High Webhook Failures

1. **Response time**: Return 200 OK quickly (< 5 seconds)
2. **Error handling**: Handle errors gracefully
3. **Idempotency**: Handle duplicate deliveries
4. **Monitoring**: Monitor webhook endpoint health

### Performance Optimization

```javascript
// Optimized webhook handler
class OptimizedWebhookHandler {
  constructor() {
    this.eventQueue = [];
    this.processing = false;
  }

  async handleWebhook(event) {
    // Add to queue for async processing
    this.eventQueue.push(event);
    this.processQueue();
    
    // Return immediately
    return { status: 'queued' };
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      try {
        await this.processEvent(event);
      } catch (error) {
        console.error('Event processing error:', error);
      }
    }

    this.processing = false;
  }

  async processEvent(event) {
    // Heavy processing logic here
    switch (event.event) {
      case 'message.received':
        await this.processIncomingMessage(event);
        break;
      // ... other event types
    }
  }
}
```

---

**Next Steps:** Explore [Examples](./examples.md) or learn about [Error Codes](./error-codes.md) 