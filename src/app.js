import 'dotenv/config.js';
import express from "express";
import cors from "cors";
import mongoose from 'mongoose'; // IMPORTANT: Added this!
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import paymentRoutes from "./routes/payment.routes.js";
import userRoutes from "./routes/user.routes.js";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// =============================================
// HEALTH CHECK ENDPOINTS - MUST BE FIRST!
// =============================================

// Simple health check for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Additional health check for some platforms
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Order Management System API",
    status: "running",
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "/api-docs",
      test: "/test-uploads",
      debug: "/debug"
    }
  });
});

// =============================================
// MIDDLEWARE
// =============================================

// Webhook middleware (must be before other body parsers)
app.use(
  "/api/payments/stripe/webhook",
  bodyParser.raw({ type: "application/json" })
);

// Regular JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// CORS CONFIGURATION - FIXED FOR PRODUCTION
// =============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://order-management-system-client.vercel.app',
  // Will be updated after deployment
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // For production, you can temporarily allow all origins to test
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true); // REMOVE THIS AFTER TESTING!
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn('⚠️ Blocked origin:', origin);
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// =============================================
// STATIC FILES & UPLOADS
// =============================================

const uploadsPath = path.join(__dirname, '../uploads');
console.log('📁 Uploads path:', uploadsPath);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ Created uploads directory');
  } catch (error) {
    console.log('⚠️ Could not create uploads directory:', error.message);
  }
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsPath));

// =============================================
// API ROUTES
// =============================================

// API info endpoint
app.get("/api", (req, res) => {
  res.json({ 
    message: "Order Management System API",
    status: "healthy",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      orders: "/api/orders",
      payments: "/api/payments",
      users: "/api/users",
      docs: "/api-docs"
    }
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodb_uri_set: !!process.env.MONGO_URI,
    jwt_secret_set: !!process.env.JWT_SECRET,
    stripe_key_set: !!process.env.STRIPE_SECRET_KEY,
    webhook_secret_set: !!process.env.STRIPE_WEBHOOK_SECRET,
    node_version: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    mongodb_state: mongoose.connection.readyState
  });
});

// Test uploads endpoint
app.get('/test-uploads', (req, res) => {
  const files = fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : [];
  res.json({
    message: "Uploads endpoint",
    note: "Local file storage is temporary on Pxxl App",
    uploadsPath: uploadsPath,
    files: files,
    fileCount: files.length
  });
});

// Mount route handlers
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler for undefined routes (THIS MUST BE LAST!)
app.use('*', (req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      "/",
      "/health",
      "/healthz",
      "/api",
      "/debug",
      "/test-uploads",
      "/api-docs",
      "/api/auth",
      "/api/products",
      "/api/orders",
      "/api/payments",
      "/api/users"
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

export default app;