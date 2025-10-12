@echo off
title Vistapro Development Servers
color 0A

echo.
echo ========================================
echo    VISTAPRO DEVELOPMENT SERVERS
echo ========================================
echo.

REM Kill any existing Node processes
echo [1/4] Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Check if we're in the right directory
if not exist "backend" (
    echo ERROR: Please run this from the Vistapro root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: Please run this from the Vistapro root directory
    pause
    exit /b 1
)

echo [2/4] Starting backend server...
start "Backend Server" cmd /k "cd backend && node start-dev.js"

REM Wait for backend to start
echo [3/4] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo [4/4] Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    SERVERS STARTING...
echo ========================================
echo.
echo Backend:  http://localhost:5005
echo Frontend: http://localhost:5173
echo.
echo Both servers are starting in separate windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this launcher...
pause >nul
