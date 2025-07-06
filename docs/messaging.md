# Messaging

The WhatsApp API supports various message types including text, images, documents, videos, audio, location, and contacts. This guide covers all messaging capabilities with detailed examples.

## Message Types Overview

| Type | Description | Max Size | Formats |
|------|-------------|----------|---------|
| Text | Plain text messages | 4096 characters | UTF-8 |
| Image | Image files | 16MB | JPEG, PNG, GIF |
| Document | File attachments | 100MB | PDF, DOC, DOCX, XLS, etc. |
| Video | Video files | 16MB | MP4, MOV, AVI |
| Audio | Audio files | 16MB | MP3, WAV, AAC, OGG |
| Location | GPS coordinates | N/A | Lat/Long |
| Contact | Contact information | N/A | vCard format |

## Prerequisites

Before sending messages:
1. **Active Session**: Session must be in `connected` status
2. **Valid Phone Number**: International format without `+` (e.g., `1234567890`)
3. **Authentication**: Valid JWT token or API key

## Text Messages

### Basic Text Message

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "text": "Hello! This is a test message from WhatsApp API 👋"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "msg_1234567890",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "to": "1234567890"
}
```

### Text with Formatting

WhatsApp supports basic text formatting:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "text": "*Bold text*\n_Italic text_\n~Strikethrough~\n```Monospace```"
  }'
```

**Formatting Options:**
- `*Bold*` → **Bold**
- `_Italic_` → *Italic*
- `~Strikethrough~` → ~~Strikethrough~~
- `` `Monospace` `` → `Monospace`
- ```` ```Code block``` ````

### Text with Emojis

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "text": "Welcome to our service! 🎉\n\n✅ Account created\n📧 Email verified\n🔒 Security enabled\n\nEnjoy messaging! 💬"
  }'
```

## Image Messages

### Send Image from URL

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "imageUrl": "https://example.com/image.jpg",
    "caption": "Check out this amazing image! 📸"
  }'
```

### Send Image from Upload

First, upload the image:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "file-1234567890.jpg",
    "originalname": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "url": "https://api.yourwhatsappapi.com/uploads/file-1234567890.jpg"
  }
}
```

Then send the image:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "imageUrl": "https://api.yourwhatsappapi.com/uploads/file-1234567890.jpg",
    "caption": "Uploaded image with caption"
  }'
```

### Send Image with Base64

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "caption": "Base64 encoded image"
  }'
```

## Document Messages

### Send Document

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "documentUrl": "https://api.yourwhatsappapi.com/uploads/report.pdf",
    "filename": "Monthly_Report_January.pdf",
    "caption": "Monthly performance report"
  }'
```

### Document Upload Example

```bash
# Upload document
curl -X POST https://api.yourwhatsappapi.com/api/messages/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/document.pdf"

# Send document
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "documentUrl": "https://api.yourwhatsappapi.com/uploads/file-1234567890.pdf",
    "filename": "Important_Document.pdf",
    "caption": "Please review this document"
  }'
```

**Supported Document Types:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)
- Text files (.txt)
- And many more...

## Video Messages

### Send Video

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/video \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "videoUrl": "https://api.yourwhatsappapi.com/uploads/video.mp4",
    "caption": "Check out this video! 🎥"
  }'
```

### Video with Thumbnail

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/video \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "videoUrl": "https://api.yourwhatsappapi.com/uploads/video.mp4",
    "thumbnailUrl": "https://api.yourwhatsappapi.com/uploads/thumbnail.jpg",
    "caption": "Video with custom thumbnail"
  }'
```

**Supported Video Types:**
- MP4 (.mp4) - Recommended
- MOV (.mov)
- AVI (.avi)
- WebM (.webm)

## Audio Messages

### Send Audio

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/audio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "audioUrl": "https://api.yourwhatsappapi.com/uploads/audio.mp3"
  }'
```

### Voice Message (PTT)

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/audio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "audioUrl": "https://api.yourwhatsappapi.com/uploads/voice.ogg",
    "ptt": true
  }'
```

**Audio Formats:**
- MP3 (.mp3) - Most compatible
- WAV (.wav) - High quality
- AAC (.aac) - Good compression
- OGG (.ogg) - For voice messages

## Location Messages

### Send Location

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/location \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "name": "San Francisco",
    "address": "San Francisco, CA, USA"
  }'
```

### Live Location

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/location \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "name": "Current Location",
    "address": "123 Main St, San Francisco, CA",
    "live": true,
    "duration": 3600
  }'
```

## Contact Messages

### Send Contact

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "contact": {
      "fullName": "John Doe",
      "organization": "Example Corp",
      "phoneNumber": "+1234567890",
      "email": "john@example.com",
      "url": "https://johndoe.com"
    }
  }'
```

### Multiple Contacts

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "contacts": [
      {
        "fullName": "John Doe",
        "phoneNumber": "+1234567890",
        "email": "john@example.com"
      },
      {
        "fullName": "Jane Smith", 
        "phoneNumber": "+0987654321",
        "email": "jane@example.com"
      }
    ]
  }'
```

