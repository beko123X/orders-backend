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
    },
    imagePublicId: {
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