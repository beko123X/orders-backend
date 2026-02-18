// routes/product.routes.js
import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} from "../controllers/product.controller.js";
import protect from "../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import authorize from "../middlewares/authorize.middleware.js";
import upload from "../config/multer.js";
import { checkProductsImages } from '../controllers/product.controller.js';


const router = express.Router();


// backend/routes/product.routes.js

// أضف هذا الرoute مؤقتاً للتحقق
router.get('/admin/check-images', checkProductsImages);

// Serve uploaded files statically
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes
router.get("/", getProducts);
router.get("/:id", getProduct);

// Protected routes with image upload
router.post(
  "/",
  protect,
  authorize(PERMISSIONS.PRODUCT_CREATE),
  upload.single('image'), // 'image' is the field name
  createProduct
);

router.put(
  "/:id",
  protect,
  authorize(PERMISSIONS.PRODUCT_UPDATE),
  upload.single('image'),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  authorize(PERMISSIONS.PRODUCT_DELETE),
  deleteProduct
);

export default router;