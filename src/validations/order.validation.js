import { body } from "express-validator";

export const createOrderValidation = [
  body("products")
    .isArray({ min: 1 })
    .withMessage("Products must be an array with at least one item"),
    
  body("products.*.product")
    .notEmpty()
    .withMessage("Product ID is required"),
    
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];


export const updateOrderStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "paid", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid status"),
];

