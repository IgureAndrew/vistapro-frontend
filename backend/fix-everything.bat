@echo off
echo 🚀 Fixing Vistapro - Complete Setup Script
echo.

echo 🔪 Killing all Node.js processes...
taskkill /f /im node.exe 2>nul
echo ✅ Killed Node processes

echo.
echo 🐳 Starting local database...
docker-compose up -d
echo ✅ Database started

echo.
echo ⏳ Waiting for database to be ready...
timeout /t 5 /nobreak >nul

echo.
echo 📊 Copying real database from production...
cd backend
node run-db-setup.js
echo ✅ Database copied

echo.
echo 🚀 Starting backend server...
npm run dev
echo ✅ Backend started

echo.
echo 🎉 Setup complete! Your backend should now be running with real data.
echo 📝 You can now login with your real production credentials.
pause
