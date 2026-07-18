import { ApiError } from "../utils/api-error.js";

// Validates req.body against a Zod schema and replaces it with the parsed
// (typed, trimmed) result, so handlers only ever see clean data.
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const [issue] = result.error.issues;
    const field = issue.path.join(".");
    return next(ApiError.badRequest(field ? `${field}: ${issue.message}` : issue.message, "VALIDATION_ERROR"));
  }
  req.body = result.data;
  next();
};
