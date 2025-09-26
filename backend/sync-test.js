// Synchronous test to see what's happening
const express = require('express');
const http = require('http');

console.log('🧪 Starting synchronous test...');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = 3000;

console.log('1. Creating HTTP server...');
const server = http.createServer(app);

console.log('2. Starting server...');
server.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Server error:', error);
  } else {
    console.log(`✅ Server running on port ${PORT}`);
  }
});

console.log('3. Server setup complete');

// Test if server is actually listening
setTimeout(() => {
  console.log('4. Testing server...');
  const net = require('net');
  const client = new net.Socket();
  
  client.connect(PORT, 'localhost', () => {
    console.log('✅ Server is actually listening!');
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.error('❌ Server not listening:', err.message);
  });
}, 1000);
