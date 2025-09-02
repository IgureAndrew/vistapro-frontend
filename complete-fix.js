const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Complete Vistapro Fix Script');
console.log('================================');
console.log('');

// Step 1: Kill all Node processes
async function killNodeProcesses() {
  return new Promise((resolve) => {
    console.log('🔪 Step 1: Killing all Node.js processes...');
    exec('taskkill /f /im node.exe', (error) => {
      if (error) {
        console.log('⚠️ No Node processes to kill or already killed');
      } else {
        console.log('✅ All Node processes killed');
      }
      resolve();
    });
  });
}

// Step 2: Start local database
async function startDatabase() {
  return new Promise((resolve) => {
    console.log('');
    console.log('🐳 Step 2: Starting local database...');
    exec('docker-compose up -d', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Database might already be running or Docker not available');
      } else {
        console.log('✅ Database started');
      }
      resolve();
    });
  });
}

// Step 3: Wait for database to be ready
async function waitForDatabase() {
  console.log('');
  console.log('⏳ Step 3: Waiting for database to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('✅ Database should be ready');
}

// Step 4: Copy real database from production
async function copyDatabase() {
  return new Promise((resolve) => {
    console.log('');
    console.log('📊 Step 4: Copying real database from production...');
    const backendPath = path.join(__dirname, 'backend');
    
    exec('node run-db-setup.js', { cwd: backendPath }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Database copy failed:', error.message);
      } else {
        console.log('✅ Database copied successfully');
        if (stdout) console.log('📝 Output:', stdout);
      }
      resolve();
    });
  });
}

// Step 5: Start backend server
async function startBackend() {
  return new Promise((resolve) => {
    console.log('');
    console.log('🚀 Step 5: Starting backend server on port 5003...');
    const backendPath = path.join(__dirname, 'backend');
    
    exec('npm run dev', { cwd: backendPath }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backend failed to start:', error.message);
      } else {
        console.log('✅ Backend started successfully');
        if (stdout) console.log('📝 Output:', stdout);
      }
      resolve();
    });
  });
}

// Main execution
async function main() {
  try {
    console.log('🎯 Starting complete fix process...');
    console.log('📁 Working directory:', __dirname);
    console.log('');
    
    await killNodeProcesses();
    await startDatabase();
    await waitForDatabase();
    await copyDatabase();
    
    console.log('');
    console.log('🎉 Setup completed!');
    console.log('📝 Next steps:');
    console.log('1. Backend should be running on port 5003');
    console.log('2. Frontend should connect to http://localhost:5003');
    console.log('3. Database should have real production data');
    console.log('4. You can login with your real credentials');
    console.log('');
    console.log('🚀 Starting backend now...');
    
    await startBackend();
    
  } catch (error) {
    console.error('❌ Complete fix failed:', error);
  }
}

// Run the fix
main();
