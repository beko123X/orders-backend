import app from "./src/app.js"; // تأكد أن المسار صحيح
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
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', PORT);
console.log('=' .repeat(50));

// Connect to MongoDB but don't block server start
connectDB()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// Start server IMMEDIATELY
const server = app.listen(PORT, HOST, () => {
  console.log('=' .repeat(50));
  console.log(`✅ SERVER IS RUNNING!`);
  console.log('=' .repeat(50));
  console.log(`📡 Health check:     http://localhost:${PORT}/health`);
  console.log(`📡 API:              http://localhost:${PORT}/api`);
  console.log(`📡 Debug:            http://localhost:${PORT}/debug`);
  console.log('=' .repeat(50));
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// ... باقي الكود

// ✅ تأكد من وجود هذا السطر في النهاية
export default app;

// ❌ قم بإزالة أو تعليق أي كود إضافي بعد التصدير