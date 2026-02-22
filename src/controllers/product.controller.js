// controllers/product.controller.js
import Product from "../models/Product.js";
import { cloudinary } from "../config/cloudinary.js";

// ===== CREATE PRODUCT =====
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
    let imagePublicId = null;
    
    // ✅ معالجة الصورة من Cloudinary
    if (req.file) {
      console.log('✅ File uploaded to Cloudinary');
      console.log('Cloudinary URL:', req.file.path);
      console.log('Cloudinary Public ID:', req.file.filename);
      
      imageUrl = req.file.path; // رابط Cloudinary الكامل
      imagePublicId = req.file.filename; // معرف الصورة في Cloudinary
    } else {
      console.log('⚠️ No file uploaded');
    }

    // إنشاء المنتج
    const product = new Product({
      name,
      price: Number(price),
      stock: Number(stock),
      description: description || '',
      imageUrl,
      imagePublicId
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
    
    // حذف الصورة من Cloudinary إذا فشل إنشاء المنتج
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log('🧹 Deleted uploaded image from Cloudinary due to error');
      } catch (cloudinaryErr) {
        console.error('Error deleting from Cloudinary:', cloudinaryErr);
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

// ===== CHECK PRODUCTS IMAGES =====
export const checkProductsImages = async (req, res) => {
  try {
    const products = await Product.find();
    
    const results = await Promise.all(products.map(async (product) => {
      let imageExists = false;
      
      if (product.imagePublicId) {
        try {
          // التحقق من وجود الصورة في Cloudinary
          const result = await cloudinary.api.resource(product.imagePublicId);
          imageExists = !!result;
        } catch (error) {
          imageExists = false;
        }
      }
      
      return {
        id: product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        imagePublicId: product.imagePublicId,
        imageExists: imageExists
      };
    }));
    
    res.json({
      success: true,
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

    // إذا تم رفع صورة جديدة
    if (req.file) {
      console.log('📸 Updating product image...');
      
      // حذف الصورة القديمة من Cloudinary
      if (product.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(product.imagePublicId);
          console.log('✅ Old image deleted from Cloudinary');
        } catch (deleteErr) {
          console.error('⚠️ Error deleting old image:', deleteErr);
        }
      }
      
      // إضافة الصورة الجديدة
      product.imageUrl = req.file.path;
      product.imagePublicId = req.file.filename;
    }

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    console.error('Error in updateProduct:', error);
    
    // حذف الصورة الجديدة إذا فشل التحديث
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cloudinaryErr) {
        console.error('Error deleting from Cloudinary:', cloudinaryErr);
      }
    }
    
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

    // حذف الصورة من Cloudinary إذا وجدت
    if (product.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(product.imagePublicId);
        console.log('✅ Image deleted from Cloudinary');
      } catch (cloudinaryErr) {
        console.error('⚠️ Error deleting from Cloudinary:', cloudinaryErr);
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