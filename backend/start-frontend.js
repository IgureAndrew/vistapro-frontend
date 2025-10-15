#!/usr/bin/env node

/**
 * Start Frontend Server Only
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
    log('🚀 Starting Frontend Server', 'blue');
    log('==========================', 'blue');
    
    // Kill existing processes
    await killProcessesOnPort(5173);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start frontend
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit',
      shell: true
    });
    
    log('✅ Frontend server started!', 'green');
    log('🌐 Frontend: http://localhost:5173', 'blue');
    log('', '');
    log('Press Ctrl+C to stop the server', 'yellow');
    
    // Handle shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down frontend server...', 'yellow');
      frontendProcess.kill('SIGTERM');
      setTimeout(() => {
        log('✅ Frontend server stopped', 'green');
        process.exit(0);
      }, 2000);
    });
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
