# API Reference

Complete reference for all WhatsApp API endpoints with request/response formats, parameters, and examples.

## Base URL
```
https://api.yourwhatsappapi.com/api
```

## Authentication
All protected endpoints require authentication via JWT token or API key:
```http
Authorization: Bearer YOUR_JWT_TOKEN
# OR
X-API-Key: YOUR_API_KEY
```

## Rate Limits
- **Authentication**: 5 requests/minute
- **Messages**: 10 requests/minute per session
- **QR Generation**: 3 requests/minute
- **General**: 100 requests/minute

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "apiKey": "wapi_1234567890abcdef"
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric + underscore
- `email`: Valid email address
- `password`: Minimum 8 characters

### POST /auth/login
Authenticate user and get JWT token.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Alternative with email:**
```json
{
  "email": "john@example.com",
  "password": "secure_password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "email": "john@example.com",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h"
}
```

### POST /auth/logout
Logout user (client-side token invalidation).

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### POST /auth/refresh
Refresh JWT token.

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "token": "YOUR_CURRENT_JWT_TOKEN"
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h"
}
```

### GET /auth/profile
Get current user profile.

**Request:**
```http
GET /api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "apiKey": "wapi_1234567890abcdef",
  "stats": {
    "totalSessions": 5,
    "activeSessions": 2,
    "messagesSent": 150,
    "messagesReceived": 89
  }
}
```

### PUT /auth/profile
Update user profile.

**Request:**
```http
PUT /api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "email": "newemail@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "email": "newemail@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /auth/change-password
Change user password.

**Request:**
```http
POST /api/auth/change-password
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_secure_password"
}
```

### POST /auth/regenerate-api-key
Generate new API key.

**Request:**
```http
POST /api/auth/regenerate-api-key
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "API key regenerated successfully",
  "apiKey": "wapi_new1234567890abcdef"
}
```

### DELETE /auth/account
Delete user account permanently.

**Request:**
```http
DELETE /api/auth/account
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Session Management Endpoints

### POST /sessions
Create a new WhatsApp session.

**Request:**
```http
POST /api/sessions
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "My Session",
  "description": "Production session for customer support"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "session": {
    "id": "5bc99cea8975b95fe7077c64a3312145",
    "name": "My Session",
    "description": "Production session for customer support",
    "status": "inactive",
    "phoneNumber": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /sessions
List all user sessions.

**Request:**
```http
GET /api/sessions
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `status`: Filter by status (inactive, connecting, connected, disconnected)
- `limit`: Number of sessions to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "5bc99cea8975b95fe7077c64a3312145",
      "name": "My Session",
      "description": "Production session",
      "status": "connected",
      "phoneNumber": "+1234567890",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "lastActivity": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### GET /sessions/{sessionId}
Get specific session details.

**Request:**
```http
GET /api/sessions/5bc99cea8975b95fe7077c64a3312145
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "5bc99cea8975b95fe7077c64a3312145",
    "name": "My Session",
    "description": "Production session",
    "status": "connected",
    "phoneNumber": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastActivity": "2024-01-01T12:00:00.000Z",
    "messageStats": {
      "sent": 150,
      "received": 89,
      "failed": 2
    }
  }
}
```

### POST /sessions/{sessionId}/start
Start a session to begin WhatsApp connection.

**Request:**
```http
POST /api/sessions/5bc99cea8975b95fe7077c64a3312145/start
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Session started successfully",
  "status": "connecting"
}
```

### POST /sessions/{sessionId}/stop
Stop an active session.

**Request:**
```http
POST /api/sessions/5bc99cea8975b95fe7077c64a3312145/stop
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Session stopped successfully",
  "status": "inactive"
}
```

### POST /sessions/{sessionId}/restart
Restart a session (stop and start).

**Request:**
```http
POST /api/sessions/5bc99cea8975b95fe7077c64a3312145/restart
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Session restarted successfully",
  "status": "connecting"
}
```

### POST /sessions/{sessionId}/clear-auth
Clear authentication and force new QR code.

**Request:**
```http
POST /api/sessions/5bc99cea8975b95fe7077c64a3312145/clear-auth
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication cleared successfully"
}
```

### GET /sessions/{sessionId}/status
Get session status.

**Request:**
```http
GET /api/sessions/5bc99cea8975b95fe7077c64a3312145/status
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "status": "connected",
  "phoneNumber": "+1234567890",
  "lastActivity": "2024-01-01T12:00:00.000Z"
}
```

### GET /sessions/{sessionId}/qr
Get QR code for session authentication.

**Request:**
```http
GET /api/sessions/5bc99cea8975b95fe7077c64a3312145/qr
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "QR code generated successfully"
}
```

### PUT /sessions/{sessionId}/settings
Update session settings.

**Request:**
```http
PUT /api/sessions/5bc99cea8975b95fe7077c64a3312145/settings
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Session Name",
  "description": "Updated description"
}
```

### DELETE /sessions/{sessionId}
Delete a session permanently.

**Request:**
```http
DELETE /api/sessions/5bc99cea8975b95fe7077c64a3312145
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Messaging Endpoints

