import 'dotenv/config.js'; // أو import dotenv from "dotenv"; dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import paymentRoutes from "./routes/payment.routes.js";
import bodyParser from "body-parser";



// This middleware must be BEFORE other body parsers for webhook


const app = express();
app.use(
  "/api/payments/stripe/webhook",
  bodyParser.raw({ type: "application/json" })
);
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Order Management System API is running");
});

app.use("/api/payments", paymentRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));



export default app;
