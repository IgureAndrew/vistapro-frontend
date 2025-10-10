# PowerShell script to start Vistapro development servers
# This script handles the startup process more reliably on Windows

Write-Host "🎯 Vistapro Development Server Startup (PowerShell)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Please run this script from the Vistapro root directory" -ForegroundColor Red
    exit 1
}

# Function to kill processes on a specific port
function Stop-ProcessOnPort {
    param([int]$Port)
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        Write-Host "🔍 Found processes on port $Port`: $($processes -join ', ')" -ForegroundColor Yellow
        foreach ($pid in $processes) {
            try {
                Stop-Process -Id $pid -Force
                Write-Host "✅ Killed process $pid on port $Port" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Could not kill process $pid on port $Port" -ForegroundColor Yellow
            }
        }
    }
}

# Clean up existing processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Stop-ProcessOnPort -Port 5007
Stop-ProcessOnPort -Port 5173

# Wait for cleanup
Start-Sleep -Seconds 3

# Start backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    npm run dev
}

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
$backendReady = $false
$timeout = 60 # 60 seconds timeout
$elapsed = 0

while (-not $backendReady -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    $connection = Get-NetTCPConnection -LocalPort 5007 -ErrorAction SilentlyContinue
    if ($connection) {
        $backendReady = $true
        Write-Host "✅ Backend server is ready!" -ForegroundColor Green
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend server failed to start within $timeout seconds" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

# Start frontend server
Write-Host "🚀 Starting frontend server..." -ForegroundColor Blue
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
$frontendReady = $false
$timeout = 60 # 60 seconds timeout
$elapsed = 0

while (-not $frontendReady -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    $connection = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($connection) {
        $frontendReady = $true
        Write-Host "✅ Frontend server is ready!" -ForegroundColor Green
    }
}

if (-not $frontendReady) {
    Write-Host "❌ Frontend server failed to start within $timeout seconds" -ForegroundColor Red
    Stop-Job $backendJob
    Stop-Job $frontendJob
    Remove-Job $backendJob
    Remove-Job $frontendJob
    exit 1
}

Write-Host "🎉 Both servers are running successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5007" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Handle cleanup on script exit
$cleanup = {
    Write-Host "`n🛑 Shutting down servers..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}

Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanup

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    & $cleanup
}