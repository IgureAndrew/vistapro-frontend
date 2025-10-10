# Vistapro Development Server Launcher (PowerShell)
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    VISTAPRO DEVELOPMENT SERVERS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Kill any existing Node processes
Write-Host "[1/4] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: Please run this from the Vistapro root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: Please run this from the Vistapro root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[2/4] Starting backend server..." -ForegroundColor Blue
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && node start-dev.js" -WindowStyle Normal

# Wait for backend to start
Write-Host "[3/4] Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[4/4] Starting frontend server..." -ForegroundColor Blue
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd frontend && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    SERVERS STARTING..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5005" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both servers are starting in separate windows." -ForegroundColor White
Write-Host "Close those windows to stop the servers." -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
