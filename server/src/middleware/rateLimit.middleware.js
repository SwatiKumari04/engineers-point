import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/api-error.js";

// Throttle only in production; dev and tests are never rate-limited.
const skip = () => process.env.NODE_ENV !== "production";

// Blunts brute-force logins and OTP-email spam, per IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  limit: 30,             // 30 auth attempts per IP per window
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(ApiError.tooManyRequests("Too many attempts. Please try again in a few minutes.")),
});