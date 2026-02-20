import express from "express";
import { register, login, getProfile } from "../controllers/auth.controller.js";
import {
  registerValidation,
  loginValidation
} from "../validations/auth.validation.js";
import validate from "../middlewares/validate.middleware.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: 'Auth route working' });
});

// Public routes
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

// Protected routes
router.get("/profile", protect, getProfile);

export default router;