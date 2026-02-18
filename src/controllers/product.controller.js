
// backend/controllers/product.controller.js
import Product from "../models/Product.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createProduct = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📝 Creating new product...');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { name, price, stock, description } = req.body;

    // التحقق من البيانات
    if (!name || !price || !stock) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide name, price, and stock" 
      });
    }

    let imageUrl = null;
    
    // ✅ معالجة الصورة مع تحقق إضافي
    if (req.file) {
      console.log('✅ File uploaded successfully');
      console.log('File path:', req.file.path);
      console.log('File destination:', req.file.destination);
      console.log('File filename:', req.file.filename);
      
      // تحقق من وجود الملف فعلياً
      if (fs.existsSync(req.file.path)) {
        console.log('✅ File exists on disk at:', req.file.path);
        
        // احصل على حجم الملف للتحقق
        const stats = fs.statSync(req.file.path);
        console.log('📊 File size:', stats.size, 'bytes');
        
        imageUrl = `/uploads/${req.file.filename}`;
        console.log('🖼️ Image URL saved:', imageUrl);
      } else {
        console.log('❌ File does NOT exist on disk!');
        return res.status(500).json({ 
          success: false, 
          message: "File upload failed - file not saved" 
        });
      }
    } else {
      console.log('⚠️ No file uploaded');
    }

    // إنشاء المنتج
    const product = new Product({
      name,
      price: Number(price),
      stock: Number(stock),
      description: description || '',
      imageUrl
    });

    await product.save();
    console.log('✅ Product saved to database with ID:', product._id);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: {
        ...product.toObject(),
        imageUrl: imageUrl // تأكد من إرجاع الرابط
      }
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    // حذف الصورة إذا فشل إنشاء المنتج
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Deleted uploaded file due to error');
      } catch (unlinkErr) {
        console.error('Error deleting file:', unlinkErr);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    console.log('='.repeat(50));
  }
};

// دالة للتحقق من جميع المنتجات والصور
export const checkProductsImages = async (req, res) => {
  try {
    const products = await Product.find();
    const uploadDir = 'E:/js dev/order-management-system/backend/uploads';
    
    const results = products.map(product => {
      let imageExists = false;
      let imagePath = null;
      
      if (product.imageUrl) {
        const filename = path.basename(product.imageUrl);
        imagePath = path.join(uploadDir, filename);
        imageExists = fs.existsSync(imagePath);
      }
      
      return {
        id: product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        imageExists: imageExists,
        imagePath: imagePath,
        imageInDb: !!product.imageUrl
      };
    });
    
    // قائمة الملفات في مجلد uploads
    let filesInUploads = [];
    if (fs.existsSync(uploadDir)) {
      filesInUploads = fs.readdirSync(uploadDir);
    }
    
    res.json({
      success: true,
      uploadsDirectory: uploadDir,
      uploadsExists: fs.existsSync(uploadDir),
      filesInUploads: filesInUploads,
      products: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// ===== GET ALL PRODUCTS =====
export const getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.keyword) {
      filter.name = { $regex: req.query.keyword, $options: "i" };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      page,
      pages: Math.ceil(total / limit),
      total,
      products
    });

  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ===== GET SINGLE PRODUCT =====
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error in getProduct:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ===== UPDATE PRODUCT =====
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    const { name, price, stock, description } = req.body;

    if (name) product.name = name;
    if (price) product.price = Number(price);
    if (stock) product.stock = Number(stock);
    if (description) product.description = description;

    if (req.file) {
      // حذف الصورة القديمة إذا وجدت
      if (product.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', product.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ===== DELETE PRODUCT =====
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // حذف الصورة إذا وجدت
    if (product.imageUrl) {
      const imagePath = path.join(__dirname, '..', product.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};