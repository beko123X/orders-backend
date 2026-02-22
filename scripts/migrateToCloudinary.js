// scripts/migrateToCloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// ✅ استيراد الموديل مع .js
import Product from '../src/models/Product.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ استخدام MONGO_URI كما هو في ملف .env الخاص بك
const MONGO_URI = process.env.MONGO_URI;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// تكوين Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

console.log('='.repeat(70));
console.log('🚀 CLOUDINARY MIGRATION TOOL');
console.log('='.repeat(70));

// ✅ التحقق من المتغيرات
console.log('\n🔍 Checking environment variables:');
console.log(`   MONGO_URI: ${MONGO_URI ? '✅ Found' : '❌ Not found'}`);
console.log(`   CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME ? '✅ Found' : '❌ Not found'}`);
console.log(`   CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY ? '✅ Found' : '❌ Not found'}`);
console.log(`   CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET ? '✅ Found' : '❌ Not found'}`);

if (!MONGO_URI) {
  console.error('\n❌ MONGO_URI is not defined in .env file');
  process.exit(1);
}

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('\n❌ Cloudinary credentials are not complete in .env file');
  process.exit(1);
}

// الاتصال بقاعدة البيانات باستخدام MONGO_URI
console.log('\n🔄 Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

async function migrateImages() {
  try {
    // التحقق من مجلد uploads
    const uploadDir = path.join(__dirname, '..', 'uploads');
    console.log(`\n📁 Uploads folder: ${uploadDir}`);
    console.log(`📁 Uploads exists: ${fs.existsSync(uploadDir)}`);
    
    if (!fs.existsSync(uploadDir)) {
      console.log('❌ Uploads folder not found!');
      console.log('📁 Creating uploads folder...');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Uploads folder created');
    }
    
    // قائمة الصور
    const imageFiles = fs.readdirSync(uploadDir);
    console.log(`\n📸 Found ${imageFiles.length} images in uploads folder:`);
    if (imageFiles.length > 0) {
      imageFiles.forEach((file, i) => console.log(`   ${i+1}. ${file}`));
    } else {
      console.log('   No images found in uploads folder');
    }
    
    // جلب المنتجات
    const products = await Product.find();
    console.log(`\n📦 Found ${products.length} products in database`);
    
    if (products.length === 0) {
      console.log('⚠️ No products found in database');
      process.exit(0);
    }
    
    // عرض المنتجات
    products.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.name} - Image: ${p.imageUrl || 'No image'}`);
    });
    
    // اختيار المنتجات التي تحتاج ترحيل
    const needsMigration = [];
    
    for (const product of products) {
      // إذا كان للمنتج صورة وهي محلية (تبدأ بـ /uploads)
      if (product.imageUrl && product.imageUrl.includes('/uploads/')) {
        const filename = path.basename(product.imageUrl);
        if (imageFiles.includes(filename)) {
          needsMigration.push({ product, filename });
        } else {
          console.log(`\n⚠️ Warning: Product ${product.name} has image ${filename} but file not found in uploads folder`);
        }
      }
      // إذا كان للمنتج صورة وهي من Cloudinary بالفعل (لا تحتوي على /uploads)
      else if (product.imageUrl && product.imageUrl.includes('cloudinary')) {
        console.log(`\n✅ Product ${product.name} already has Cloudinary image`);
      }
      // إذا كان للمنتج صورة من رابط آخر
      else if (product.imageUrl) {
        console.log(`\n⚠️ Product ${product.name} has external image: ${product.imageUrl}`);
      }
    }
    
    console.log(`\n🔄 Found ${needsMigration.length} products that need migration to Cloudinary`);
    
    if (needsMigration.length === 0) {
      console.log('✅ No migration needed! All products already have Cloudinary images or no images.');
      process.exit(0);
    }
    
    // تأكيد المستخدم
    console.log('\n📋 Products to migrate:');
    needsMigration.forEach((item, i) => {
      console.log(`   ${i+1}. ${item.product.name} -> ${item.filename}`);
    });
    
    console.log('\n⚠️  Do you want to continue? (Press Ctrl+C to cancel, waiting 5 seconds...)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // بدء الترحيل
    let success = 0;
    let failed = 0;
    
    for (const item of needsMigration) {
      const { product, filename } = item;
      const imagePath = path.join(uploadDir, filename);
      
      console.log(`\n📤 Uploading: ${filename} for product: ${product.name}`);
      
      try {
        // التحقق من وجود الملف
        if (!fs.existsSync(imagePath)) {
          throw new Error(`File not found: ${imagePath}`);
        }
        
        // قراءة حجم الملف
        const stats = fs.statSync(imagePath);
        console.log(`   📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
        
        // رفع الصورة إلى Cloudinary
        const result = await cloudinary.uploader.upload(imagePath, {
          folder: 'products',
          public_id: `product-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        });
        
        console.log(`   ✅ Cloudinary URL: ${result.secure_url}`);
        console.log(`   🆔 Public ID: ${result.public_id}`);
        
        // تحديث المنتج في قاعدة البيانات
        product.imageUrl = result.secure_url;
        product.imagePublicId = result.public_id;
        await product.save();
        
        console.log(`   ✅ Successfully updated product: ${product.name}`);
        success++;
        
        // اختيارياً: حذف الصورة المحلية بعد الترحيل
        // fs.unlinkSync(imagePath);
        // console.log(`   🧹 Deleted local file: ${filename}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to upload ${filename}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`   ✅ Successfully migrated: ${success} products`);
    console.log(`   ❌ Failed: ${failed} products`);
    console.log(`   📦 Total processed: ${needsMigration.length} products`);
    console.log('='.repeat(70));
    
    // عرض المنتجات المحدثة
    if (success > 0) {
      console.log('\n📋 Updated products:');
      const updatedProducts = await Product.find({ imagePublicId: { $exists: true } });
      updatedProducts.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name}: ${p.imageUrl}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
migrateImages();