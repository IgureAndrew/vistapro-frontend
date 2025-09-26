// Test server on port 3000 (well-known port)
const express = require('express');
const http = require('http');

console.log('🧪 Testing port 3000...');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', port: 3000 });
});

const PORT = 3000;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Keep process alive
process.stdin.resume();
