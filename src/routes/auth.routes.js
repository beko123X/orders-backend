import express from "express";
import { register, login } from "../controllers/auth.controller.js";
import {
  registerValidation,
  loginValidation
} from "../validations/auth.validation.js";
import validate from "../middlewares/validate.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ahmed
 *               email:
 *                 type: string
 *                 example: ahmed@mail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User registered
 */

router.post(
  "/register",
  registerValidation,
  validate,
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 example: ahmed@mail.com
 *               password:
 *                 example: 123456
 *     responses:
 *       200:
 *         description: JWT token
 */

router.post(
  "/login",
  loginValidation,
  validate,
  login
);

export default router;
