import Order from "../models/Order.js";
import stripe from "../services/stripe.service.js";

export const createStripePaymentIntent = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required" });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // RBAC — فقط صاحب الطلب
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (order.isPaid) {
    return res.status(400).json({ message: "Order already paid" });
  }

  // Stripe expects amount in cents
  const amount = Math.round(order.totalPrice * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    amount: order.totalPrice,
    currency: "usd",
  });
};


export const createPaymentIntent = async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId).populate("products.product");

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.isPaid) return res.status(400).json({ message: "Order already paid" });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // cents
      currency: "usd",
      metadata: { orderId: order._id.toString() },
    });

    res.json({ client_secret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create payment intent" });
  }
};



/**
 * @desc Stripe Webhook Handler
 * @route POST /api/payments/stripe/webhook
 * @access Public
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // ⚠️ important: middleware must provide rawBody
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      const order = await Order.findById(orderId);
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.status = "paid";
        order.paidAt = new Date();
        await order.save();
        console.log(`✅ Order ${orderId} marked as paid`);
      }
      break;

    case "payment_intent.payment_failed":
      console.log("❌ Payment failed:", event.data.object.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};



export const refundOrder = async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!order.isPaid) return res.status(400).json({ message: "Order not paid yet" });

  try {
    // استدعاء refund في Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10,
      metadata: { orderId: order._id.toString() },
    });

    if (!paymentIntents.data.length)
      return res.status(404).json({ message: "PaymentIntent not found" });

    await stripe.refunds.create({ payment_intent: paymentIntents.data[0].id });

    // تحديث الطلب
    order.status = "cancelled";
    order.isPaid = false;
    order.paidAt = null;
    await order.save();

    res.json({ message: "Order refunded and cancelled", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Refund failed" });
  }
};

