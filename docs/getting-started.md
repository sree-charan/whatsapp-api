# Getting Started with WhatsApp API

This guide will walk you through setting up your first WhatsApp API integration, from registration to sending your first message.

## Prerequisites

Before you begin, ensure you have:
- A valid WhatsApp phone number
- Basic knowledge of REST APIs
- A development environment (Node.js, Python, PHP, or similar)
- cURL or Postman for testing

## Step 1: Account Registration

### Register Your Account

1. **Create an account** by calling the registration endpoint:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "email": "your@email.com",
    "password": "your_secure_password"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_123",
    "username": "your_username",
    "email": "your@email.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "apiKey": "wapi_1234567890abcdef"
}
```

### Save Your Credentials

**Important:** Save these credentials securely:
- **JWT Token**: For browser-based authentication (expires in 24h)
- **API Key**: For server-to-server authentication (permanent)

## Step 2: Authentication

You can authenticate using either JWT tokens or API keys:

### Option A: JWT Token Authentication
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -X GET https://api.yourwhatsappapi.com/api/auth/profile
```

### Option B: API Key Authentication
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     -X GET https://api.yourwhatsappapi.com/api/auth/profile
```

### Login (if you already have an account)
```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

## Step 3: Create Your First Session

A session represents a WhatsApp connection for a specific phone number.

```bash
curl -X POST https://api.yourwhatsappapi.com/api/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Session",
    "description": "Test session for development"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "session": {
    "id": "5bc99cea8975b95fe7077c64a3312145",
    "name": "My First Session",
    "description": "Test session for development",
    "status": "inactive",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "phoneNumber": null
  }
}
```

**Save the Session ID:** You'll need this for all subsequent operations.

## Step 4: Start the Session

Start your session to begin the WhatsApp connection process:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/sessions/YOUR_SESSION_ID/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Session started successfully",
  "status": "connecting"
}
```

## Step 5: Get QR Code for Authentication

WhatsApp requires QR code authentication to link your phone:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/sessions/YOUR_SESSION_ID/qr \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "QR code generated successfully"
}
```

### Scan the QR Code

1. **Open WhatsApp** on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **"Link a Device"**
4. **Scan the QR code** from the API response
5. Wait for the connection to be established

## Step 6: Monitor Session Status

Check if your session is connected:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/sessions/YOUR_SESSION_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Status Values:**
- `inactive` - Session not started
- `connecting` - Attempting to connect
- `qr_generated` - QR code ready for scanning
- `connected` - Successfully connected
- `disconnected` - Connection lost

## Step 7: Send Your First Message

Once your session status is `connected`, you can send messages:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "to": "1234567890",
    "text": "Hello! This is my first message from WhatsApp API 🎉"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "msg_1234567890",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Step 8: Verify Message Delivery

Check your message history to confirm delivery:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/messages/history/YOUR_SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

Congratulations! You've successfully:
✅ Created an account  
✅ Generated API credentials  
✅ Created a WhatsApp session  
✅ Connected via QR code  
✅ Sent your first message  

### What's Next?

1. **[Explore Message Types](./messaging.md)** - Send images, documents, location, and more
2. **[Set Up Webhooks](./webhooks.md)** - Receive real-time message updates
3. **[Bulk Messaging](./messaging.md#bulk-messaging)** - Send messages to multiple recipients
4. **[Error Handling](./error-codes.md)** - Learn about error codes and handling

### Development Tips

#### Environment Variables
Store your credentials securely:

```bash
# .env file
WHATSAPP_API_KEY=your_api_key_here
WHATSAPP_BASE_URL=https://api.yourwhatsappapi.com/api
WHATSAPP_SESSION_ID=your_session_id_here
```

#### Rate Limiting
Be aware of rate limits:
- **Authentication**: 5 requests per minute
- **Messages**: 10 messages per minute per session
- **QR Generation**: 3 requests per minute
- **General**: 100 requests per minute

#### Session Management
- Sessions automatically reconnect after disconnection
- Keep your session active by sending periodic status checks
- Monitor webhook events for connection status

## Troubleshooting

### Common Issues

#### Session Won't Connect
- Ensure your phone has internet connection
- Check if WhatsApp Web is already active on another device
- Try regenerating the QR code if it expires

#### QR Code Not Generated
- Verify session is in `connecting` status
- Check rate limits (max 3 QR requests per minute)
- Ensure session ID is correct

#### Messages Not Sending
- Confirm session status is `connected`
- Verify recipient phone number format (international format without +)
- Check rate limits and quota

#### Authentication Errors
- Verify JWT token hasn't expired (24h lifetime)
- Check API key format and validity
- Ensure proper headers are set

### Getting Help

If you encounter issues:

1. **Check our [FAQ](./faq.md)** for common solutions
2. **Review [Error Codes](./error-codes.md)** for specific error meanings
3. **Join our Discord** for community support
4. **Contact support** at support@yourwhatsappapi.com

## Code Examples

### Node.js Example
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.yourwhatsappapi.com/api',
  headers: {
    'Authorization': `Bearer ${process.env.WHATSAPP_JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function sendMessage() {
  try {
    const response = await api.post('/messages/send/text', {
      sessionId: process.env.WHATSAPP_SESSION_ID,
      to: '1234567890',
      text: 'Hello from Node.js!'
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python Example
```python
import requests
import os

api_url = "https://api.yourwhatsappapi.com/api"
headers = {
    "Authorization": f"Bearer {os.getenv('WHATSAPP_JWT_TOKEN')}",
    "Content-Type": "application/json"
}

def send_message():
    payload = {
        "sessionId": os.getenv('WHATSAPP_SESSION_ID'),
        "to": "1234567890",
        "text": "Hello from Python!"
    }
    
    response = requests.post(f"{api_url}/messages/send/text", 
                           json=payload, headers=headers)
    
    if response.status_code == 200:
        print("Message sent:", response.json())
    else:
        print("Error:", response.json())
```

## Security Best Practices

1. **Never expose credentials** in client-side code
2. **Use environment variables** for sensitive data
3. **Implement proper error handling**
4. **Monitor rate limits** to avoid being blocked
5. **Use HTTPS** for all API calls
6. **Rotate API keys** regularly for production use

---

**Ready to dive deeper?** Continue with [Authentication](./authentication.md) or explore [Message Types](./messaging.md). 