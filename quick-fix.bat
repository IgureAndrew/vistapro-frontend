@echo off
echo 🚀 Quick Vistapro Fix - Using New Server File
echo.

echo 🔪 Killing all Node processes...
taskkill /f /im node.exe 2>nul
echo ✅ Processes killed

echo.
echo 🐳 Starting database...
docker-compose up -d
echo ✅ Database started

echo.
echo ⏳ Waiting for database...
timeout /t 3 /nobreak >nul

echo.
echo 📊 Copying real database...
cd backend
node run-db-setup.js
echo ✅ Database copied

echo.
echo 🚀 Starting new server on port 5005...
npm run dev
echo ✅ Server started
