# Enhanced Verification System - Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 13+ database
- Cloudinary account
- Email service (Gmail/SendGrid)
- SSL certificate
- Domain name

### Environment Setup

#### 1. Database Configuration
```bash
# Create production database
createdb vistapro_production

# Run migrations
psql -h your-db-host -U your-db-user -d vistapro_production -f migrations/0020_add_verification_notifications.sql
```

#### 2. Environment Variables
Create `.env` file with production values:
```env
# Database
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_password
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=vistapro_production

# JWT
JWT_SECRET=your_super_secure_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend
FRONTEND_URL=https://your-domain.com

# Server
PORT=5000
NODE_ENV=production
```

#### 3. Backend Deployment
```bash
# Install dependencies
npm install --production

# Build application
npm run build

# Start production server
npm start
```

#### 4. Frontend Deployment
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Serve static files
npm run preview
```

### Docker Deployment

#### 1. Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Frontend Dockerfile
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=vistapro_production
      - POSTGRES_USER=your_db_user
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Cloud Deployment

#### AWS Deployment
1. **EC2 Instance**: Launch Ubuntu 20.04 LTS
2. **RDS PostgreSQL**: Create managed database
3. **S3**: Store static assets
4. **CloudFront**: CDN for global distribution
5. **Route 53**: DNS management

#### Heroku Deployment
1. **Backend**:
```bash
# Create Heroku app
heroku create your-app-backend

# Set environment variables
heroku config:set DB_USER=your_user
heroku config:set DB_PASSWORD=your_password
# ... other variables

# Deploy
git push heroku main
```

2. **Frontend**:
```bash
# Create Heroku app
heroku create your-app-frontend

# Deploy
git push heroku main
```

#### Vercel Deployment
1. **Frontend**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

2. **Backend**: Use Vercel Functions or separate hosting

### SSL Configuration

#### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Monitoring & Logging

#### Application Monitoring
1. **PM2 Process Manager**:
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "verification-api"

# Monitor
pm2 monit

# Auto-restart on failure
pm2 startup
pm2 save
```

2. **Log Management**:
```bash
# View logs
pm2 logs verification-api

# Log rotation
pm2 install pm2-logrotate
```

#### Database Monitoring
1. **Connection Pooling**:
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

2. **Query Monitoring**:
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

### Security Configuration

#### 1. Firewall Setup
```bash
# UFW Firewall
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 5000   # Block direct API access
```

#### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

#### 3. CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### Backup Strategy

#### 1. Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U vistapro_user vistapro_production > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

#### 2. File Backup
```bash
# Backup uploaded files
aws s3 sync /path/to/uploads s3://your-backup-bucket/uploads/
```

#### 3. Configuration Backup
```bash
# Backup configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env nginx.conf
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_verification_notifications_user_id 
ON verification_notifications(user_id);

CREATE INDEX CONCURRENTLY idx_verification_notifications_created_at 
ON verification_notifications(created_at);

-- Analyze tables
ANALYZE verification_notifications;
```

#### 2. Caching Strategy
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache verification progress
const cacheVerificationProgress = async (marketerId, data) => {
  await client.setex(`verification:${marketerId}`, 300, JSON.stringify(data));
};
```

#### 3. CDN Configuration
```javascript
// Cloudinary optimization
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
```

### Health Checks

#### 1. Application Health Check
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

#### 2. Database Health Check
```javascript
app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'healthy' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

### Rollback Strategy

#### 1. Database Rollback
```bash
# Restore from backup
psql -h localhost -U vistapro_user -d vistapro_production < backup_20250115_120000.sql
```

#### 2. Application Rollback
```bash
# PM2 rollback
pm2 rollback verification-api

# Git rollback
git checkout previous-stable-commit
npm install
npm run build
pm2 restart verification-api
```

### Testing in Production

#### 1. Smoke Tests
```bash
# Test API endpoints
curl -X GET https://your-domain.com/api/health
curl -X GET https://your-domain.com/api/verification/progress/test-user
```

#### 2. Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

#### 3. Monitoring
- **Uptime Monitoring**: Use services like Pingdom or UptimeRobot
- **Error Tracking**: Implement Sentry or similar
- **Performance Monitoring**: Use New Relic or DataDog

---

## 🚀 Quick Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Backup strategy implemented

### Deployment
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Database connections working
- [ ] File uploads working
- [ ] Notifications working

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Logs being collected
- [ ] Backups running
- [ ] Performance optimized

---

*Last Updated: January 2025*
*Version: 2.0*
*System: Enhanced Verification System*
