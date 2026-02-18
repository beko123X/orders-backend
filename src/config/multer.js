// backend/config/multer.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ استخدم مسار ثابت ومباشر
const uploadDir = 'E:/js dev/order-management-system/backend/uploads';

console.log('📁 Multer upload directory:', uploadDir);

// تحقق من وجود المجلد وأنشئه إذا لم يكن موجوداً
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// تحقق من صلاحيات الكتابة
try {
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log('✅ Uploads directory is writable');
} catch (err) {
  console.log('❌ Uploads directory is NOT writable:', err.message);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('💾 Attempting to save to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'product-' + uniqueSuffix + ext;
    console.log('📝 Generated filename:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('🔍 Received file:', file.originalname, file.mimetype);
  
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('✅ File type accepted');
    cb(null, true);
  } else {
    console.log('❌ File type rejected');
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

export default upload;