### POST /messages/upload
Upload file for media messages.

**Request:**
```http
POST /api/messages/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

file: [binary file data]
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "file-1234567890.jpg",
    "originalname": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "url": "https://api.yourwhatsappapi.com/uploads/file-1234567890.jpg"
  }
}
```

**File Limits:**
- **Size**: 50MB maximum
- **Types**: Images (JPEG, PNG, GIF), Documents (PDF, DOC, DOCX), Videos (MP4, MOV, AVI), Audio (MP3, WAV, AAC)

### POST /messages/send/text
Send text message.

**Request:**
```http
POST /api/messages/send/text
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "text": "Hello! This is a test message 👋"
}
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

### POST /messages/send/image
Send image message.

**Request:**
```http
POST /api/messages/send/image
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "imageUrl": "https://api.yourwhatsappapi.com/uploads/file-1234567890.jpg",
  "caption": "Check out this image!"
}
```

**Alternative with base64:**
```json
{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "caption": "Check out this image!"
}
```

### POST /messages/send/document
Send document message.

**Request:**
```http
POST /api/messages/send/document
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "documentUrl": "https://api.yourwhatsappapi.com/uploads/file-1234567890.pdf",
  "filename": "report.pdf",
  "caption": "Monthly report"
}
```

### POST /messages/send/video
Send video message.

**Request:**
```http
POST /api/messages/send/video
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "videoUrl": "https://api.yourwhatsappapi.com/uploads/file-1234567890.mp4",
  "caption": "Check out this video!"
}
```

### POST /messages/send/audio
Send audio message.

**Request:**
```http
POST /api/messages/send/audio
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "audioUrl": "https://api.yourwhatsappapi.com/uploads/file-1234567890.mp3"
}
```

### POST /messages/send/location
Send location message.

**Request:**
```http
POST /api/messages/send/location
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "name": "San Francisco",
  "address": "San Francisco, CA, USA"
}
```

### POST /messages/send/contact
Send contact message.

**Request:**
```http
POST /api/messages/send/contact
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "to": "1234567890",
  "contact": {
    "fullName": "John Doe",
    "organization": "Example Corp",
    "phoneNumber": "+1234567890",
    "email": "john@example.com"
  }
}
```

### POST /messages/send/bulk
Send bulk messages to multiple recipients.

**Request:**
```http
POST /api/messages/send/bulk
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sessionId": "5bc99cea8975b95fe7077c64a3312145",
  "messages": [
    {
      "to": "1234567890",
      "text": "Hello {{name}}!",
      "variables": { "name": "John" }
    },
    {
      "to": "0987654321",
      "text": "Hello {{name}}!",
      "variables": { "name": "Jane" }
    }
  ]
}
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
      "messageId": "msg_1234567890"
    },
    {
      "to": "0987654321",
      "success": true,
      "messageId": "msg_0987654321"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

### GET /messages/history/{sessionId}
Get message history for a session.

**Request:**
```http
GET /api/messages/history/5bc99cea8975b95fe7077c64a3312145?limit=20&offset=0
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `limit`: Number of messages (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `from`: Filter by sender phone number
- `to`: Filter by recipient phone number
- `type`: Filter by message type (text, image, document, etc.)
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
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### GET /messages/stats/{sessionId}
Get message statistics for a session.

**Request:**
```http
GET /api/messages/stats/5bc99cea8975b95fe7077c64a3312145
Authorization: Bearer YOUR_JWT_TOKEN
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
    }
  }
}
```

---

## Webhook Endpoints

### PUT /webhook/config/{sessionId}
Configure webhook for a session.

**Request:**
```http
PUT /api/webhook/config/5bc99cea8975b95fe7077c64a3312145
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["message", "status"],
  "secret": "your_webhook_secret"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook configured successfully",
  "config": {
    "url": "https://your-server.com/webhook",
    "events": ["message", "status"],
    "secret": "your_webhook_secret",
    "isActive": true
  }
}
```

### GET /webhook/config/{sessionId}
Get webhook configuration.

**Request:**
```http
GET /api/webhook/config/5bc99cea8975b95fe7077c64a3312145
Authorization: Bearer YOUR_JWT_TOKEN
```

### GET /webhook/stats/{sessionId}
Get webhook statistics.

**Request:**
```http
GET /api/webhook/stats/5bc99cea8975b95fe7077c64a3312145
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSent": 150,
    "successful": 148,
    "failed": 2,
    "lastDelivery": "2024-01-01T12:00:00.000Z"
  }
}
```

### POST /webhook/test
Test webhook endpoint.

**Request:**
```http
POST /api/webhook/test
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "payload": {
    "test": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /webhook/queue
Get webhook queue status.

**Response:**
```json
{
  "success": true,
  "queue": {
    "pending": 5,
    "processing": 2,
    "failed": 1
  }
}
```

### DELETE /webhook/queue/{sessionId}
Clear webhook queue for session.

### GET /webhook/event-types
Get available webhook event types.

**Response:**
```json
{
  "success": true,
  "eventTypes": [
    "message",
    "status",
    "qr",
    "ready",
    "disconnected"
  ]
}
```

---

## Status Endpoints

### GET /status/health
Health check endpoint (public).

**Request:**
```http
GET /api/status/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### GET /status/info
API information (public).

**Response:**
```json
{
  "name": "WhatsApp API",
  "version": "1.0.0",
  "description": "WhatsApp Business API",
  "docs": "https://api.yourwhatsappapi.com/docs"
}
```

### GET /status
System status (requires authentication).

**Response:**
```json
{
  "success": true,
  "status": "operational",
  "uptime": 86400,
  "sessions": {
    "total": 25,
    "active": 18,
    "connected": 15
  },
  "messages": {
    "sent24h": 1250,
    "received24h": 890
  }
}
```

### GET /status/stats
Detailed system statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "uptime": 86400,
    "memory": {
      "used": "256MB",
      "total": "1GB"
    },
    "sessions": {
      "total": 25,
      "active": 18,
      "connected": 15,
      "connecting": 3
    },
    "messages": {
      "totalSent": 15000,
      "totalReceived": 8900,
      "sent24h": 1250,
      "received24h": 890
    }
  }
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes
- **200 OK** - Success
- **201 Created** - Resource created
- **400 Bad Request** - Invalid request
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

### Common Error Codes
- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID_CREDENTIALS` - Invalid credentials
- `AUTH_TOKEN_EXPIRED` - JWT token expired
- `SESSION_NOT_FOUND` - Session not found
- `SESSION_NOT_CONNECTED` - Session not connected
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `FILE_TOO_LARGE` - Uploaded file too large
- `INVALID_PHONE_NUMBER` - Invalid phone number format

---

**Next:** Explore [Session Management](./sessions.md) or [Messaging Guide](./messaging.md) 