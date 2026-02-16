import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderProduct:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: Product ID
 *         quantity:
 *           type: integer
 *           example: 2
 *         price:
 *           type: number
 *           example: 100
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *         totalPrice:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, paid, shipped, delivered, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [unpaid, paid, refunded]
 *         createdAt:
 *           type: string
 *           format: date-time
 */


const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },

    // 🆕 Payment
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
    },
    refunded: {
      type: Boolean,
      default: false,
    },
    refundedAt: {
      type: Date,
    },


    // 🆕 Mock Payment Result
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      email: String,
    },

    // Order Status
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
