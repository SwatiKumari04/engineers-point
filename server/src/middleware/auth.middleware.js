import { ApiError } from "../utils/api-error.js";
import { verifyToken } from "../utils/jwt.js";

// Any logged-in user: verify the JWT and attach req.user.
export const requireAuth = (req, _res, next) => {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token ? verifyToken(token) : null;
  if (!user) return next(ApiError.unauthorized("Login required"));
  req.user = user;
  next();
};