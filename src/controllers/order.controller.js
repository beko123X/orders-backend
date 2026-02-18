import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "../services/stripe.service.js";
/**
 * Create new order
 * POST /api/orders
 */


/**
 * @desc Create new order with stock check
 * @route POST /api/orders
 * @access User
 */
// backend/controllers/order.controller.js

export const createOrder = async (req, res) => {
  const { products } = req.body;

  if (!products || products.length === 0) {
    return res.status(400).json({ message: "No products provided" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalPrice = 0;
    const orderProducts = [];

    // تحقق من المخزون وخصم الكمية
    for (let p of products) {
      const dbProd = await Product.findById(p.product).session(session);
      if (!dbProd) throw new Error(`Product ${p.product} not found`);
      
      console.log('🔍 Product found:', dbProd.name, 'Image:', dbProd.imageUrl); // ✅ للتحقق
      
      if (p.quantity > dbProd.stock) {
        throw new Error(
          `Not enough stock for product ${dbProd.name}. Available: ${dbProd.stock}`
        );
      }

      dbProd.stock -= p.quantity;
      await dbProd.save({ session });

      // ✅ تأكد من حفظ كامل بيانات المنتج
      orderProducts.push({
        product: {
          _id: dbProd._id,
          name: dbProd.name,
          price: dbProd.price,
          imageUrl: dbProd.imageUrl // ✅ مهم جداً
        },
        quantity: p.quantity,
        price: dbProd.price,
      });

      totalPrice += dbProd.price * p.quantity;
    }

    const order = await Order.create(
      [{
        user: req.user._id,
        products: orderProducts,
        totalPrice,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    console.log('✅ Order created with products:', order[0].products.length);
    
    res.status(201).json(order[0]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};



// backend/controllers/order.controller.js

// Get my orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: 'products.product',
        select: 'name price imageUrl description stock' // ✅ تأكد من وجود imageUrl
      })
      .sort({ createdAt: -1 });

    // ✅ للتحقق - طباعة البيانات
    console.log('📦 Orders found:', orders.length);
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, order._id);
      order.products.forEach((item, pIndex) => {
        console.log(`  Product ${pIndex + 1}:`, {
          name: item.product?.name,
          imageUrl: item.product?.imageUrl // ✅ يجب أن يظهر هنا
        });
      });
    });

    res.json(orders);
  } catch (error) {
    console.error('Error in getMyOrders:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all orders (Admin)
 * GET /api/orders
 */
// backend/controllers/order.controller.js
// تأكد من وجود هذه الدالة بالشكل الصحيح

// Get all orders (Admin & Manager)
export const getAllOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by user
    if (req.query.user) {
      filter.user = req.query.user;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      filter.totalPrice = {};
      if (req.query.minPrice) filter.totalPrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.totalPrice.$lte = Number(req.query.maxPrice);
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("products.product", "name price imageUrl")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      page,
      pages: Math.ceil(total / limit),
      count: orders.length,
      total,
      orders,
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


/**
 * Update order status (Admin)
 * PUT /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatus = ["pending", "paid", "shipped", "delivered", "cancelled"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = status;

  if (status === "paid") {
    order.isPaid = true;
    order.paidAt = new Date();
  }

  await order.save();
  res.json(order);
};

/**
 * Update products / quantities in order
 * PUT /api/orders/:id/products
 */

/**
 * @desc Update order products (quantity change) with stock management
 * @route PUT /api/orders/:id/products
 * @access User/Admin
 */
export const updateOrderProducts = async (req, res) => {
  const { products } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) throw new Error("Order not found");

    // إعادة المخزون القديم
    for (let item of order.products) {
      const prod = await Product.findById(item.product).session(session);
      if (prod) {
        prod.stock += item.quantity;
        await prod.save({ session });
      }
    }

    // تحقق من المخزون الجديد وخصم الكميات
    let totalPrice = 0;
    const orderProducts = [];

    for (let p of products) {
      const dbProd = await Product.findById(p.product).session(session);
      if (!dbProd) throw new Error(`Product ${p.product} not found`);
      if (p.quantity > dbProd.stock)
        throw new Error(
          `Not enough stock for product ${dbProd.name}. Available: ${dbProd.stock}`
        );
        dbProd.stock -= p.quantity;
      await dbProd.save({ session });

      orderProducts.push({
        product: dbProd._id,
        quantity: p.quantity,
        price: dbProd.price,
      });

      totalPrice += dbProd.price * p.quantity;
    }
    order.products = orderProducts;
    order.totalPrice = totalPrice;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

// export const updateOrderProducts = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const order = await Order.findById(req.params.id).session(session);
//     if (!order) throw new Error("Order not found");

//     // restore old stock
//     for (let item of order.products) {
//       const product = await Product.findById(item.product).session(session);
//       if (product) {
//         product.stock += item.quantity;
//         await product.save({ session });
//       }
//     }

//     let newProducts = [];
//     let totalPrice = 0;

//     for (let p of req.body.products) {
//       const product = await Product.findById(p.product).session(session);
//       if (!product) throw new Error("Product not found");

//       if (product.stock < p.quantity) {
//         throw new Error(`Not enough stock for ${product.name}`);
//       }

//       product.stock -= p.quantity;
//       await product.save({ session });

//       newProducts.push({
//         product: product._id,
//         quantity: p.quantity,
//         price: product.price,
//       });

//       totalPrice += product.price * p.quantity;
//     }

//     order.products = newProducts;
//     order.totalPrice = totalPrice;
//     await order.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.json({ message: "Order updated", order });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     res.status(400).json({ message: error.message });
//   }
// };


/**
 * Delete order (Admin)
 * DELETE /api/orders/:id
 */
export const deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      throw new Error("Order not found");
    }

    // Restore stock
    for (let item of order.products) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    await order.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Order deleted and stock restored successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ message: error.message });
  }
};


/**
 * Pay order (User)
 * POST /api/orders/:id/pay
 */
/**
 * @desc Pay order (Mock Payment)
 * @route POST /api/orders/:id/pay
 * @access User
 */
export const payOrder = async (req, res) => {
  const { paymentMethod } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order)
    return res.status(404).json({ message: "Order not found" });

  // 🔒 Ownership
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // ❌ Cancelled
  if (order.isCancelled) {
    return res.status(400).json({ message: "Order is cancelled" });
  }

  // ❌ Already paid
  if (order.isPaid) {
    return res.status(400).json({ message: "Order already paid" });
  }

  // 💳 Mock payment success
  order.paymentMethod = paymentMethod || "cash";
  order.isPaid = true;
  order.paidAt = new Date();
  order.status = "paid";

  order.paymentResult = {
    id: `MOCK-${Date.now()}`,
    status: "success",
    updateTime: new Date().toISOString(),
    email: req.user.email,
  };

  await order.save();

  res.json({
    message: "Payment successful",
    order,
  });
};

// export const payOrder = async (req, res) => {
//   const order = await Order.findById(req.params.id);
//   if (!order) return res.status(404).json({ message: "Order not found" });

//   if (order.user.toString() !== req.user._id.toString()) {
//     return res.status(403).json({ message: "Not authorized" });
//   }

//   if (order.isPaid) return res.status(400).json({ message: "Order already paid" });

//   order.isPaid = true;
//   order.status = "paid";
//   order.paidAt = new Date();
//   await order.save();

//   res.json({ message: "Payment successful", order });
// };


// Cancel order (user or admin)
// export const cancelOrder = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const order = await Order.findById(req.params.id).session(session);
//     if (!order) throw new Error("Order not found");

//     // لا يمكن إلغاء الطلب بعد التسليم
//     if (order.status === "delivered") {
//       throw new Error("Cannot cancel a delivered order");
//     }

//     // استرجاع المخزون
//     for (let item of order.products) {
//       const product = await Product.findById(item.product).session(session);
//       if (product) {
//         product.stock += item.quantity;
//         await product.save({ session });
//       }
//     }

//     // تحديث حالة الطلب
//     order.status = "cancelled";

//     // إذا تم الدفع مسبقًا، اعتبره مستردًا
//     if (order.isPaid) {
//       order.refunded = true;
//     }

//     await order.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.json({
//       message: "Order cancelled successfully",
//       order,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     res.status(400).json({ message: error.message });
//   }
// };

/**
 * @desc Cancel order (restock products)
 * @route PUT /api/orders/:id/cancel
 * @access User/Admin
 */
// export const cancelOrder = async (req, res) => {
//   const order = await Order.findById(req.params.id);

//   if (!order) {
//     return res.status(404).json({ message: "Order not found" });
//   }

//   // لو User → لازم الطلب يكون له
//   if (req.user.role === "user") {
//     if (order.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     if (order.status !== "pending") {
//       return res.status(400).json({
//         message: "You can only cancel pending orders",
//       });
//     }
//   }

//   // منع إلغاء طلب ملغي سابقًا
//   if (order.status === "cancelled") {
//     return res.status(400).json({ message: "Order already cancelled" });
//   }

//   // 🔄 إعادة المخزون
//   for (let item of order.products) {
//     const product = await Product.findById(item.product);
//     if (product) {
//       product.stock += item.quantity;
//       await product.save();
//     }
//   }

//   // 💰 Refund logic (Mock)
//   if (order.isPaid) {
//     order.refunded = true;
//     order.refundedAt = new Date();
//   }

//   order.status = "cancelled";
//   await order.save();

//   res.json({
//     message: "Order cancelled successfully",
//     order,
//   });
// };


export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // صلاحيات: user يلغي طلبه فقط
    if (
      req.user.role !== "admin" &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order already cancelled" });
    }

    // 1️⃣ إعادة المخزون
    for (const item of order.products) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.stock += item.quantity;
        await product.save({ session });
      }
    }

    // 2️⃣ Refund إذا كان مدفوعًا
    if (order.isPaid && order.paymentIntentId) {
      await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
      });
    }

    // 3️⃣ تحديث الطلب
    order.status = "cancelled";
    order.isPaid = false;
    order.paidAt = null;

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};
