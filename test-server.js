// test-server.js - الآن يستخدم التطبيق الرئيسي
import app from "./src/app.js"; // استيراد التطبيق الرئيسي
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('=' .repeat(50));
console.log('🚀 Starting server with FULL APP...');
console.log('=' .repeat(50));

// Connect to MongoDB
connectDB()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// Start the main app
const server = app.listen(PORT, HOST, () => {
  console.log('=' .repeat(50));
  console.log(`✅ FULL APP IS RUNNING!`);
  console.log('=' .repeat(50));
  console.log(`📡 Health check:     http://localhost:${PORT}/health`);
  console.log(`📡 API:              http://localhost:${PORT}/api`);
  console.log(`📡 Auth test:        http://localhost:${PORT}/api/auth/test`);
  console.log(`📡 Debug:            http://localhost:${PORT}/debug`);
  console.log('=' .repeat(50));
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});