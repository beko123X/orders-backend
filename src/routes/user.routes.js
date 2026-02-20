import express from "express";
import {
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getUserStats
} from "../controllers/user.controller.js";
import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats endpoint (admin only)
router.get("/stats", authorize(PERMISSIONS.USER_MANAGE), getUserStats);

// User management endpoints (admin only)
router.get("/", authorize(PERMISSIONS.USER_MANAGE), getUsers);
router.get("/:id", authorize(PERMISSIONS.USER_MANAGE), getUserById);
router.put("/:id/role", authorize(PERMISSIONS.USER_MANAGE), updateUserRole);
router.delete("/:id", authorize(PERMISSIONS.USER_MANAGE), deleteUser);

export default router;