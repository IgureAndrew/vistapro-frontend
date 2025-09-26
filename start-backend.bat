@echo off
echo Starting Vistapro Backend Server...
cd /d "%~dp0backend"
node start-dev.js
pause
