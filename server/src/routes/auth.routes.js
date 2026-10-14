import { Router } from "express";
import { adminLogin, requestStudentPassword, studentLogin } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { adminLoginSchema, requestPasswordSchema, studentLoginSchema } from "../schemas/auth.schema.js";

export const authRoutes = Router();

authRoutes.post("/admin", validate(adminLoginSchema), adminLogin);
authRoutes.post("/student/password", authLimiter, validate(requestPasswordSchema), requestStudentPassword);
authRoutes.post("/student/login", authLimiter, validate(studentLoginSchema), studentLogin);