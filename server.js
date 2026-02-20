import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import os from 'os';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('=' .repeat(50));
console.log('🚀 Starting server initialization...');
console.log('📁 Current directory:', process.cwd());
console.log('🔧 Node version:', process.version);
console.log('💻 Platform:', process.platform);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', PORT);
console.log('=' .repeat(50));

// Get local IP for debugging
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Start server
    const server = app.listen(PORT, HOST, () => {
      console.log('=' .repeat(50));
      console.log(`✅ SERVER IS RUNNING!`);
      console.log('=' .repeat(50));
      console.log(`📡 Local:            http://localhost:${PORT}`);
      console.log(`📡 Local IP:         http://${getLocalIP()}:${PORT}`);
      console.log(`📡 Health check:     http://localhost:${PORT}/health`);
      console.log(`📡 API:              http://localhost:${PORT}/api`);
      console.log(`📡 Docs:             http://localhost:${PORT}/api-docs`);
      console.log('=' .repeat(50));
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is already in use!`);
        console.error('💡 Try: PORT=3001 node server.js');
      }
      process.exit(1);
    });

  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});