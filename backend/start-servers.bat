@echo off
echo Starting Vistapro Development Servers...
echo.

REM Kill any existing Node processes
taskkill /f /im node.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the servers using our reliable script
node start-servers.js

pause
