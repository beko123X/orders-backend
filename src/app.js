import 'dotenv/config.js'; // أو import dotenv from "dotenv"; dotenv.config();
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
import fs from 'fs';
import { fileURLToPath } from 'url';

// app.js (add this line)


// Add this after your other middleware



// This middleware must be BEFORE other body parsers for webhook


const app = express();

app.use(express.json());

app.use(
  "/api/payments/stripe/webhook",
  bodyParser.raw({ type: "application/json" })
);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://order-management-system-client.vercel.app' // رابط Frontend بعد النشر
  ],
  credentials: true
}));


app.get("/", (req, res) => {
  res.send("Order Management System API is running");
});




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use("/api/payments", paymentRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// backend/app.js


// ✅ مسار uploads الثابت
const uploadsPath = 'E:/js dev/order-management-system/backend/uploads';
console.log('📁 Serving static files from:', uploadsPath);

// تأكد من وجود المجلد
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Created uploads directory');
}

// خدمة الملفات الثابتة
app.use('/uploads', express.static(uploadsPath));

//users endpoints
app.use('/api/users', userRoutes);
// Test endpoint
app.get('/test-uploads', (req, res) => {
  const files = fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : [];
  res.json({
    uploadsPath,
    exists: fs.existsSync(uploadsPath),
    files: files,
    fileCount: files.length
  });
});




export default app;
