@echo off
echo Starting Vistapro Local Development...
echo.

echo Installing dependencies...
call npm run install:all

echo.
echo Starting both services...
call npm run dev

pause