## Bulk Messaging

### Send to Multiple Recipients

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "messages": [
      {
        "to": "1234567890",
        "text": "Hello {{name}}! Your order {{order_id}} is ready.",
        "variables": {
          "name": "John",
          "order_id": "12345"
        }
      },
      {
        "to": "0987654321",
        "text": "Hello {{name}}! Your order {{order_id}} is ready.",
        "variables": {
          "name": "Jane",
          "order_id": "67890"
        }
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk messages sent successfully",
  "results": [
    {
      "to": "1234567890",
      "success": true,
      "messageId": "msg_1234567890",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "to": "0987654321",
      "success": true,
      "messageId": "msg_0987654321",
      "timestamp": "2024-01-01T00:00:01.000Z"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

### Bulk with Different Message Types

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "messages": [
      {
        "to": "1234567890",
        "type": "text",
        "text": "Hello John! Here is your invoice."
      },
      {
        "to": "1234567890",
        "type": "document",
        "documentUrl": "https://example.com/invoice.pdf",
        "filename": "invoice_john.pdf"
      },
      {
        "to": "0987654321",
        "type": "image",
        "imageUrl": "https://example.com/promo.jpg",
        "caption": "Special offer just for you!"
      }
    ]
  }'
```

## Message Templates

### Create Templates

```javascript
// Template examples
const templates = {
  welcome: {
    text: "Welcome to {{company_name}}! 🎉\n\nHi {{customer_name}},\n\nThanks for joining us. Your account is now active.\n\nBest regards,\nThe {{company_name}} Team",
    variables: ["company_name", "customer_name"]
  },
  
  order_confirmation: {
    text: "Order Confirmed! 📦\n\nHi {{customer_name}},\n\nYour order {{order_id}} has been confirmed.\n\nTotal: {{total_amount}}\nEstimated delivery: {{delivery_date}}\n\nTrack your order: {{tracking_url}}",
    variables: ["customer_name", "order_id", "total_amount", "delivery_date", "tracking_url"]
  },
  
  appointment_reminder: {
    text: "Appointment Reminder ⏰\n\nHi {{customer_name}},\n\nThis is a reminder about your appointment:\n\nDate: {{appointment_date}}\nTime: {{appointment_time}}\nLocation: {{location}}\n\nPlease reply to confirm.",
    variables: ["customer_name", "appointment_date", "appointment_time", "location"]
  }
};
```

### Using Templates

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "5bc99cea8975b95fe7077c64a3312145",
    "to": "1234567890",
    "text": "Welcome to {{company_name}}! 🎉\n\nHi {{customer_name}},\n\nThanks for joining us. Your account is now active.\n\nBest regards,\nThe {{company_name}} Team",
    "variables": {
      "company_name": "ABC Corp",
      "customer_name": "John Doe"
    }
  }'
```

## Message History

### Get Message History

```bash
curl -X GET https://api.yourwhatsappapi.com/api/messages/history/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `limit`: Number of messages (default: 50, max: 100)
- `offset`: Pagination offset
- `from`: Filter by sender phone number
- `to`: Filter by recipient phone number
- `type`: Filter by message type
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_1234567890",
      "type": "text",
      "from": "me",
      "to": "1234567890",
      "text": "Hello!",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "delivered"
    },
    {
      "id": "msg_0987654321",
      "type": "image",
      "from": "1234567890",
      "to": "me",
      "imageUrl": "https://example.com/image.jpg",
      "caption": "Check this out!",
      "timestamp": "2024-01-01T00:01:00.000Z",
      "status": "received"
    }
  ],
  "total": 2,
  "hasMore": false
}
```

### Message Statistics

```bash
curl -X GET https://api.yourwhatsappapi.com/api/messages/stats/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 239,
    "sent": 150,
    "received": 89,
    "failed": 2,
    "byType": {
      "text": 180,
      "image": 35,
      "document": 15,
      "video": 5,
      "audio": 3,
      "location": 1
    },
    "byStatus": {
      "sent": 150,
      "delivered": 148,
      "read": 145,
      "failed": 2
    },
    "byDay": {
      "2024-01-01": { "sent": 45, "received": 23 },
      "2024-01-02": { "sent": 52, "received": 31 },
      "2024-01-03": { "sent": 53, "received": 35 }
    }
  }
}
```

## Best Practices

### Message Formatting

```javascript
// Good formatting
const message = {
  text: `🎉 *Welcome to Our Service!*

Hi ${customerName},

Your account has been created successfully.

📧 Email: ${email}
📱 Phone: ${phone}
🔑 Account ID: ${accountId}

_Next steps:_
1. Verify your email
2. Complete your profile
3. Start using our service

Need help? Reply to this message.

Best regards,
The Support Team`
};

// Avoid long lines without breaks
const badMessage = {
  text: "Welcome to our service your account has been created successfully and you can now start using all our features please verify your email and complete your profile to get started if you need help please contact support thank you for joining us"
};
```

### Rate Limiting

```javascript
// Implement rate limiting
class MessageSender {
  constructor(apiKey) {
    this.api = new WhatsAppAPI(apiKey);
    this.queue = [];
    this.isProcessing = false;
  }

  async sendMessage(sessionId, to, text) {
    return new Promise((resolve, reject) => {
      this.queue.push({ sessionId, to, text, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const { sessionId, to, text, resolve, reject } = this.queue.shift();
      
      try {
        const result = await this.api.sendText(sessionId, to, text);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Rate limiting: 10 messages per minute
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
    
    this.isProcessing = false;
  }
}
```

### Error Handling

```javascript
async function sendMessageWithRetry(sessionId, to, text, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await api.sendText(sessionId, to, text);
      return result;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      if (error.code === 'SESSION_NOT_CONNECTED') {
        await restartSession(sessionId);
        continue;
      }
      
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        await new Promise(resolve => setTimeout(resolve, 60000));
        continue;
      }
      
      if (i === maxRetries - 1) {
        throw error;
      }
    }
  }
}
```

### Message Validation

```javascript
function validateMessage(message) {
  // Phone number validation
  if (!message.to || !/^\d{10,15}$/.test(message.to)) {
    throw new Error('Invalid phone number');
  }
  
  // Text length validation
  if (message.text && message.text.length > 4096) {
    throw new Error('Text message too long');
  }
  
  // File size validation
  if (message.imageUrl && message.fileSize > 16 * 1024 * 1024) {
    throw new Error('Image file too large');
  }
  
  return true;
}
```

## Integration Examples

### Node.js Integration

```javascript
const WhatsAppAPI = require('./whatsapp-api');

class MessageService {
  constructor(apiKey) {
    this.api = new WhatsAppAPI(apiKey);
  }

  async sendWelcomeMessage(sessionId, phoneNumber, customerName) {
    const message = {
      sessionId,
      to: phoneNumber,
      text: `Welcome to our service, ${customerName}! 🎉\n\nYour account is now active and ready to use.\n\nIf you need help, just reply to this message.`
    };
    
    return await this.api.sendText(message);
  }

  async sendOrderConfirmation(sessionId, phoneNumber, orderDetails) {
    // Send text confirmation
    await this.api.sendText({
      sessionId,
      to: phoneNumber,
      text: `Order confirmed! 📦\n\nOrder ID: ${orderDetails.id}\nTotal: $${orderDetails.total}\n\nWe'll send you the invoice shortly.`
    });
    
    // Send invoice document
    await this.api.sendDocument({
      sessionId,
      to: phoneNumber,
      documentUrl: orderDetails.invoiceUrl,
      filename: `invoice_${orderDetails.id}.pdf`,
      caption: 'Your invoice'
    });
  }
}
```

### Python Integration

```python
import requests
import json

