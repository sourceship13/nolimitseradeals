// Simple test server for React Native device connection testing
const http = require('http');
const os = require('os');

const PORT = 3001;

// Get network interfaces
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  // Enable CORS for React Native
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const localIP = getLocalIP();
  
  // Health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Test server running successfully!',
      server: {
        port: PORT,
        localIP: localIP,
        localhost: `http://localhost:${PORT}`,
        networkAccess: `http://${localIP}:${PORT}`,
      },
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        test: '/test',
        api: '/api/*'
      }
    }));
    return;
  }

  // Test endpoint
  if (req.url === '/test' || req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Connection test successful!',
      clientIP: req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Mock auth endpoints for React Native testing
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Mock login successful',
      token: 'mock-jwt-token-12345',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      }
    }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <h1>🎉 React Native Test Server</h1>
    <p><strong>Status:</strong> Running successfully!</p>
    <p><strong>Local Access:</strong> <a href="http://localhost:${PORT}">http://localhost:${PORT}</a></p>
    <p><strong>Network Access:</strong> <a href="http://${localIP}:${PORT}">http://${localIP}:${PORT}</a></p>
    
    <h2>Test Endpoints:</h2>
    <ul>
      <li><a href="/health">/health</a> - Health check</li>
      <li><a href="/test">/test</a> - Connection test</li>
      <li><a href="/api/health">/api/health</a> - API health check</li>
    </ul>
    
    <h2>Mock API Endpoints:</h2>
    <ul>
      <li>POST /api/auth/login - Mock login</li>
    </ul>
    
    <p><em>Use this server to test React Native physical device connections!</em></p>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('🚀 Test Server Started!');
  console.log('');
  console.log('📍 Access Points:');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}`);
  console.log('');
  console.log('🧪 Test URLs:');
  console.log(`   Health:  http://${localIP}:${PORT}/health`);
  console.log(`   API:     http://${localIP}:${PORT}/api/health`);
  console.log('');
  console.log('📱 For React Native physical device:');
  console.log(`   Use: http://${localIP}:8080 as base URL`);
  console.log('');
  console.log('⏹️  Press Ctrl+C to stop server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});