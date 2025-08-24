# Deployment Guide

This guide covers various deployment options for Teams Audio Player, from development to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
  - [Cloud Deployment](#cloud-deployment)
  - [Kubernetes Deployment](#kubernetes-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Azure AD App Registration** with proper configuration
2. **Required API Permissions** granted and consented
3. **Environment variables** properly configured
4. **SSL certificates** for production deployment

## Environment Configuration

### Required Environment Variables

```bash
# Azure AD Configuration
REACT_APP_CLIENT_ID=your-client-id
REACT_APP_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
REACT_APP_REDIRECT_URI=https://yourdomain.com
REACT_APP_GRAPH_SCOPES=User.Read Chat.Read Files.Read

# Optional Configuration
REACT_APP_API_ENDPOINT=https://api.yourdomain.com
REACT_APP_ENABLE_DEBUG=false
REACT_APP_APPINSIGHTS_KEY=your-app-insights-key
```

### Azure AD Redirect URIs

Add these redirect URIs in your Azure AD app:

- Development: `http://localhost:3000`
- Staging: `https://staging.yourdomain.com`
- Production: `https://yourdomain.com`

## Deployment Options

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Create .env file**:

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start development server**:

   ```bash
   npm start
   ```

4. **Access application**:
   ```
   http://localhost:3000
   ```

### Docker Deployment

#### Single Container

1. **Build Docker image**:

   ```bash
   docker build -t teams-audio-player:latest .
   ```

2. **Run container**:
   ```bash
   docker run -d \
     --name teams-audio-player \
     -p 80:80 \
     -e REACT_APP_CLIENT_ID=your-client-id \
     -e REACT_APP_AUTHORITY=your-authority \
     -e REACT_APP_REDIRECT_URI=your-redirect-uri \
     -e REACT_APP_GRAPH_SCOPES="User.Read Chat.Read Files.Read" \
     teams-audio-player:latest
   ```

#### Docker Compose

1. **Create .env file** with your configuration

2. **Start services**:

   ```bash
   # Basic deployment
   docker-compose up -d

   # With SSL/Traefik
   docker-compose --profile with-ssl up -d

   # Full stack with Redis
   docker-compose --profile full-stack up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f teams-audio-player
   ```

### Cloud Deployment

#### Azure App Service

1. **Create App Service**:

   ```bash
   az webapp create \
     --resource-group myResourceGroup \
     --plan myAppServicePlan \
     --name teams-audio-player \
     --deployment-container-image-name teams-audio-player:latest
   ```

2. **Configure environment variables**:

   ```bash
   az webapp config appsettings set \
     --resource-group myResourceGroup \
     --name teams-audio-player \
     --settings \
       REACT_APP_CLIENT_ID=your-client-id \
       REACT_APP_AUTHORITY=your-authority \
       REACT_APP_REDIRECT_URI=https://teams-audio-player.azurewebsites.net \
       REACT_APP_GRAPH_SCOPES="User.Read Chat.Read Files.Read"
   ```

3. **Enable continuous deployment**:
   ```bash
   az webapp deployment container config \
     --enable-cd true \
     --name teams-audio-player \
     --resource-group myResourceGroup
   ```

#### AWS ECS

1. **Push image to ECR**:

   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
   docker tag teams-audio-player:latest $ECR_URI/teams-audio-player:latest
   docker push $ECR_URI/teams-audio-player:latest
   ```

2. **Create task definition** (task-definition.json):

   ```json
   {
     "family": "teams-audio-player",
     "containerDefinitions": [
       {
         "name": "teams-audio-player",
         "image": "${ECR_URI}/teams-audio-player:latest",
         "memory": 512,
         "cpu": 256,
         "essential": true,
         "portMappings": [
           {
             "containerPort": 80,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "REACT_APP_CLIENT_ID",
             "value": "your-client-id"
           }
         ]
       }
     ]
   }
   ```

3. **Deploy to ECS**:
   ```bash
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   aws ecs update-service --cluster my-cluster --service teams-audio-player --task-definition teams-audio-player
   ```

#### Google Cloud Run

1. **Push to Container Registry**:

   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/teams-audio-player
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy teams-audio-player \
     --image gcr.io/PROJECT-ID/teams-audio-player \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="REACT_APP_CLIENT_ID=your-client-id,REACT_APP_AUTHORITY=your-authority"
   ```

### Kubernetes Deployment

1. **Create ConfigMap** (configmap.yaml):

   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: teams-audio-config
   data:
     REACT_APP_CLIENT_ID: 'your-client-id'
     REACT_APP_AUTHORITY: 'your-authority'
     REACT_APP_REDIRECT_URI: 'https://yourdomain.com'
     REACT_APP_GRAPH_SCOPES: 'User.Read Chat.Read Files.Read'
   ```

2. **Create Deployment** (deployment.yaml):

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: teams-audio-player
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: teams-audio-player
     template:
       metadata:
         labels:
           app: teams-audio-player
       spec:
         containers:
           - name: teams-audio-player
             image: teams-audio-player:latest
             ports:
               - containerPort: 80
             envFrom:
               - configMapRef:
                   name: teams-audio-config
             resources:
               requests:
                 memory: '128Mi'
                 cpu: '100m'
               limits:
                 memory: '512Mi'
                 cpu: '500m'
   ```

3. **Create Service** (service.yaml):

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: teams-audio-player
   spec:
     selector:
       app: teams-audio-player
     ports:
       - port: 80
         targetPort: 80
     type: LoadBalancer
   ```

4. **Deploy to Kubernetes**:
   ```bash
   kubectl apply -f configmap.yaml
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```

## SSL/TLS Configuration

### Using Let's Encrypt with Traefik

1. **Update docker-compose.yml**:

   ```yaml
   services:
     traefik:
       command:
         - '--certificatesresolvers.letsencrypt.acme.email=your-email@example.com'
         - '--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json'
   ```

2. **Add labels to your service**:
   ```yaml
   labels:
     - 'traefik.http.routers.teams-audio-player.tls=true'
     - 'traefik.http.routers.teams-audio-player.tls.certresolver=letsencrypt'
   ```

### Using Custom SSL Certificates

1. **Mount certificates**:

   ```yaml
   volumes:
     - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem:ro
     - ./ssl/key.pem:/etc/nginx/ssl/key.pem:ro
   ```

2. **Update nginx.conf**:
   ```nginx
   server {
     listen 443 ssl http2;
     ssl_certificate /etc/nginx/ssl/cert.pem;
     ssl_certificate_key /etc/nginx/ssl/key.pem;
   }
   ```

## Performance Optimization

### 1. Enable Gzip Compression

Already configured in nginx.conf:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. Enable Browser Caching

Configure cache headers in nginx:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Use CDN

Configure CloudFlare or another CDN:

1. Point your domain to CDN
2. Configure caching rules
3. Enable auto-minification

### 4. Optimize Images

```bash
# Optimize during build
npm run build:prod
```

## Monitoring & Logging

### Application Insights (Azure)

1. **Add to environment**:

   ```bash
   REACT_APP_APPINSIGHTS_KEY=your-key
   ```

2. **View metrics**:
   - User sessions
   - API response times
   - Error rates
   - Custom events

### Docker Logs

```bash
# View logs
docker logs -f teams-audio-player

# Save logs to file
docker logs teams-audio-player > logs.txt 2>&1
```

### Health Checks

The application includes health check endpoints:

- Basic health: `GET /`
- Detailed health: `GET /health` (if implemented)

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

**Problem**: Users can't log in
**Solutions**:

- Verify redirect URI matches Azure AD configuration
- Check client ID and authority are correct
- Ensure cookies are enabled
- Clear browser cache

#### 2. API Permission Errors

**Problem**: "Access denied" when accessing Teams data
**Solutions**:

- Verify all required permissions are granted
- Check admin consent is provided
- Re-authenticate the user

#### 3. SSL Certificate Issues

**Problem**: SSL errors in production
**Solutions**:

- Verify certificate is valid and not expired
- Check certificate chain is complete
- Ensure proper SSL configuration in nginx

#### 4. Performance Issues

**Problem**: Slow loading times
**Solutions**:

- Enable caching headers
- Use CDN for static assets
- Optimize bundle size
- Enable gzip compression

### Debug Mode

Enable debug mode for troubleshooting:

```bash
REACT_APP_ENABLE_DEBUG=true
```

This will:

- Enable verbose logging
- Show API request/response details
- Display performance metrics

## Rollback Procedure

If deployment fails:

1. **Docker**:

   ```bash
   docker stop teams-audio-player
   docker run -d --name teams-audio-player teams-audio-player:previous-version
   ```

2. **Kubernetes**:

   ```bash
   kubectl rollout undo deployment teams-audio-player
   ```

3. **Cloud Services**:
   - Use platform-specific rollback features
   - Restore from previous container image

## Security Checklist

Before going to production:

- [ ] SSL/TLS properly configured
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Rate limiting implemented
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Incident response plan ready

## Support

For deployment issues:

1. Check application logs
2. Verify environment configuration
3. Review Azure AD settings
4. Contact support with detailed error messages
