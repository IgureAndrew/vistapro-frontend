# Start Backend with Production Database for Testing
# This script starts the backend locally but connects to the production database

Write-Host "🚀 Starting Backend with Production Database..." -ForegroundColor Green

# Set environment variables for production database
$env:DATABASE_URL = "postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw"
$env:REDIS_URL = "rediss://default:AYdzAAIjcDE3YTg4NmNmZmJjMzk0YzA0YTE4YzU0NjdmYTM4YzUyM3AxMA@super-sturgeon-34675.upstash.io:6379"
$env:PORT = "5000"
$env:NODE_ENV = "production"
$env:FRONTEND_URL = "http://localhost:5173"

# Secrets
$env:MASTER_ADMIN_SECRET_KEY = "7336EB1D45315"
$env:JWT_SECRET = "d025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536"
$env:SESSION_SECRET = "4c0673ce6951e3d3cd8fdc246c6d0b122c56cda6b527e3b3d73732725baa6e42"
$env:PROFIT_REPORT_ACCESS_CODE = "Ekjam83StjWI"
$env:MASTER_ADMIN_WALLET_ACCESS_CODE = "2r?dbA534GwN"

# API Keys
$env:RESEND_API_KEY = "re_922xJy5k_p9K9ZbRDxCeR1ESsesswXtca"

# Cloudinary
$env:CLOUDINARY_CLOUD_NAME = "dt9p4d8zl"
$env:CLOUDINARY_API_KEY = "481678724352569"
$env:CLOUDINARY_API_SECRET = "_9yaj_2JI7mVv0TblKUoo9X_aIA"

# Change to backend directory
Set-Location backend

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host "📍 Starting server on port 5000..." -ForegroundColor Cyan

# Start the server
node start.js

