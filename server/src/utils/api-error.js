// Error carrying an HTTP status and a stable code the client can branch on.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  static badRequest = (message, code = "BAD_REQUEST") => new ApiError(400, code, message);
  static unauthorized = (message, code = "UNAUTHORIZED") => new ApiError(401, code, message);
  static notFound = (message, code = "NOT_FOUND") => new ApiError(404, code, message);
  static conflict = (message, code = "CONFLICT") => new ApiError(409, code, message);
  static gone = (message, code = "GONE") => new ApiError(410, code, message);
}
