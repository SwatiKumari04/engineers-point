import { config } from "../config.js";
import { ApiError } from "../utils/api-error.js";
import { authService } from "../services/auth.service.js";

// The admin ID is checked on the server so the secret never ships in client code.
export const adminLogin = (req, res) => {
  if (req.body.adminId !== config.adminId) {
    throw ApiError.unauthorized("Incorrect Admin ID", "BAD_ADMIN_ID");
  }
  res.json({ name: "Owner", role: "owner" });
};

export const requestStudentPassword = async (req, res) => {
  res.json(await authService.requestPassword(req.body));
};

export const studentLogin = (req, res) => {
  res.json(authService.login(req.body));
};
