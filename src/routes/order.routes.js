import express from "express";
import authorize from "../middlewares/authorize.middleware.js";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderProducts,
  deleteOrder,
  payOrder,
  cancelOrder
} from "../controllers/order.controller.js";
import { PERMISSIONS } from "../config/permissions.js";
import protect from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";
import { payOrderValidation } from "../validations/payment.validation.js";
import validate from "../middlewares/validate.middleware.js";
import { createOrderValidation } from './../validations/order.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */
  
// User routes
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 */
// router.post("/", protect, createOrder);

/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get logged-in user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */

// router.get("/myorders", protect, getMyOrders);


/**
 * @swagger
 * /api/orders/{id}/pay:
 *   post:
 *     summary: Pay for order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment successful
 */

// router.post("/:id/pay", protect, payOrderValidation, validate, payOrder);



// User
router.get("/myorders", protect, authorize(PERMISSIONS.ORDER_VIEW_OWN), getMyOrders);
router.post("/:id/pay", protect, payOrder);
router.post("/", protect, createOrderValidation, validate, createOrder);
// Admin & Manager
router.get("/", protect, authorize(PERMISSIONS.ORDER_VIEW_ALL), getAllOrders);
router.put("/:id/status", protect, authorize(PERMISSIONS.ORDER_UPDATE_STATUS), updateOrderStatus);
router.put("/:id/products", protect, authorize(PERMISSIONS.updateOrderProducts), updateOrderProducts);

//admin only
router.delete("/:id", protect, authorize(PERMISSIONS.ORDER_DELETE), deleteOrder);


router.put("/:id/cancel",protect,authorize(PERMISSIONS.ORDER_CANCEL),
  cancelOrder);
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders with pagination and filtering (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: paid
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *           example: 66cfd1e9d8f8a9f3c3b3a123
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           example: 100
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           example: 1000
 *     responses:
 *       200:
 *         description: Paginated orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: number
 *                 pages:
 *                   type: number
 *                 total:
 *                   type: number
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */


// Admin routes
// router.get("/", protect, isAdmin, getAllOrders);



/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */

// router.put("/:id/status", protect, isAdmin, updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/products:
 *   put:
 *     summary: Update order products & quantities
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Order updated with stock adjustment
 */
// router.put("/:id/products", protect, isAdmin, updateOrderProducts);



/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order and restore stock
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */

// router.delete("/:id", protect, isAdmin, deleteOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     description: Cancel an order by ID. Restocks the products and marks as refunded if paid.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to cancel
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order cancelled successfully"
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid operation (e.g., already delivered)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot cancel a delivered order"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order not found"
 */

// Cancel order (user or admin)


export default router;
