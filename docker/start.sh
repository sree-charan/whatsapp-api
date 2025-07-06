#!/bin/sh

# WhatsApp API Platform - Docker Startup Script
set -e

echo "🚀 Starting WhatsApp API Platform..."

# Print environment info
echo "📋 Environment Information:"
echo "   - Node.js Version: $(node --version)"
echo "   - NPM Version: $(npm --version)"
echo "   - Environment: ${NODE_ENV:-production}"
echo "   - Port: ${PORT:-3001}"

# Create necessary directories if they don't exist
echo "📁 Creating directories..."
mkdir -p /app/data /app/logs /app/uploads /var/log/supervisor /var/log/nginx /run/nginx

# Set proper permissions
echo "🔒 Setting permissions..."
chown -R appuser:appgroup /app/data /app/logs /app/uploads
chown -R nginx:nginx /var/log/nginx /run/nginx

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Print startup message
echo "🌟 WhatsApp API Platform is starting up..."
echo "   - Frontend: http://localhost"
echo "   - Backend API: http://localhost/api"
echo "   - Health Check: http://localhost/health"

# Start supervisor to manage all processes
echo "🎯 Starting services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf 