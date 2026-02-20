import 'dotenv/config.js';
import express from "express";
import cors from "cors";
import mongoose from 'mongoose';
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// =============================================
// 1. MIDDLEWARE الأساسية (الأولى دائماً)
// =============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - للسماح بجميع الطلبات (للتجربة)
app.use(cors({
    origin: true,
    credentials: true
}));

// =============================================
// 2. HEALTH CHECK ENDPOINTS (يجب أن تكون سريعة)
// =============================================
app.get('/health', (req, res) => {
    return res.status(200).json({ 
        status: 'healthy',
        time: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.get('/healthz', (req, res) => {
    return res.status(200).send('OK');
});

app.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Order Management System API',
        status: 'running',
        environment: process.env.NODE_ENV || 'development'
    });
});

// =============================================
// 3. IMPORT الراوترز (بعد الـ middleware الأساسية)
// =============================================
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import paymentRoutes from "./routes/payment.routes.js";
import userRoutes from "./routes/user.routes.js";

// =============================================
// 4. MOUNT ROUTERS - هذا هو الجزء الأهم!
// =============================================
console.log('📡 Mounting API routes...');

// Auth routes - يجب أن تعمل الآن
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
// 5. STATIC FILES & UPLOADS
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

// Test uploads endpoint
app.get('/test-uploads', (req, res) => {
    return res.status(200).json({
        message: 'Uploads endpoint',
        uploadsPath: uploadsPath,
        exists: fs.existsSync(uploadsPath)
    });
});

// =============================================
// 6. TEST ENDPOINTS - للتأكد من أن الراوترز تعمل
// =============================================
app.get('/api/test-direct', (req, res) => {
    return res.status(200).json({ 
        message: 'Direct API test endpoint working',
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
            docs: '/api-docs',
            test: '/api/test-direct'
        }
    });
});

app.get('/debug', (req, res) => {
    const routes = [];
    if (app._router && app._router.stack) {
        app._router.stack.forEach(layer => {
            if (layer.route) {
                routes.push(`${Object.keys(layer.route.methods)} ${layer.route.path}`);
            } else if (layer.name === 'router' && layer.handle.stack) {
                layer.handle.stack.forEach(subLayer => {
                    if (subLayer.route) {
                        routes.push(`  ↳ ${Object.keys(subLayer.route.methods)} /api${subLayer.route.path}`);
                    }
                });
            }
        });
    }
    
    return res.status(200).json({
        env: process.env.NODE_ENV,
        node_version: process.version,
        mongodb_state: mongoose.connection.readyState,
        registered_routes: routes
    });
});

// =============================================
// 7. 404 HANDLER - يجب أن يكون في النهاية
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
            '/api',
            '/api/test-direct',
            '/debug',
            '/test-uploads',
            '/api-docs',
            '/api/auth/test',
            '/api/auth/register',
            '/api/auth/login',
            '/api/products',
            '/api/orders',
            '/api/payments',
            '/api/users'
        ]
    });
});

// =============================================
// 8. ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    return res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

export default app;