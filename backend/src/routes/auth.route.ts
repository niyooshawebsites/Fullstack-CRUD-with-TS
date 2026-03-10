import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registrationSchema, loginSchema } from "../schemas/auth.schema.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
  loginLimiter,
  refreshLimiter,
} from "../middlewares/rateLimiter.middleware.js";
const router = express.Router();

router.post("/register", validate(registrationSchema), registerUser);
router.post("/login", loginLimiter, validate(loginSchema), loginUser);
router.post("/token/refresh", refreshLimiter, refreshToken);
router.post("/post/create", protect, registerUser);
router.post("/logout", logoutUser);

export default router;
