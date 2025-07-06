# WhatsApp API Documentation

Welcome to the comprehensive WhatsApp API documentation. This API allows you to send and receive WhatsApp messages programmatically, manage sessions, and integrate WhatsApp messaging into your applications.

## 📚 Table of Contents

1. [Getting Started](./getting-started.md)
2. [Authentication](./authentication.md)
3. [API Reference](./api-reference.md)
4. [Session Management](./sessions.md)
5. [Messaging](./messaging.md)
6. [Webhooks](./webhooks.md)
7. [Examples](./examples.md)
8. [SDKs & Libraries](./sdks.md)
9. [Error Codes](./error-codes.md)
10. [Rate Limiting](./rate-limiting.md)
11. [FAQ](./faq.md)

## 🚀 Quick Start

### Base URL
```
https://api.yourwhatsappapi.com/api
```

### Authentication
All API requests (except public endpoints) require authentication via JWT token or API key.

```bash
# Using JWT Token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -X GET https://api.yourwhatsappapi.com/api/sessions

# Using API Key
curl -H "X-API-Key: YOUR_API_KEY" \
     -X GET https://api.yourwhatsappapi.com/api/sessions
```

### Send Your First Message
```bash
curl -X POST https://api.yourwhatsappapi.com/api/messages/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your-session-id",
    "to": "1234567890",
    "text": "Hello from WhatsApp API!"
  }'
```

## 🔗 Quick Links

- **[Getting Started Guide](./getting-started.md)** - Complete setup walkthrough
- **[Authentication Guide](./authentication.md)** - JWT & API key authentication
- **[Session Management](./sessions.md)** - Create and manage WhatsApp sessions
- **[Messaging Guide](./messaging.md)** - Send text, images, documents, and more
- **[Webhook Setup](./webhooks.md)** - Receive real-time updates
- **[Code Examples](./examples.md)** - Working examples in multiple languages

## 📊 API Overview

### Core Features
- ✅ **Session Management** - Create, start, stop, and monitor WhatsApp sessions
- ✅ **Text Messages** - Send and receive text messages
- ✅ **Media Messages** - Send images, documents, videos, and audio
- ✅ **Location Sharing** - Send location coordinates
- ✅ **Contact Sharing** - Send contact information
- ✅ **Bulk Messaging** - Send messages to multiple recipients
- ✅ **Webhooks** - Real-time message and status updates
- ✅ **Message History** - Retrieve conversation history
- ✅ **QR Code Generation** - Get QR codes for session authentication

### Supported Message Types
- 📝 Text Messages
- 🖼️ Images (JPEG, PNG, GIF)
- 📄 Documents (PDF, DOC, DOCX)
- 🎥 Videos (MP4, MOV, AVI)
- 🎵 Audio (MP3, WAV, AAC)
- 📍 Location
- 👤 Contacts
- 📊 Bulk Messages

## 🛠️ API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/regenerate-api-key` - Regenerate API key

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List all sessions
- `POST /api/sessions/{id}/start` - Start session
- `GET /api/sessions/{id}/qr` - Get QR code

### Messages
- `POST /api/messages/send/text` - Send text message
- `POST /api/messages/send/image` - Send image message
- `POST /api/messages/send/document` - Send document
- `POST /api/messages/send/bulk` - Send bulk messages
- `GET /api/messages/history/{sessionId}` - Get message history

### Webhooks
- `PUT /api/webhook/config/{sessionId}` - Configure webhook
- `GET /api/webhook/stats` - Get webhook statistics
- `POST /api/webhook/test` - Test webhook endpoint

### Status
- `GET /api/status/health` - Health check
- `GET /api/status/stats` - System statistics

## 📖 Documentation Sections

### [Getting Started](./getting-started.md)
Complete setup guide including:
- Account registration
- API key generation
- First session creation
- Sending your first message

### [Authentication](./authentication.md)
Authentication methods and security:
- JWT token authentication
- API key authentication
- Token refresh and management
- Security best practices

### [Session Management](./sessions.md)
WhatsApp session handling:
- Creating sessions
- QR code authentication
- Session status monitoring
- Session lifecycle management

### [Messaging](./messaging.md)
Comprehensive messaging guide:
- Text messages
- Media messages (images, documents, videos, audio)
- Location sharing
- Contact sharing
- Bulk messaging
- Message templates

### [Webhooks](./webhooks.md)
Real-time updates and notifications:
- Webhook configuration
- Event types
- Payload formats
- Retry mechanisms
- Security considerations

### [Examples](./examples.md)
Code examples in multiple languages:
- JavaScript/Node.js
- Python
- PHP
- cURL
- Postman collections

## 🔧 Development Tools

### Postman Collection
Import our Postman collection for easy API testing:
```json
{
  "collection": "WhatsApp API Collection",
  "url": "https://api.yourwhatsappapi.com/docs/postman-collection.json"
}
```

### OpenAPI Specification
Access our OpenAPI 3.0 specification:
```
https://api.yourwhatsappapi.com/docs/openapi.json
```

### Interactive API Explorer
Try our API endpoints interactively:
```
https://api.yourwhatsappapi.com/docs/explorer
```

## 🆘 Support

### Community Support
- **Discord**: Join our developer community
- **GitHub**: Report issues and contribute
- **Stack Overflow**: Tag questions with `whatsapp-api`

### Enterprise Support
- **Email**: enterprise@yourwhatsappapi.com
- **Phone**: +1-800-WHATSAPP
- **Priority Support**: Available for enterprise customers

## 🔄 API Versioning

The API uses semantic versioning. Current version: `v1.0.0`

- **Major versions**: Breaking changes
- **Minor versions**: New features, backward compatible
- **Patch versions**: Bug fixes

## 📄 License

This API documentation is licensed under MIT License. See [LICENSE](./LICENSE) for details.

## 🔄 Changelog

View the [CHANGELOG](./CHANGELOG.md) for API updates and changes.

---

**Need Help?** Check our [FAQ](./faq.md) or contact support at support@yourwhatsappapi.com 