import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { createPaymentIntent, refundOrder, stripeWebhook } from "../controllers/payment.controller.js";
import authorize from "../middlewares/authorize.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

/**
 * @swagger
 * /api/payments/stripe/create-intent:
 *   post:
 *     summary: Create Stripe Payment Intent
 *     tags: [Payments]
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
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client_secret: { type: string }
 */

/**
 * @route   POST /api/payments/stripe/create-intent
 * @desc    Create Stripe Payment Intent for an order
 * @access  User
 */
// router.post("/stripe/create-intent", protect, createStripePaymentIntent);


/**
 * @swagger
 * /api/payments/refund/{orderId}:
 *   put:
 *     summary: Refund an order payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: Only users with permission `REFUND_PAYMENT` can call this endpoint
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to refund
 *     responses:
 *       200:
 *         description: Order refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order refunded successfully
 *       403:
 *         description: Unauthorized / Insufficient permissions
 *       404:
 *         description: Order not found
 *       400:
 *         description: Refund failed or invalid request
 */

/**
 * @swagger
 * /api/payments/stripe/webhook:
 *   post:
 *     summary: Stripe webhook to handle payment events
 *     tags: [Payments]
 *     description: Public endpoint. Stripe calls this to confirm payment events.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe event payload
 *     responses:
 *       200:
 *         description: Webhook received and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Webhook processed
 *       400:
 *         description: Invalid webhook payload
 */

router.post("/stripe/webhook", stripeWebhook); // public route, no auth
router.post("/stripe/create-intent", protect,authorize(PERMISSIONS.CREATE_PAYMENT), createPaymentIntent);
router.put("/refund/:orderId", protect,authorize(PERMISSIONS.REFUND_PAYMENT) ,refundOrder); // user or admin can call

export default router;
