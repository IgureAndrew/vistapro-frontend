// Minimal app test to isolate the issue
const express = require('express');
const http = require('http');

console.log('🧪 Testing minimal Express app...');

const app = express();
app.use(express.json());

// Simple health endpoint
app.get('/health', (req, res) => {
  console.log('Health endpoint hit');
  res.json({ status: 'OK', message: 'Minimal app working' });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  console.log('API test endpoint hit');
  res.json({ message: 'API test working' });
});

const PORT = 5007;

console.log('1. Creating HTTP server...');
const server = http.createServer(app);

console.log('2. Starting server...');
server.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Server error:', error);
  } else {
    console.log(`✅ Minimal server running on port ${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
    console.log(`✅ API Test: http://localhost:${PORT}/api/test`);
  }
});

// Keep process alive
process.stdin.resume();
