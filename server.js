import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// ✅ مهم جداً لـ Vercel - تصدير التطبيق
export default app;

// ✅ للتشغيل المحلي فقط
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}