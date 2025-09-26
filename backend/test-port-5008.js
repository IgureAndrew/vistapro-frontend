// Test server on port 5008
const express = require('express');
const http = require('http');

console.log('🧪 Testing port 5008...');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', port: 5008 });
});

const PORT = 5008;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});
