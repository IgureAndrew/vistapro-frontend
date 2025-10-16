# Start Vistapro Backend Locally
# This script starts the backend with local database configuration

Write-Host "🚀 Starting Vistapro Backend (Local Mode)..." -ForegroundColor Green
Write-Host ""

# Check if Docker containers are running
Write-Host "📊 Checking Docker containers..." -ForegroundColor Cyan
$postgresRunning = docker ps --filter "name=vistapro_local_db" --filter "status=running" --format "{{.Names}}"
$redisRunning = docker ps --filter "name=vistapro_local_redis" --filter "status=running" --format "{{.Names}}"

if (-not $postgresRunning) {
    Write-Host "⚠️  PostgreSQL container not running. Starting Docker containers..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 10
} else {
    Write-Host "✅ Docker containers are running" -ForegroundColor Green
}

Write-Host ""

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env.local.example" -Destination ".env.local"
    Write-Host "✅ Created .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Backend Configuration:" -ForegroundColor Cyan
Write-Host "   Database: localhost:5432 (Docker PostgreSQL)" -ForegroundColor White
Write-Host "   Redis: localhost:6379 (Docker Redis)" -ForegroundColor White
Write-Host "   Port: 5000" -ForegroundColor White
Write-Host "   Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host ""

# Load environment variables from .env.local
Write-Host "📝 Loading environment variables from .env.local..." -ForegroundColor Cyan
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^#') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host "   Access backend at: http://localhost:5000" -ForegroundColor White
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Run pnpm dev
pnpm dev

