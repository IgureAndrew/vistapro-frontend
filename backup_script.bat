@echo off
echo 🚀 Vistapro Production Database Backup
echo =====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js first
    pause
    exit /b 1
)

REM Check if PostgreSQL tools are installed
pg_dump --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL tools (pg_dump) are not installed
    echo Please install PostgreSQL client tools first
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Run the backup script
node backup_production_db.js

echo.
echo Press any key to exit...
pause >nul

