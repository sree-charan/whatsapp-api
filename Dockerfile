# WhatsApp API Platform - Production Docker Image
# Multi-stage build for optimal size and security

# ========================================
# Stage 1: Build Frontend
# ========================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# ========================================
# Stage 2: Build Backend Dependencies
# ========================================
FROM node:18-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3 \
    make \
    g++

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    nginx \
    supervisor \
    curl

# Create app user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set working directory
WORKDIR /app

# Copy backend application
COPY --from=backend-builder --chown=appuser:appgroup /app/backend/node_modules ./backend/node_modules
COPY --chown=appuser:appgroup backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder --chown=appuser:appgroup /app/frontend/dist ./frontend/dist/

# Copy root package.json for metadata
COPY --chown=appuser:appgroup package.json ./

# Create necessary directories with proper permissions
RUN mkdir -p \
    /app/data \
    /app/logs \
    /app/uploads \
    /var/log/nginx \
    /var/log/supervisor \
    /run/nginx && \
    chown -R appuser:appgroup /app/data /app/logs /app/uploads && \
    chown -R nginx:nginx /var/log/nginx /run/nginx

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create a startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 80 3001

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/api/health || exit 1

# Add labels for better Docker Hub presentation
LABEL maintainer="WhatsApp API Platform Team"
LABEL version="1.0.0"
LABEL description="Complete WhatsApp API Platform with Web UI"
LABEL org.opencontainers.image.title="WhatsApp API Platform"
LABEL org.opencontainers.image.description="Self-hosted WhatsApp Business API with modern web interface"
LABEL org.opencontainers.image.url="https://github.com/your-username/whatsapp-api"
LABEL org.opencontainers.image.documentation="https://github.com/your-username/whatsapp-api/blob/main/README.md"
LABEL org.opencontainers.image.source="https://github.com/your-username/whatsapp-api"

# Start the application using supervisor
CMD ["/start.sh"] 