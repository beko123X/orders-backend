import 'dotenv/config.js';
import express from "express";
import cors from "cors";
import mongoose from 'mongoose';
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
// 1. ESSENTIAL MIDDLEWARE (APPLIED FIRST)
// =============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS - Allow everything for testing
app.use(cors({
    origin: true,
    credentials: true
}));

// =============================================
// 2. HEALTH CHECK ENDPOINTS (MUST RESPOND FAST)
// =============================================
app.get('/health', (req, res) => {
    return res.status(200).json({ 
        status: 'healthy',
        time: new Date().toISOString()
    });
});

app.get('/healthz', (req, res) => {
    return res.status(200).send('OK');
});

// =============================================
// 3. TEST ENDPOINTS - TO VERIFY ROUTING WORKS
// =============================================
app.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Order Management System API',
        status: 'running',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/test', (req, res) => {
    return res.status(200).json({ 
        message: 'Test endpoint working',
        method: req.method,
        path: req.path
    });
});

app.get('/api/test', (req, res) => {
    return res.status(200).json({ 
        message: 'API test endpoint working',
        timestamp: new Date().toISOString()
    });
});

app.get('/api', (req, res) => {
    return res.status(200).json({
        message: 'API is ready',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            orders: '/api/orders',
            payments: '/api/payments',
            users: '/api/users',
            docs: '/api-docs'
        }
    });
});

app.get('/debug', (req, res) => {
    return res.status(200).json({
        env: process.env.NODE_ENV,
        node_version: process.version,
        mongodb_state: mongoose.connection.readyState,
        routes: ['/', '/test', '/api/test', '/api', '/debug', '/api-docs', '/api/auth', '/api/products', '/api/orders']
    });
});

// =============================================
// 4. STATIC FILES & UPLOADS
// =============================================
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
    try {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log('✅ Created uploads directory');
    } catch (error) {
        console.log('⚠️ Uploads directory error:', error.message);
    }
}
app.use('/uploads', express.static(uploadsPath));

app.get('/test-uploads', (req, res) => {
    return res.status(200).json({
        message: 'Uploads endpoint',
        uploadsPath: uploadsPath,
        exists: fs.existsSync(uploadsPath)
    });
});

// =============================================
// 5. API ROUTES - Mount routers
// =============================================
console.log('📡 Mounting API routes...');

// Auth routes
app.use("/api/auth", authRoutes);
console.log('✅ Auth routes mounted at /api/auth');

// Product routes
app.use("/api/products", productRoutes);
console.log('✅ Product routes mounted at /api/products');

// Order routes
app.use("/api/orders", orderRoutes);
console.log('✅ Order routes mounted at /api/orders');

// Payment routes
app.use("/api/payments", paymentRoutes);
console.log('✅ Payment routes mounted at /api/payments');

// User routes
app.use("/api/users", userRoutes);
console.log('✅ User routes mounted at /api/users');

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('✅ Swagger docs mounted at /api-docs');

// =============================================
// 6. 404 HANDLER - MUST BE LAST
// =============================================
app.use('*', (req, res) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: [
            '/',
            '/health',
            '/healthz',
            '/test',
            '/api/test',
            '/api',
            '/debug',
            '/test-uploads',
            '/api-docs',
            '/api/auth',
            '/api/products',
            '/api/orders',
            '/api/payments',
            '/api/users'
        ]
    });
});

// =============================================
// 7. ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    return res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

export default app;