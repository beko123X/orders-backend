import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// =============================================
// SIMPLE HEALTH CHECK - MUST RESPOND IMMEDIATELY
// =============================================

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running',
    time: new Date().toISOString()
  });
});

// Health check - this is what Pxxl pings
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ working: true });
});

// =============================================
// START SERVER WITHOUT MONGODB FIRST
// =============================================

console.log('🚀 Starting test server...');
console.log(`📡 Binding to ${HOST}:${PORT}`);

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ TEST SERVER RUNNING!`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📍 http://localhost:${PORT}/health`);
  console.log(`📍 http://localhost:${PORT}/test`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});