import express from "express";
import { register, login } from "../controllers/auth.controller.js";
import {
  registerValidation,
  loginValidation
} from "../validations/auth.validation.js";
import validate from "../middlewares/validate.middleware.js";

const router = express.Router();

router.get("/test", (req, res)=>{
  res.json({message: 'Auth route working'})
})
router.post(
  "/register",
  registerValidation,
  validate,
  register
);

router.post(
  "/login",
  loginValidation,
  validate,
  login
);




export default router;
