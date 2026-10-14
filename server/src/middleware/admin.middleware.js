import { ApiError } from "../utils/api-error.js";
import { verifyToken } from "../utils/jwt.js";

// Owner-only guard: verify the JWT and require the owner role.
export const requireAdmin = (req, _res, next) => {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token ? verifyToken(token) : null;
  if (!user) return next(ApiError.unauthorized("Login required"));
  if (user.role !== "owner") return next(ApiError.unauthorized("Owner access required"));
  req.user = user;
  next();
};