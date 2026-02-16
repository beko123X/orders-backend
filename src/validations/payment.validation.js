import { body } from "express-validator";

export const payOrderValidation = [
  body("paymentMethod")
    .optional()
    .isIn(["cash", "card"])
    .withMessage("Invalid payment method"),
];
