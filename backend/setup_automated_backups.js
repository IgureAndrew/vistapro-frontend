#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🤖 Setting up automated daily backups...');

// Create Windows Task Scheduler XML
const taskXml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>2024-01-15T00:00:00</Date>
    <Author>Vistapro Backup System</Author>
    <Description>Daily backup of Vistapro production database</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2024-01-15T02:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-18</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>node</Command>
      <Arguments>"${path.resolve('backup_production_db.js')}"</Arguments>
      <WorkingDirectory>${path.resolve('.')}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`;

// Create PowerShell script to register the task
const powershellScript = `# Vistapro Automated Backup Setup
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
$scriptPath = "${path.resolve('backup_production_db.js')}"
$workingDir = "${path.resolve('.')}"

# Remove existing task if it exists
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "🗑️  Removed existing task (if any)" -ForegroundColor Yellow
} catch {
    # Task doesn't exist, that's fine
}

# Create the action
$action = New-ScheduledTaskAction -Execute "node" -Argument "\\"$scriptPath\\"" -WorkingDirectory $workingDir

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
    Write-Host "📁 Backups will be saved to: ${path.resolve('backups')}" -ForegroundColor Cyan
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
`;

// Create batch file for easy setup
const batchScript = `@echo off
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
`;

// Write the files
fs.writeFileSync('vistapro_backup_task.xml', taskXml);
fs.writeFileSync('setup_automated_backups.ps1', powershellScript);
fs.writeFileSync('setup_automated_backups.bat', batchScript);

console.log('✅ Automated backup setup files created:');
console.log('📄 setup_automated_backups.bat - Double-click to run (as Administrator)');
console.log('📄 setup_automated_backups.ps1 - PowerShell script');
console.log('📄 vistapro_backup_task.xml - Task Scheduler XML');
console.log('');
console.log('🚀 To set up automated backups:');
console.log('1. Right-click "setup_automated_backups.bat"');
console.log('2. Select "Run as administrator"');
console.log('3. Follow the prompts');
console.log('');
console.log('📅 The backup will run daily at 2:00 AM');
console.log('📁 Backups will be saved to the "backups" folder');
console.log('🗑️  Old backups (7+ days) will be automatically deleted');
