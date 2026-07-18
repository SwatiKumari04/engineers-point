import { ApiError } from "../utils/api-error.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route: ${req.method} ${req.path}` } });
};

// Every error in the app ends up here, so the client always gets the same
// JSON shape. The 4-argument signature is how Express recognizes an error
// handler, so _next must stay even though it is unused.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
};
