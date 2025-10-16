# Start Vistapro Frontend Locally
# This script starts the frontend pointing to local backend

Write-Host "🚀 Starting Vistapro Frontend (Local Mode)..." -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env.local.example" -Destination ".env.local"
    Write-Host "✅ Created .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Frontend Configuration:" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:5000" -ForegroundColor White
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

# Start frontend
Write-Host "🚀 Starting frontend server..." -ForegroundColor Green
Write-Host "   Access frontend at: http://localhost:5173" -ForegroundColor White
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Run pnpm dev
pnpm dev

