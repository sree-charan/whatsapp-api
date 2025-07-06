# Authentication

The WhatsApp API supports two authentication methods: JWT tokens for browser-based applications and API keys for server-to-server communication.

## Authentication Methods

### 1. JWT Token Authentication

JWT (JSON Web Token) authentication is ideal for browser applications and provides temporary access.

#### Obtaining a JWT Token

**Login to get a token:**
```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "username": "your_username",
    "email": "your@email.com",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

#### Using JWT Token

Include the JWT token in the `Authorization` header:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/sessions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Token Properties
- **Lifetime**: 24 hours
- **Format**: Bearer token
- **Auto-refresh**: Not supported (must re-login)
- **Scope**: Full API access for the authenticated user

### 2. API Key Authentication

API keys provide permanent access and are ideal for server-to-server integrations.

#### Obtaining an API Key

**During Registration:**
```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "email": "your@email.com",
    "password": "your_password"
  }'
```

**Response includes API key:**
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "apiKey": "wapi_1234567890abcdef"
}
```

**Regenerate existing API key:**
```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/regenerate-api-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Using API Key

Include the API key in the `X-API-Key` header:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/sessions \
  -H "X-API-Key: wapi_1234567890abcdef"
```

#### API Key Properties
- **Lifetime**: Permanent (until regenerated)
- **Format**: `wapi_` prefix + random string
- **Regeneration**: Available via API
- **Scope**: Full API access for the authenticated user

## User Management

### User Registration

Create a new user account:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password123"
  }'
```

**Request Body:**
```json
{
  "username": "string",     // Required: 3-30 characters, alphanumeric + underscore
  "email": "string",        // Required: Valid email address
  "password": "string"      // Required: Minimum 8 characters
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
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "apiKey": "wapi_1234567890abcdef"
}
```

### User Login

Authenticate an existing user:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "secure_password123"
  }'
```

**Alternative login with email:**
```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure_password123"
  }'
```

### User Logout

Logout (client-side token invalidation):

```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User Profile

Retrieve current user information:

```bash
curl -X GET https://api.yourwhatsappapi.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "username": "john_doe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
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

### Update User Profile

Update user information:

```bash
curl -X PUT https://api.yourwhatsappapi.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

**Updatable Fields:**
- `email`: Valid email address
- `firstName`: User's first name
- `lastName`: User's last name

### Change Password

Update user password:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old_password",
    "newPassword": "new_secure_password"
  }'
```

### Delete Account

Permanently delete user account:

```bash
curl -X DELETE https://api.yourwhatsappapi.com/api/auth/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

⚠️ **Warning**: This action permanently deletes the account and all associated sessions.

## Token Management

### Token Refresh

JWT tokens expire after 24 hours. Refresh them using:

```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_CURRENT_JWT_TOKEN"
  }'
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h"
}
```

### API Key Regeneration

Generate a new API key (invalidates the old one):

```bash
curl -X POST https://api.yourwhatsappapi.com/api/auth/regenerate-api-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "API key regenerated successfully",
  "apiKey": "wapi_new1234567890abcdef"
}
```

## Authentication Headers

### JWT Token Header
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key Header
```http
X-API-Key: wapi_1234567890abcdef
```

### Both Headers (API Key takes precedence)
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-API-Key: wapi_1234567890abcdef
```

## Error Responses

