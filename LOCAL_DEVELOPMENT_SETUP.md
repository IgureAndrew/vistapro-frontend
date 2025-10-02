# Local Development Setup Guide

## Overview
This guide will help you set up Vistapro for local development with a local database copy, ensuring you can work safely without affecting production data.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Docker and Docker Compose (for local database)
- Access to production database credentials (for initial setup)
- VS Code or your preferred editor

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DATABASE_URL=your_production_database_url_here
USE_LOCAL_DB=true
LOCAL_DATABASE_URL=postgresql://vistapro_user:vistapro_password@localhost:5433/vistapro_dev

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=24h

# Email Configuration (if using Resend)
RESEND_API_KEY=your_resend_api_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Redis Configuration (if using Redis)
REDIS_URL=your_redis_url_here

# CORS Configuration for local development
FRONTEND_URL=http://localhost:3000

# Local Database Setup
COPY_PRODUCTION_DATA=true
```

### 3. Set Up Local Database
```bash
# Start PostgreSQL database using Docker
npm run db:start

# Set up local database with production schema and data
npm run db:setup
```

### 4. Run Backend Locally
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the frontend directory:

```env
# API Configuration for local development
VITE_API_URL=http://localhost:5000

# Other environment variables as needed
```

### 3. Run Frontend Locally
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Database Access

### Local Database Setup:
- **You're using a LOCAL database copy** - safe to make any changes
- Production database is only accessed during initial setup to copy schema and data
- All development work happens on your local PostgreSQL instance
- You can freely test migrations, bulk operations, and data modifications

### Database Management Commands:
```bash
# Start local database
npm run db:start

# Stop local database
npm run db:stop

# Reset database (delete all data and start fresh)
npm run db:reset

# View database logs
npm run db:logs

# Set up database with production data
npm run db:setup
```

### Database Access:
- **Local Database**: `postgresql://vistapro_user:vistapro_password@localhost:5433/vistapro_dev`
- **PgAdmin Web Interface**: `http://localhost:8080` (admin@vistapro.local / admin123)
- **Direct Connection**: Use any PostgreSQL client to connect to localhost:5433

### Safe Development Practices:
1. **Test migrations locally** before applying to production
2. **Experiment freely** with data modifications
3. **Use transactions** for complex operations
4. **Reset database** when needed with `npm run db:reset`
5. **Backup local data** if you have important test data

## Running Both Services

### Option 1: Separate Terminals
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Option 2: Concurrently (Recommended)
Install concurrently in the root directory:
```bash
npm install -g concurrently
```

Then run both services:
```bash
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Verify DATABASE_URL is correct
   - Check if production database allows external connections
   - Ensure SSL configuration is correct

2. **CORS Errors**
   - Verify FRONTEND_URL in backend .env
   - Check CORS configuration in app.js

3. **Port Already in Use**
   - Change PORT in .env file
   - Kill processes using the port: `lsof -ti:5000 | xargs kill -9`

4. **Environment Variables Not Loading**
   - Ensure .env files are in the correct directories
   - Restart your development server after changes

## Development Safety Checklist

Before starting development:
- [ ] Local database is running (`npm run db:start`)
- [ ] Database is set up with production schema (`npm run db:setup`)
- [ ] Environment variables are properly configured
- [ ] CORS is configured for localhost
- [ ] Ports are available and not conflicting
- [ ] USE_LOCAL_DB=true is set in .env

## Next Steps

1. Install Docker and Docker Compose
2. Set up your environment files
3. Start local database (`npm run db:start`)
4. Set up database with production data (`npm run db:setup`)
5. Start backend service
6. Start frontend service
7. Verify both services are running and communicating
8. Begin development work

Remember: You're working with a local copy of production data, so you can experiment freely without affecting the live application!
