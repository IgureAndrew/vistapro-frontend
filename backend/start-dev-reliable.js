#!/usr/bin/env node

/**
 * Reliable Vistapro Development Server Startup
 * This script starts both servers without aggressive timeouts
 * and provides better error handling
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
      stdio: 'inherit',
      shell: true
    });

    let backendReady = false;
    let serverStarted = false;

    // Listen for successful startup
    const checkBackendReady = () => {
      if (serverStarted && !backendReady) {
        backendReady = true;
        log('✅ Backend server is ready!', 'green');
        resolve(backendProcess);
      }
    };

    // Check if backend is ready every 2 seconds
    const readyCheck = setInterval(() => {
      if (backendReady) {
        clearInterval(readyCheck);
        return;
      }
      
      // Check if port 5007 is listening
      const { exec } = require('child_process');
      exec('netstat -ano | findstr :5007', (error, stdout) => {
        if (stdout && stdout.includes('LISTENING')) {
          serverStarted = true;
          checkBackendReady();
        }
      });
    }, 2000);

    backendProcess.on('close', (code) => {
      clearInterval(readyCheck);
      if (!backendReady) {
        log(`❌ Backend server exited with code ${code}`, 'red');
        reject(new Error(`Backend server failed with code ${code}`));
      }
    });

    backendProcess.on('error', (error) => {
      clearInterval(readyCheck);
      log(`❌ Backend server error: ${error.message}`, 'red');
      reject(error);
    });

    // Cleanup timeout after 2 minutes
    setTimeout(() => {
      clearInterval(readyCheck);
      if (!backendReady) {
        log('⏰ Backend startup timeout (2 minutes)', 'red');
        reject(new Error('Backend startup timeout'));
      }
    }, 120000);
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    log('🚀 Starting frontend server...', 'blue');
    
    const frontendPath = path.join(__dirname, 'frontend');
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendPath,
      stdio: 'inherit',
      shell: true
    });

    let frontendReady = false;

    // Check if frontend is ready every 2 seconds
    const readyCheck = setInterval(() => {
      if (frontendReady) {
        clearInterval(readyCheck);
        return;
      }
      
      // Check if port 5173 is listening
      const { exec } = require('child_process');
      exec('netstat -ano | findstr :5173', (error, stdout) => {
        if (stdout && stdout.includes('LISTENING')) {
          frontendReady = true;
          clearInterval(readyCheck);
          log('✅ Frontend server is ready!', 'green');
          resolve(frontendProcess);
        }
      });
    }, 2000);

    frontendProcess.on('close', (code) => {
      clearInterval(readyCheck);
      if (!frontendReady) {
        log(`❌ Frontend server exited with code ${code}`, 'red');
        reject(new Error(`Frontend server failed with code ${code}`));
      }
    });

    frontendProcess.on('error', (error) => {
      clearInterval(readyCheck);
      log(`❌ Frontend server error: ${error.message}`, 'red');
      reject(error);
    });

    // Cleanup timeout after 2 minutes
    setTimeout(() => {
      clearInterval(readyCheck);
      if (!frontendReady) {
        log('⏰ Frontend startup timeout (2 minutes)', 'red');
        reject(new Error('Frontend startup timeout'));
      }
    }, 120000);
  });
}

async function main() {
  try {
    log('🎯 Vistapro Development Server Startup (Reliable)', 'bright');
    log('================================================', 'bright');
    
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
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start backend first
    const backendProcess = await startBackend();
    
    // Wait a moment for backend to fully initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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
