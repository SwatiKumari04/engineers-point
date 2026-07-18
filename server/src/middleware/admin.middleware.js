import { config } from "../config.js";
import { ApiError } from "../utils/api-error.js";

// Guards owner-only routes with the x-admin-id header. A production app
// would use sessions or JWTs; a shared-secret header is enough for this scale.
export const requireAdmin = (req, _res, next) => {
  if (req.get("x-admin-id") !== config.adminId) {
    return next(ApiError.unauthorized("Owner access required"));
  }
  next();
};