class WhatsAppMessenger:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def send_text(self, session_id, to, text):
        payload = {
            'sessionId': session_id,
            'to': to,
            'text': text
        }
        
        response = requests.post(
            f"{self.base_url}/messages/send/text",
            headers=self.headers,
            json=payload
        )
        
        return response.json()
    
    def send_promotional_campaign(self, session_id, contacts):
        messages = []
        
        for contact in contacts:
            message = {
                'to': contact['phone'],
                'text': f"Hi {contact['name']}! 🎉\n\nSpecial offer just for you: {contact['offer']}\n\nValid until: {contact['expiry']}\n\nDon't miss out!",
                'variables': {
                    'name': contact['name'],
                    'offer': contact['offer'],
                    'expiry': contact['expiry']
                }
            }
            messages.append(message)
        
        payload = {
            'sessionId': session_id,
            'messages': messages
        }
        
        response = requests.post(
            f"{self.base_url}/messages/send/bulk",
            headers=self.headers,
            json=payload
        )
        
        return response.json()
```

## Common Issues & Solutions

### Message Not Delivered

1. **Check session status**: Ensure session is connected
2. **Verify phone number**: Use international format without '+'
3. **Check rate limits**: Don't exceed 10 messages per minute
4. **Validate content**: Ensure text is under 4096 characters

### Media Upload Failures

1. **File size**: Keep under limits (16MB for images/videos)
2. **File format**: Use supported formats
3. **Network timeout**: Implement retry logic
4. **Storage space**: Monitor server storage

### Performance Optimization

```javascript
// Optimize for high-volume messaging
class OptimizedMessenger {
  constructor(apiKey) {
    this.api = new WhatsAppAPI(apiKey);
    this.messageQueue = [];
    this.batchSize = 50;
  }

  async sendBulkOptimized(sessionId, messages) {
    // Process in batches
    const batches = this.chunkArray(messages, this.batchSize);
    const results = [];
    
    for (const batch of batches) {
      const batchResult = await this.api.sendBulk({
        sessionId,
        messages: batch
      });
      
      results.push(...batchResult.results);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

---

**Next Steps:** Learn about [Webhooks](./webhooks.md) or explore [Examples](./examples.md) 