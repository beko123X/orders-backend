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

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://order-management-system-client.vercel.app'
  ],
  credentials: true
}));

// Webhook middleware (must be before other body parsers)
app.use(
  "/api/payments/stripe/webhook",
  bodyParser.raw({ type: "application/json" })
);

// ✅ الطريقة الصحيحة لمسار uploads (يعمل محلياً وعلى Vercel)
const uploadsPath = path.join(__dirname, 'uploads');
console.log('📁 Uploads path:', uploadsPath);

// تأكد من وجود المجلد (للتشغيل المحلي فقط)
if (process.env.NODE_ENV !== 'production') {
  const fs = await import('fs');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ Created uploads directory locally');
  }
}

// Serve React frontend build
app.use(express.static(path.join(__dirname, "public")));


app.get("/api", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// For all other routes, serve frontend index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});



// خدمة الملفات الثابتة
app.use('/uploads', express.static(uploadsPath));

// Routes
app.get("/", (req, res) => {
  res.send("Order Management System API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Test endpoint
app.get('/test-uploads', (req, res) => {
  res.json({
    message: "Uploads endpoint working",
    note: "On Vercel, files are not persisted",
    uploadsPath: uploadsPath
  });
});

export default app;