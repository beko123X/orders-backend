// routes/user.routes.js
import express from "express";
import {
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser
} from "../controllers/auth.controller.js";
import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = express.Router();

// All user management routes require authentication and admin permissions
router.use(protect);
router.use(authorize(PERMISSIONS.USER_MANAGE));

// User management endpoints
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;