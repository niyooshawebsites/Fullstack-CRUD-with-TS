import express from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registrationSchema } from "../schemas/auth.schema.js";
const router = express.Router();

router.post("/register", validate(registrationSchema), registerUser);

export default router;
