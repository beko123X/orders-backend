import 'dotenv/config.js';
import express from "express";
import cors from "cors";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// =============================================
// CORS CONFIGURATION - UPDATED FOR PRODUCTION
// =============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://order-management-system-client.vercel.app',
  // Add your Pxxl App backend URL (once deployed)
  // 'https://your-app-name.pxxl.app',
  // Add your Netlify frontend URL (once deployed)
  // 'https://your-frontend.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// =============================================
// STATIC FILES & UPLOADS - CLOUD STORAGE VERSION
// =============================================

// ⚠️ IMPORTANT: For production on Pxxl App, files won't persist!
// Consider using cloud storage like Cloudinary, AWS S3, or Supabase
// This is a temporary solution for development/testing

const uploadsPath = path.join(__dirname, '../uploads');
console.log('📁 Uploads path (temporary):', uploadsPath);

// Create uploads directory if it doesn't exist (works on Pxxl App but files won't persist after restarts)
import fs from 'fs';
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ Created uploads directory');
  } catch (error) {
    console.log('⚠️ Could not create uploads directory:', error.message);
    console.log('💡 For production, use cloud storage instead of local files');
  }
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsPath));

// =============================================
// ROUTES
// =============================================

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =============================================
// TEST ENDPOINTS
// =============================================

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Order Management System API is running",
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    note: "This is the backend API. Frontend is hosted separately."
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({ 
    message: "Hello from backend!",
    status: "healthy",
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

// Test uploads endpoint (informational only)
app.get('/test-uploads', (req, res) => {
  res.json({
    message: "Uploads endpoint - For production, use cloud storage",
    note: "Local file storage is temporary on Pxxl App. Files will not persist after app restarts.",
    recommendation: "Implement cloud storage (Cloudinary/AWS S3) for production",
    uploadsPath: uploadsPath
  });
});

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: '/api, /api-docs, /test-uploads'
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