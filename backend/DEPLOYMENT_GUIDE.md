# 🚀 Vistapro Deployment Guide

This guide provides step-by-step instructions for deploying the Vistapro application to staging and production environments.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git repository access
- Vercel account (for frontend)
- Render account (for backend)
- PostgreSQL database access

## 🏗️ Environment Setup

### 1. Staging Environment
- **Frontend**: Vercel Preview Deployment
- **Backend**: Render Staging Service
- **Database**: Same as production (for testing)

### 2. Production Environment
- **Frontend**: Vercel Production
- **Backend**: Render Production
- **Database**: Production PostgreSQL

## 🔧 Environment Variables

### Backend Environment Variables
```bash
PORT=5007
DATABASE_URL="postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw?sslmode=require"
MASTER_ADMIN_SECRET_KEY=7336EB1D45315
JWT_SECRET=d025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536
SESSION_SECRET=4c0673ce6951e3d3cd8fdc246c6d0b122c56cda6b527e3b3d73732725baa6e42
REDIS_URL=rediss://default:AYdzAAIjcDE3YTg4NmNmZmJjMzk0YzA0YTE4YzU0NjdmYTM4YzUyM3AxMA@super-sturgeon-34675.upstash.io:6379
PROFIT_REPORT_ACCESS_CODE=Ekjam83StjWI
MASTER_ADMIN_WALLET_ACCESS_CODE=2r?dbA534GwN
CLOUDINARY_CLOUD_NAME=dt9p4d8zl
CLOUDINARY_API_KEY=481678724352569
CLOUDINARY_API_SECRET=_9yaj_2JI7mVv0TblKUoo9X_aIA
NODE_ENV=production
```

### Frontend Environment Variables
```bash
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=Vistapro
VITE_APP_VERSION=1.0.0
```

## 🚀 Deployment Steps

### Phase 1: Staging Deployment

1. **Create Staging Branch**
   ```bash
   git checkout -b staging
   git push origin staging
   ```

2. **Deploy Backend to Render**
   - Create new Render service
   - Connect to staging branch
   - Set environment variables
   - Deploy

3. **Deploy Frontend to Vercel**
   - Create new Vercel project
   - Connect to staging branch
   - Set environment variables
   - Deploy

4. **Test Staging Environment**
   - Verify all endpoints work
   - Test user authentication
   - Test all major features
   - Check database connections

### Phase 2: Production Deployment

1. **Deploy Backend to Production**
   - Update existing Render service
   - Deploy from main branch
   - Monitor logs

2. **Deploy Frontend to Production**
   - Update existing Vercel project
   - Deploy from main branch
   - Update environment variables

3. **Verify Production**
   - Test all functionality
   - Monitor performance
   - Check error logs

## 🔄 Blue-Green Deployment Strategy

### Option 1: Zero-Downtime Deployment
1. Deploy new version to staging
2. Test thoroughly
3. Switch production to new version
4. Keep old version as backup

### Option 2: Gradual Rollout
1. Deploy to 10% of users
2. Monitor for issues
3. Gradually increase to 100%
4. Rollback if issues found

## 📊 Monitoring & Rollback

### Health Checks
- Backend: `GET /api/health`
- Frontend: Check build status
- Database: Connection test

### Rollback Procedure
1. Revert to previous version
2. Update environment variables
3. Restart services
4. Verify functionality

## 🛠️ Maintenance

### Regular Tasks
- Monitor error logs
- Check database performance
- Update dependencies
- Backup database

### Emergency Procedures
- Contact information
- Rollback procedures
- Database recovery
- Service restoration

## 📞 Support

For deployment issues:
- Check logs first
- Verify environment variables
- Test locally
- Contact development team

---

**Last Updated**: January 2025
**Version**: 1.0.0