### Invalid Credentials
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS",
  "status": 401
}
```

### Token Expired
```json
{
  "error": "Token has expired",
  "code": "AUTH_TOKEN_EXPIRED",
  "status": 401
}
```

### Invalid API Key
```json
{
  "error": "Invalid API key",
  "code": "AUTH_INVALID_API_KEY",
  "status": 401
}
```

### Account Inactive
```json
{
  "error": "Account is inactive",
  "code": "AUTH_ACCOUNT_INACTIVE",
  "status": 401
}
```

### Missing Authentication
```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED",
  "status": 401
}
```

## Security Best Practices

### 1. Credential Storage

**✅ DO:**
- Store API keys in environment variables
- Use secure credential management systems
- Never commit credentials to version control

**❌ DON'T:**
- Hardcode credentials in source code
- Store credentials in plain text files
- Expose credentials in client-side code

### 2. Token Management

**✅ DO:**
- Implement automatic token refresh
- Handle token expiration gracefully
- Use HTTPS for all API calls

**❌ DON'T:**
- Store JWT tokens in localStorage (use httpOnly cookies)
- Ignore token expiration
- Send tokens over HTTP

### 3. API Key Security

**✅ DO:**
- Rotate API keys regularly
- Use different API keys for different environments
- Monitor API key usage

**❌ DON'T:**
- Share API keys between users
- Use production API keys in development
- Leave old API keys active after rotation

### 4. Request Security

**✅ DO:**
- Validate all input data
- Use rate limiting
- Implement request signing for sensitive operations

**❌ DON'T:**
- Skip input validation
- Allow unlimited request rates
- Trust client-provided data

## Code Examples

### Node.js Authentication
```javascript
const axios = require('axios');

class WhatsAppAPI {
  constructor(apiKey = null, token = null) {
    this.apiKey = apiKey;
    this.token = token;
    this.baseURL = 'https://api.yourwhatsappapi.com/api';
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async login(username, password) {
    const response = await axios.post(`${this.baseURL}/auth/login`, {
      username,
      password
    });
    
    this.token = response.data.token;
    return response.data;
  }

  async getProfile() {
    const response = await axios.get(`${this.baseURL}/auth/profile`, {
      headers: this.getHeaders()
    });
    return response.data;
  }
}

// Usage
const api = new WhatsAppAPI(process.env.WHATSAPP_API_KEY);
// or
const api = new WhatsAppAPI();
await api.login('username', 'password');
```

### Python Authentication
```python
import os
import requests

class WhatsAppAPI:
    def __init__(self, api_key=None, token=None):
        self.api_key = api_key
        self.token = token
        self.base_url = "https://api.yourwhatsappapi.com/api"
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        elif self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        return headers
    
    def login(self, username, password):
        response = requests.post(f"{self.base_url}/auth/login", json={
            "username": username,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["token"]
            return response.json()
        else:
            raise Exception(f"Login failed: {response.json()}")
    
    def get_profile(self):
        response = requests.get(f"{self.base_url}/auth/profile", 
                              headers=self.get_headers())
        return response.json()

# Usage
api = WhatsAppAPI(api_key=os.getenv('WHATSAPP_API_KEY'))
# or
api = WhatsAppAPI()
api.login('username', 'password')
```

### PHP Authentication
```php
<?php

class WhatsAppAPI {
    private $apiKey;
    private $token;
    private $baseURL = 'https://api.yourwhatsappapi.com/api';
    
    public function __construct($apiKey = null, $token = null) {
        $this->apiKey = $apiKey;
        $this->token = $token;
    }
    
    private function getHeaders() {
        $headers = ['Content-Type: application/json'];
        
        if ($this->apiKey) {
            $headers[] = 'X-API-Key: ' . $this->apiKey;
        } elseif ($this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }
        
        return $headers;
    }
    
    public function login($username, $password) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseURL . '/auth/login');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'username' => $username,
            'password' => $password
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $data = json_decode($response, true);
        
        if (isset($data['token'])) {
            $this->token = $data['token'];
        }
        
        curl_close($ch);
        return $data;
    }
    
    public function getProfile() {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseURL . '/auth/profile');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->getHeaders());
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}

// Usage
$api = new WhatsAppAPI($_ENV['WHATSAPP_API_KEY']);
// or
$api = new WhatsAppAPI();
$api->login('username', 'password');
?>
```

## Testing Authentication

### Test JWT Token
```bash
# Test with valid token
curl -X GET https://api.yourwhatsappapi.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with user profile
```

### Test API Key
```bash
# Test with valid API key
curl -X GET https://api.yourwhatsappapi.com/api/auth/profile \
  -H "X-API-Key: YOUR_API_KEY"

# Expected: 200 OK with user profile
```

### Test Invalid Authentication
```bash
# Test with invalid token
curl -X GET https://api.yourwhatsappapi.com/api/auth/profile \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized
```

---

**Next Steps:** Learn about [Session Management](./sessions.md) or explore [API Reference](./api-reference.md). 