# Simple Server Manager for Vistapro
# Quick commands for server management

param(
    [Parameter(Position=0)]
    [string]$Command = "start"
)

function Show-Help {
    Write-Host "Vistapro Server Manager" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\server-manager.ps1 [command]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  start     - Start both servers (default)" -ForegroundColor White
    Write-Host "  stop      - Stop all servers" -ForegroundColor White
    Write-Host "  restart   - Restart all servers" -ForegroundColor White
    Write-Host "  status    - Check server status" -ForegroundColor White
    Write-Host "  clean     - Clean start (kill all processes first)" -ForegroundColor White
    Write-Host "  backend   - Start only backend" -ForegroundColor White
    Write-Host "  frontend  - Start only frontend" -ForegroundColor White
    Write-Host "  help      - Show this help" -ForegroundColor White
}

function Stop-Servers {
    Write-Host "Stopping all servers..." -ForegroundColor Yellow
    try {
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($processes) {
            $processes | Stop-Process -Force
            Write-Host "Stopped $($processes.Count) Node.js processes" -ForegroundColor Green
        } else {
            Write-Host "No Node.js processes found" -ForegroundColor Blue
        }
    } catch {
        Write-Host "Error stopping processes: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Get-ServerStatus {
    Write-Host "Server Status:" -ForegroundColor Cyan
    
    $backendPort = 5005
    $frontendPort = 5173
    
    try {
        $backendConnection = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
        $frontendConnection = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
        
        if ($backendConnection) {
            Write-Host "Backend (port $backendPort): Running" -ForegroundColor Green
        } else {
            Write-Host "Backend (port $backendPort): Not running" -ForegroundColor Red
        }
        
        if ($frontendConnection) {
            Write-Host "Frontend (port $frontendPort): Running" -ForegroundColor Green
        } else {
            Write-Host "Frontend (port $frontendPort): Not running" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error checking server status" -ForegroundColor Red
    }
}

# Main execution
switch ($Command.ToLower()) {
    "start" {
        Write-Host "Starting servers..." -ForegroundColor Cyan
        & .\start-servers.ps1
    }
    "stop" {
        Stop-Servers
    }
    "restart" {
        Write-Host "Restarting servers..." -ForegroundColor Cyan
        Stop-Servers
        Start-Sleep -Seconds 2
        & .\start-servers.ps1
    }
    "status" {
        Get-ServerStatus
    }
    "clean" {
        Write-Host "Clean starting servers..." -ForegroundColor Cyan
        & .\start-servers.ps1 -Clean
    }
    "backend" {
        Write-Host "Starting backend only..." -ForegroundColor Cyan
        & .\start-servers.ps1 -BackendOnly
    }
    "frontend" {
        Write-Host "Starting frontend only..." -ForegroundColor Cyan
        & .\start-servers.ps1 -FrontendOnly
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
    }
}