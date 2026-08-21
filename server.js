const http = require('http');
const chatHandler = require('./api/chat.js');
const leadsHandler = require('./api/leads.js');
const validateHandler = require('./api/validate-lead.js');

const server = http.createServer(async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route to appropriate handler
  if (req.url === '/api/chat' && req.method === 'POST') {
    return chatHandler(req, res);
  }
  if (req.url === '/api/leads' && req.method === 'POST') {
    return leadsHandler(req, res);
  }
  if (req.url === '/api/validate-lead' && req.method === 'POST') {
    return validateHandler(req, res);
  }

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Portfolio Chatbot Backend running on port ${PORT}`);
  console.log(`📍 API endpoints:`);
  console.log(`   POST /api/chat - Main chatbot`);
  console.log(`   POST /api/leads - Capture leads`);
  console.log(`   POST /api/validate-lead - Validate`);
  console.log(`   GET /health - Health check`);
});
