#!/bin/bash

# STAGING DEPLOYMENT SCRIPT
# This script deploys the application to staging environment

echo "🚀 Starting Staging Deployment..."

# Set environment
export NODE_ENV=staging

# Load staging environment variables
if [ -f "staging.env" ]; then
    export $(cat staging.env | grep -v '^#' | xargs)
    echo "✅ Loaded staging environment variables"
else
    echo "❌ staging.env file not found"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install --production
cd ../frontend
npm install --production

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Start backend
echo "🚀 Starting backend server..."
cd ../backend
node server.js &

# Wait for backend to start
sleep 10

# Check if backend is running
if curl -f http://localhost:5007/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 5007"
else
    echo "❌ Backend failed to start"
    exit 1
fi

echo "🎉 Staging deployment completed successfully!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5007"
