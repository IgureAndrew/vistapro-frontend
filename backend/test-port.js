console.log('🔍 Testing Port Configuration...');
console.log('');

console.log('📋 Environment Variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

console.log('📁 Current Directory:', __dirname);
console.log('📄 Server.js Path:', __dirname + '/backend/server.js');
console.log('');

// Try to read and parse the server.js file
const fs = require('fs');
const path = require('path');

try {
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Look for PORT configuration
  const portMatch = serverContent.match(/const PORT = process\.env\.PORT \|\| (\d+);/);
  if (portMatch) {
    console.log('✅ Found PORT configuration in server.js:', portMatch[1]);
  } else {
    console.log('❌ No PORT configuration found in server.js');
  }
  
  // Look for any hardcoded ports
  const hardcodedPorts = serverContent.match(/\b(5000|5001|5002)\b/g);
  if (hardcodedPorts) {
    console.log('🔍 Hardcoded ports found:', hardcodedPorts);
  }
  
} catch (error) {
  console.error('❌ Error reading server.js:', error.message);
}

console.log('');
console.log('🎯 Expected: PORT should be 5002');
console.log('📝 If you see 5000 or 5001, there might be a cached version');
