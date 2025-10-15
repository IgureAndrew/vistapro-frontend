@echo off
echo 🤖 Vistapro Automated Backup Setup
echo ===================================
echo.
echo This will set up daily automated backups of your production database.
echo The backup will run every day at 2:00 AM.
echo.
echo Prerequisites:
echo - Node.js must be installed
echo - PostgreSQL client tools must be installed
echo - This script must be run as Administrator
echo.
pause

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ This script must be run as Administrator!
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.

REM Run the PowerShell setup script
powershell -ExecutionPolicy Bypass -File "setup_automated_backups.ps1"

pause
