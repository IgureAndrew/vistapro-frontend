#!/usr/bin/env node

/**
 * Simple Vistapro Development Server Startup
 * This script starts both servers without aggressive timeouts
 */

const { spawn } = require('child_process');
const path = require('path');

function log(message, color = '') {
  const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function killProcessesOnPort(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        const pids = lines
          .map(line => line.trim().split(/\s+/))
          .filter(parts => parts.length >= 5 && parts[1].includes(`:${port}`))
          .map(parts => parts[4])
          .filter(pid => pid && !isNaN(pid));
        
        if (pids.length > 0) {
          log(`🔍 Found processes on port ${port}: ${pids.join(', ')}`, 'yellow');
          pids.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, (err) => {
              if (!err) {
                log(`✅ Killed process ${pid} on port ${port}`, 'green');
              }
            });
          });
        }
      }
      resolve();
    });
  });
}

async function main() {
  try {
    log('🎯 Starting Vistapro Development Servers', 'blue');
    log('=====================================', 'blue');
    
    // Kill existing processes
    log('🧹 Cleaning up existing processes...', 'yellow');
    await killProcessesOnPort(5007);
    await killProcessesOnPort(5173);
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start backend
    log('🚀 Starting backend server...', 'blue');
    const backendProcess = spawn('node', ['start-dev.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true
    });
    
    // Wait for backend to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Start frontend
    log('🚀 Starting frontend server...', 'blue');
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit',
      shell: true
    });
    
    log('✅ Both servers started!', 'green');
    log('🌐 Frontend: http://localhost:5173', 'blue');
    log('🔧 Backend: http://localhost:5007', 'blue');
    log('', '');
    log('Press Ctrl+C to stop both servers', 'yellow');
    
    // Handle shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down servers...', 'yellow');
      backendProcess.kill('SIGTERM');
      frontendProcess.kill('SIGTERM');
      setTimeout(() => {
        log('✅ Servers stopped', 'green');
        process.exit(0);
      }, 2000);
    });
    
    // Keep alive
    process.on('exit', () => {
      backendProcess.kill();
      frontendProcess.kill();
    });
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
