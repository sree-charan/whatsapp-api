# 🚀 WhatsApp API Platform

A complete, self-hosted WhatsApp Business API platform with a modern web interface. Built with Node.js, React, and Docker for easy deployment and scalability.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)

## ✨ Features

### 📱 **WhatsApp Integration**
- ✅ **Multi-Session Support** - Manage multiple WhatsApp accounts
- ✅ **QR Code Authentication** - Easy device linking
- ✅ **Message Sending** - Text, images, documents, and media
- ✅ **Webhook Support** - Real-time message notifications
- ✅ **Session Management** - Start, stop, restart sessions
- ✅ **Status Monitoring** - Real-time connection status

### 🎨 **Modern Web Interface**
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Real-time Dashboard** - Live session and message statistics
- ✅ **Message History** - View and search sent messages
- ✅ **File Upload** - Easy media attachment handling
- ✅ **Bulk Messaging** - Send to multiple contacts
- ✅ **Dark/Light Mode** - Customizable interface

### 🔒 **Security & Performance**
- ✅ **JWT Authentication** - Secure API access
- ✅ **Rate Limiting** - Prevent API abuse
- ✅ **Input Validation** - Secure data handling
- ✅ **CORS Protection** - Cross-origin security
- ✅ **File Upload Security** - Safe media handling
- ✅ **Automated Backups** - Session data protection

### 🐳 **Deployment Ready**
- ✅ **Docker Support** - One-click deployment
- ✅ **Docker Compose** - Complete orchestration
- ✅ **Nginx Integration** - Production-ready reverse proxy
- ✅ **Environment Variables** - Easy configuration
- ✅ **Health Monitoring** - Built-in health checks
- ✅ **Logging** - Comprehensive application logs

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull and run the latest image
docker run -d \
  --name whatsapp-api \
  -p 80:80 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  -e JWT_SECRET=your-secret-key-here \
  your-dockerhub-username/whatsapp-api-platform:latest

# Access the platform
open http://localhost
```

### Option 2: Docker Compose

```bash
# Clone the repository
git clone https://github.com/your-username/whatsapp-api-platform.git
cd whatsapp-api-platform

# Configure environment
cp docker/environment.example .env
# Edit .env with your settings

# Start the platform
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 3: Manual Installation

```bash
# Clone the repository
git clone https://github.com/your-username/whatsapp-api-platform.git
cd whatsapp-api-platform

# Install dependencies
npm run install-all

# Build frontend
npm run build

# Start the application
npm start
```

## 📋 Installation Requirements

### System Requirements
- **OS**: Linux, macOS, or Windows
- **Memory**: Minimum 1GB RAM (2GB recommended)
- **Storage**: 2GB free space
- **Ports**: 80 (HTTP) and 3001 (API)

### Software Requirements
- **Docker**: 20.0+ and Docker Compose 2.0+ (for Docker installation)
- **Node.js**: 18.0+ (for manual installation)
- **NPM**: 8.0+ (for manual installation)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Security Settings (REQUIRED)
JWT_SECRET=change-this-to-a-secure-random-string

# Application Settings
NODE_ENV=production
HTTP_PORT=80
API_PORT=3001

# Session Limits
MAX_SESSIONS_PER_USER=10
MAX_GLOBAL_SESSIONS=1000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE=50
UPLOAD_PATH=./uploads

# Webhook Settings
WEBHOOK_TIMEOUT=30000
WEBHOOK_MAX_RETRIES=3

# Logging
LOG_LEVEL=info
LOG_MAX_FILES=10
LOG_MAX_SIZE=10m
```

### Volume Mounts (Docker)

| Container Path | Host Path | Purpose |
|---------------|-----------|---------|
| `/app/data` | `./data` | Session data and authentication |
| `/app/logs` | `./logs` | Application logs |
| `/app/uploads` | `./uploads` | Uploaded media files |

## 🪟 Windows Installation & Running Guide

### 📦 **Install All Dependencies**

#### **Step 1: Install Root Dependencies**
```powershell
# Navigate to project root
cd "C:\path\to\whatsapp-api-platform"

