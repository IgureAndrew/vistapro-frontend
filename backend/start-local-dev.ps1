Write-Host "Starting Vistapro Local Development..." -ForegroundColor Green
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm run install:all

Write-Host ""
Write-Host "Starting both services..." -ForegroundColor Yellow
npm run dev

Read-Host "Press Enter to exit"
