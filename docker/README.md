# 🐳 WhatsApp API Platform - Docker Deployment

This guide covers deploying the WhatsApp API Platform using Docker for production use.

## 🚀 Quick Start

### 1. Pull from Docker Hub (Recommended)
```bash
# Pull the latest image
docker pull your-dockerhub-username/whatsapp-api-platform:latest

# Run with default settings
docker run -d \
  --name whatsapp-api \
  -p 80:80 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  your-dockerhub-username/whatsapp-api-platform:latest
```

### 2. Using Docker Compose (Recommended for Production)
```bash
# Download the docker-compose.yml
wget https://raw.githubusercontent.com/your-username/whatsapp-api/main/docker-compose.yml

# Create environment file
cp docker/environment.example .env
# Edit .env with your settings

# Start the platform
docker-compose up -d
```

## 📋 Prerequisites

- Docker 20.0+ and Docker Compose 2.0+
- At least 1GB RAM and 2GB storage
- Open ports: 80 (HTTP) and 3001 (API)

## 🏗️ Building from Source

### 1. Clone Repository
```bash
git clone https://github.com/your-username/whatsapp-api-platform.git
cd whatsapp-api-platform
```

### 2. Build Docker Image
```bash
# Build the image
docker build -t whatsapp-api-platform:latest .

# Or use docker-compose
docker-compose build
```

### 3. Run with Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ⚙️ Configuration

### Environment Variables

Copy `docker/environment.example` to `.env` and customize:

```bash
# Security (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Ports
HTTP_PORT=80
API_PORT=3001

# Session Limits
MAX_SESSIONS_PER_USER=10
MAX_GLOBAL_SESSIONS=1000

# File Upload
MAX_FILE_SIZE=50

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
```

### Volume Mounts

| Container Path | Host Path | Purpose |
|---------------|-----------|---------|
| `/app/data` | `./data` | Session data and authentication |
| `/app/logs` | `./logs` | Application logs |
| `/app/uploads` | `./uploads` | Uploaded media files |

## 🌐 Accessing the Platform

Once running, access your platform at:

- **Frontend**: http://localhost
- **API Documentation**: http://localhost/api
- **Health Check**: http://localhost/health

### Default Login
- **Username**: admin
- **Password**: admin
- **⚠️ Change immediately in production!**

## 📊 Monitoring

### Health Checks
```bash
# Check container health
docker ps

# View application logs
docker-compose logs whatsapp-api-platform

# Check resource usage
docker stats
```

### Log Files
```bash
# Application logs
tail -f logs/app.log

# Nginx access logs
docker exec whatsapp-api-platform tail -f /var/log/nginx/access.log

# Backend logs
docker exec whatsapp-api-platform tail -f /var/log/supervisor/backend.log
```

## 🔧 Maintenance

### Updates
```bash
# Pull latest image
docker pull your-dockerhub-username/whatsapp-api-platform:latest

# Restart with new image
docker-compose up -d
```

### Backup
```bash
# Backup data directory
tar -czf whatsapp-backup-$(date +%Y%m%d).tar.gz data/

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

### Cleanup
```bash
# Remove unused containers and images
docker system prune -a

# Remove volumes (⚠️ DATA LOSS!)
docker-compose down -v
```

## 🛡️ Security

### Production Checklist
- [ ] Change default JWT_SECRET
- [ ] Use strong passwords
- [ ] Enable rate limiting
- [ ] Set up SSL/TLS (reverse proxy)
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity
- [ ] Update regularly

### SSL/TLS Setup
For production, use a reverse proxy like Traefik or Nginx:

```yaml
# Example with Traefik
version: '3.8'
services:
  whatsapp-api-platform:
    # ... existing config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whatsapp.rule=Host(\`your-domain.com\`)"
      - "traefik.http.routers.whatsapp.tls.certresolver=letsencrypt"
```

## 🐛 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs whatsapp-api-platform

# Check nginx config
docker exec whatsapp-api-platform nginx -t
```

#### Out of Memory
```bash
# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

#### Permission Issues
```bash
# Fix volume permissions
sudo chown -R 1001:1001 data/ logs/ uploads/
```

#### Port Conflicts
```bash
# Change ports in .env file
HTTP_PORT=8080
API_PORT=3002
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker rmi whatsapp-api-platform:latest

# Clean rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/whatsapp-api/issues)
- **Documentation**: [Full Docs](https://github.com/your-username/whatsapp-api/wiki)
- **Discord**: [Community Chat](https://discord.gg/your-server)

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details. 