# Vistapro Automated Backup Setup
# Run this script as Administrator

Write-Host "🤖 Setting up automated daily backups for Vistapro..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js first from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if PostgreSQL tools are installed
try {
    $pgVersion = pg_dump --version
    Write-Host "✅ PostgreSQL tools found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL tools (pg_dump) are not installed" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools first" -ForegroundColor Yellow
    pause
    exit 1
}

# Test the backup script
Write-Host "🧪 Testing backup script..." -ForegroundColor Yellow
try {
    node backup_production_db.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup script test successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Backup script test failed!" -ForegroundColor Red
        pause
        exit 1
    }
} catch {
    Write-Host "❌ Error testing backup script: $_" -ForegroundColor Red
    pause
    exit 1
}

# Create the scheduled task
Write-Host "📅 Creating scheduled task..." -ForegroundColor Yellow

$taskName = "VistaproDailyBackup"
$taskDescription = "Daily backup of Vistapro production database"
$scriptPath = "C:\Users\abc\OneDrive\Desktop\Vistapro\backup_production_db.js"
$workingDir = "C:\Users\abc\OneDrive\Desktop\Vistapro"

# Remove existing task if it exists
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "🗑️  Removed existing task (if any)" -ForegroundColor Yellow
} catch {
    # Task doesn't exist, that's fine
}

# Create the action
$action = New-ScheduledTaskAction -Execute "node" -Argument "\"$scriptPath\"" -WorkingDirectory $workingDir

# Create the trigger (daily at 2 AM)
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

# Create the settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Create the principal (run with highest privileges)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description $taskDescription
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "📅 Task will run daily at 2:00 AM" -ForegroundColor Cyan
    Write-Host "📁 Backups will be saved to: C:\Users\abc\OneDrive\Desktop\Vistapro\backups" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    pause
    exit 1
}

# Show task information
Write-Host ""
Write-Host "📋 Task Information:" -ForegroundColor Cyan
Write-Host "Name: $taskName" -ForegroundColor White
Write-Host "Schedule: Daily at 2:00 AM" -ForegroundColor White
Write-Host "Script: $scriptPath" -ForegroundColor White
Write-Host "Working Directory: $workingDir" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Automated backup setup completed!" -ForegroundColor Green
Write-Host "💡 To manage the task, use Task Scheduler or run:" -ForegroundColor Yellow
Write-Host "   Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
