import Product from "../models/Product.js";

// Create new product (Admin)
export const createProduct = async (req, res) => {
  const { name, price, stock } = req.body;
  const product = await Product.create({ name, price, stock });
  res.status(201).json(product);
};

// Get all products
export const getProducts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = {};

  // بحث بالاسم
  if (req.query.keyword) {
    filter.name = {
      $regex: req.query.keyword,
      $options: "i",
    };
  }

  // فلترة بالسعر
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice)
      filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice)
      filter.price.$lte = Number(req.query.maxPrice);
  }

  const total = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    page,
    pages: Math.ceil(total / limit),
    total,
    count: products.length,
    products,
  });
  
};

// Get single product
export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

// Update product (Admin)
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

// Delete product (Admin)
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted successfully" });
};
