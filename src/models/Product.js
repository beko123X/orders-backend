
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         category:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */


// models/Product.js

// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Product name is required'] 
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'], 
      min: [0, 'Price cannot be negative'] 
    },
    description: { 
      type: String,
      default: ''
    },
    stock: { 
      type: Number, 
      default: 0, 
      min: [0, 'Stock cannot be negative'] 
    },
    imageUrl: { 
      type: String,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;