# Install root dependencies (includes concurrently for running both servers)
npm install
```

#### **Step 2: Install Backend Dependencies**
```powershell
# Install backend dependencies
cd backend
npm install
cd ..
```

#### **Step 3: Install Frontend Dependencies**
```powershell
# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### **🚀 One-Command Installation (Easiest)**
```powershell
# From project root - installs all dependencies at once
npm run install-all
```

### 🔥 **Development Mode (Normal Mode)**

#### **Option 1: Run Both Together (Recommended)**
```powershell
# Runs both backend and frontend simultaneously
npm run dev
```
**This will start:**
- Backend API server on: `http://localhost:3001`
- Frontend dev server on: `http://localhost:3000`
- Frontend will proxy API calls to backend

#### **Option 2: Run Separately**

**Terminal 1 - Backend:**
```powershell
npm run dev:backend
# OR manually:
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev:frontend
# OR manually:
cd frontend
npm run dev
```

#### **🌐 Access in Development:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

### 🏭 **Production Mode**

#### **Step 1: Build Frontend**
```powershell
# Build frontend for production
npm run build
# OR manually:
cd frontend
npm run build
cd ..
```

#### **Step 2: Start Backend Only**
```powershell
# Start backend in production mode (serves frontend too)
npm start
# OR manually:
cd backend
npm start
```

#### **🌐 Access in Production:**
- **Application**: http://localhost:3001
- **Frontend**: Served by backend at http://localhost:3001
- **API**: http://localhost:3001/api

### 📋 **Summary of Commands**

| Purpose | Command | What it does |
|---------|---------|-------------|
| **Install All** | `npm run install-all` | Installs root, backend, and frontend dependencies |
| **Development** | `npm run dev` | Runs both servers with hot reload |
| **Backend Dev** | `npm run dev:backend` | Backend only with nodemon |
| **Frontend Dev** | `npm run dev:frontend` | Frontend only with Vite |
| **Build Prod** | `npm run build` | Builds frontend for production |
| **Start Prod** | `npm start` | Starts backend serving built frontend |

### 🔍 **Key Differences**

#### **Development Mode:**
- ✅ **Hot Reload** - Changes auto-refresh
- ✅ **Source Maps** - Easy debugging
- ✅ **Separate Servers** - Frontend (3000) + Backend (3001)
- ✅ **Dev Tools** - React dev tools, detailed errors
- ⚠️ **Slower** - Not optimized

#### **Production Mode:**
- ✅ **Optimized** - Minified, compressed code
- ✅ **Single Server** - Backend serves everything on 3001
- ✅ **Faster** - Optimized bundle
- ✅ **Secure** - Source maps disabled
- ❌ **No Hot Reload** - Need manual restart

### 🛠️ **Environment Variables**

#### **Development (.env.development)**
```bash
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-key
LOG_LEVEL=debug
```

#### **Production (.env.production)**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-production-key
LOG_LEVEL=info
MAX_SESSIONS_PER_USER=10
```

### 🐛 **Windows Troubleshooting**

#### **Port Conflicts:**
```powershell
# If ports are busy, change them:
# Frontend: edit frontend/vite.config.js
# Backend: edit backend/.env or set PORT=3002
```

#### **Dependencies Issues:**
```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force backend/node_modules
Remove-Item -Recurse -Force frontend/node_modules
npm run install-all
```

#### **Build Issues:**
```powershell
# Clean build
cd frontend
Remove-Item -Recurse -Force dist
npm run build
cd ..
```

#### **PowerShell Execution Policy:**
```powershell
# If you get script execution errors:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 🚀 **Quick Start Commands for Windows**

#### **For Development:**
```powershell
# One-time setup
npm run install-all

# Every time you develop
npm run dev
# Access: http://localhost:3000
```

#### **For Production Testing:**
```powershell
# Build and start
npm run build
npm start
# Access: http://localhost:3001
```

#### **For Production Deployment:**
```powershell
# Set production environment
$env:NODE_ENV="production"
npm run build
npm start
```

## 🌐 Usage

### 1. **Access the Web Interface**
Open http://localhost in your browser

