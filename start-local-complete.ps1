# Start Complete Vistapro Local Environment
# This script starts Docker, Backend, and Frontend in separate windows

Write-Host "🚀 Starting Complete Vistapro Local Environment..." -ForegroundColor Green
Write-Host ""

# Start Docker containers
Write-Host "📊 Starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$postgresHealthy = docker ps --filter "name=vistapro_local_db" --filter "health=healthy" --format "{{.Names}}"
if ($postgresHealthy) {
    Write-Host "✅ PostgreSQL is healthy" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL may still be starting up" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting Backend and Frontend..." -ForegroundColor Green
Write-Host ""

# Start backend in new window
Write-Host "   Opening Backend terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-local-backend.ps1"

# Wait a moment
Start-Sleep -Seconds 2

# Start frontend in new window
Write-Host "   Opening Frontend terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-local-frontend.ps1"

Write-Host ""
Write-Host "✅ Local environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Database: localhost:5432 (vistapro_local)" -ForegroundColor White
Write-Host "   Redis:    localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "💡 Two new windows opened:" -ForegroundColor Yellow
Write-Host "   1. Backend terminal (port 5000)" -ForegroundColor White
Write-Host "   2. Frontend terminal (port 5173)" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop: Press Ctrl+C in each terminal, then run:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

