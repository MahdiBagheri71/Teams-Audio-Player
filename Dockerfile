
# Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Install security updates
RUN apk upgrade --no-cache

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy environment script for runtime env vars
COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Labels for metadata
LABEL maintainer="Teams Audio Player"
LABEL description="Teams Audio Player - Web Application"
LABEL version="1.0.0"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