### 2. **Create Your First Session**
- Click "Create New Session"
- Enter a session name
- Click "Start Session"
- Scan the QR code with WhatsApp

### 3. **Send Messages**
- Go to the Messages page
- Select your session
- Send text, images, or documents

### 4. **API Integration**
```bash
# Get API key
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Send a message
curl -X POST http://localhost/api/sessions/{sessionId}/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"1234567890","message":"Hello World!"}'
```

## 📚 API Documentation

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
GET /api/auth/profile
```

### Session Management
```bash
GET /api/sessions              # List all sessions
POST /api/sessions             # Create new session
GET /api/sessions/{id}         # Get session details
POST /api/sessions/{id}/start  # Start session
POST /api/sessions/{id}/stop   # Stop session
DELETE /api/sessions/{id}      # Delete session
GET /api/sessions/{id}/qr      # Get QR code
```

### Message Operations
```bash
POST /api/sessions/{id}/messages        # Send message
GET /api/sessions/{id}/messages         # Get message history
POST /api/sessions/{id}/messages/bulk   # Send bulk messages
POST /api/sessions/{id}/messages/media  # Send media message
```

### Webhooks
```bash
GET /api/webhooks              # List webhooks
POST /api/webhooks             # Create webhook
PUT /api/webhooks/{id}         # Update webhook
DELETE /api/webhooks/{id}      # Delete webhook
```

## 🛡️ Security

### Production Deployment Checklist
- [ ] **Change default JWT_SECRET** to a secure random string
- [ ] **Update default admin credentials**
- [ ] **Enable HTTPS** with SSL certificates
- [ ] **Configure firewall** to restrict access
- [ ] **Set up rate limiting** appropriately
- [ ] **Enable logging** and monitoring
- [ ] **Regular backups** of data directory
- [ ] **Keep Docker images updated**

### SSL/TLS Setup
For production, use a reverse proxy like Nginx or Traefik:

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  whatsapp-api-platform:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whatsapp.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.whatsapp.tls.certresolver=letsencrypt"
```

## 📊 Monitoring

### Health Checks
```bash
# Application health
curl http://localhost/health

# Container health
docker ps

# Resource usage
docker stats
```

### Logs
```bash
# Application logs
tail -f logs/app.log

# Docker logs
docker-compose logs -f

# Nginx logs (if using Docker)
docker exec whatsapp-api-platform tail -f /var/log/nginx/access.log
```

## 🔧 Maintenance

### Updates
```bash
# Docker deployment
docker-compose pull
docker-compose up -d

# Manual deployment
git pull origin main
npm run install-all
npm run build
npm restart
```

### Backup
```bash
# Backup session data
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restore backup
tar -xzf backup-YYYYMMDD.tar.gz
```

### Cleanup
```bash
# Clean old logs
find logs/ -name "*.log" -mtime +30 -delete

# Clean Docker images
docker system prune -a
```

## 🐛 Troubleshooting

### Common Issues

#### **WhatsApp Connection Problems**
- Ensure QR code is scanned within 45 seconds
- Check if WhatsApp is linked to another device
- Restart the session if connection fails

#### **Docker Issues**
```bash
# Check container status
docker ps -a

# View logs
docker-compose logs whatsapp-api-platform

# Restart services
docker-compose restart
```

#### **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER data/ logs/ uploads/

# Docker permissions
sudo chown -R 1001:1001 data/ logs/ uploads/
```

#### **Port Conflicts**
```bash
# Change ports in .env
HTTP_PORT=8080
API_PORT=3002
```

### Getting Help
- **Documentation**: [Full Documentation](https://github.com/your-username/whatsapp-api-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/whatsapp-api-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/whatsapp-api-platform/discussions)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone repository
git clone https://github.com/your-username/whatsapp-api-platform.git
cd whatsapp-api-platform

# Install dependencies
npm run install-all

# Start development servers
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is not affiliated with WhatsApp Inc. Use responsibly and in accordance with WhatsApp's Terms of Service. The developers are not responsible for any misuse of this software.

## 🌟 Support

If this project helped you, please give it a ⭐ on GitHub!

---

**Made with ❤️ for the open-source community** 