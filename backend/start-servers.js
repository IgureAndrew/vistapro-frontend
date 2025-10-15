#!/usr/bin/env node

/**
 * Vistapro Development Server Startup Script
 * This script provides a reliable way to start both frontend and backend servers
 * with proper error handling, port management, and automatic restarts.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
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

function startBackend() {
  return new Promise((resolve, reject) => {
    log('🚀 Starting backend server...', 'blue');
    
    const backendPath = path.join(__dirname, 'backend');
    const backendProcess = spawn('node', ['start-dev.js'], {
      cwd: backendPath,
      stdio: 'pipe',
      shell: true
    });

    let backendReady = false;
    let serverStarted = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[BACKEND] ${output}`);
      
      if (output.includes('Server running on port') && !serverStarted) {
        serverStarted = true;
        // Wait a bit more to ensure server is fully ready
        setTimeout(() => {
          if (!backendReady) {
            backendReady = true;
            log('✅ Backend server is ready!', 'green');
            resolve(backendProcess);
          }
        }, 3000);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      process.stderr.write(`[BACKEND ERROR] ${error}`);
      
      if (error.includes('EADDRINUSE')) {
        log('⚠️  Port 5007 is in use, attempting to free it...', 'yellow');
        killProcessesOnPort(5007).then(() => {
          log('🔄 Retrying backend startup...', 'blue');
          setTimeout(() => startBackend().then(resolve).catch(reject), 2000);
        });
      }
    });

    backendProcess.on('close', (code) => {
      if (!backendReady) {
        log(`❌ Backend server exited with code ${code}`, 'red');
        reject(new Error(`Backend server failed with code ${code}`));
      }
    });

    backendProcess.on('error', (error) => {
      log(`❌ Backend server error: ${error.message}`, 'red');
      reject(error);
    });

    // Timeout after 45 seconds (increased from 30)
    setTimeout(() => {
      if (!backendReady) {
        log('⏰ Backend startup timeout', 'red');
        reject(new Error('Backend startup timeout'));
      }
    }, 45000);
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    log('🚀 Starting frontend server...', 'blue');
    
    const frontendPath = path.join(__dirname, 'frontend');
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendPath,
      stdio: 'pipe',
      shell: true
    });

    let frontendReady = false;

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[FRONTEND] ${output}`);
      
      if (output.includes('Local:   http://localhost:5173/') && !frontendReady) {
        frontendReady = true;
        log('✅ Frontend server is ready!', 'green');
        resolve(frontendProcess);
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      process.stderr.write(`[FRONTEND ERROR] ${error}`);
    });

    frontendProcess.on('close', (code) => {
      if (!frontendReady) {
        log(`❌ Frontend server exited with code ${code}`, 'red');
        reject(new Error(`Frontend server failed with code ${code}`));
      }
    });

    frontendProcess.on('error', (error) => {
      log(`❌ Frontend server error: ${error.message}`, 'red');
      reject(error);
    });

    // Timeout after 60 seconds (increased from 45)
    setTimeout(() => {
      if (!frontendReady) {
        log('⏰ Frontend startup timeout', 'red');
        reject(new Error('Frontend startup timeout'));
      }
    }, 60000);
  });
}

async function main() {
  try {
    log('🎯 Vistapro Development Server Startup', 'bright');
    log('=====================================', 'bright');
    
    // Check if we're in the right directory
    if (!fs.existsSync('backend') || !fs.existsSync('frontend')) {
      log('❌ Please run this script from the Vistapro root directory', 'red');
      process.exit(1);
    }

    // Kill any existing processes on our ports
    log('🧹 Cleaning up existing processes...', 'yellow');
    await killProcessesOnPort(5007);
    await killProcessesOnPort(5173);
    
    // Wait a moment for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start backend first
    const backendProcess = await startBackend();
    
    // Wait a moment for backend to fully initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start frontend
    const frontendProcess = await startFrontend();
    
    log('🎉 Both servers are running successfully!', 'green');
    log('🌐 Frontend: http://localhost:5173', 'cyan');
    log('🔧 Backend: http://localhost:5007', 'cyan');
    log('', 'reset');
    log('Press Ctrl+C to stop both servers', 'yellow');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down servers...', 'yellow');
      backendProcess.kill('SIGTERM');
      frontendProcess.kill('SIGTERM');
      
      setTimeout(() => {
        log('✅ Servers stopped', 'green');
        process.exit(0);
      }, 2000);
    });

    // Keep the process alive
    process.on('exit', () => {
      backendProcess.kill();
      frontendProcess.kill();
    });

  } catch (error) {
    log(`❌ Startup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the main function
main();
