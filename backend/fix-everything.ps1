Write-Host "🚀 Fixing Vistapro - Complete Setup Script" -ForegroundColor Green
Write-Host ""

Write-Host "🔪 Killing all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✅ Killed Node processes" -ForegroundColor Green

Write-Host ""
Write-Host "🐳 Starting local database..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ Database started" -ForegroundColor Green

Write-Host ""
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Copying real database from production..." -ForegroundColor Yellow
Set-Location backend
node run-db-setup.js
Write-Host "✅ Database copied" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
npm run dev
Write-Host "✅ Backend started" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Setup complete! Your backend should now be running with real data." -ForegroundColor Green
Write-Host "📝 You can now login with your real production credentials." -ForegroundColor Cyan
Read-Host "Press Enter to continue"
