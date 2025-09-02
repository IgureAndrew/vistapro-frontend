const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Force Restarting Vistapro Backend...');

// Function to kill all Node processes
function killNodeProcesses() {
  return new Promise((resolve) => {
    console.log('🔪 Killing all Node.js processes...');
    exec('taskkill /f /im node.exe', (error) => {
      if (error) {
        console.log('⚠️ No Node processes to kill or already killed');
      } else {
        console.log('✅ Killed all Node processes');
      }
      resolve();
    });
  });
}

// Function to start the backend
function startBackend() {
  return new Promise((resolve) => {
    console.log('🚀 Starting backend on port 5002...');
    const backendPath = path.join(__dirname, 'backend');
    
    exec('npm run dev', { cwd: backendPath }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backend failed to start:', error);
      } else {
        console.log('✅ Backend started successfully');
        console.log('📝 Output:', stdout);
      }
      resolve();
    });
  });
}

// Main execution
async function main() {
  try {
    await killNodeProcesses();
    
    // Wait a bit for processes to fully terminate
    console.log('⏳ Waiting for processes to terminate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await startBackend();
    
    console.log('🎉 Force restart completed!');
    console.log('📝 Backend should now be running on port 5002');
    
  } catch (error) {
    console.error('❌ Force restart failed:', error);
  }
}

main();
