import { config } from "../config.js";
import { ApiError } from "../utils/api-error.js";
import { authService } from "../services/auth.service.js";
import { signToken } from "../utils/jwt.js";

export const adminLogin = (req, res) => {
  if (req.body.adminId !== config.adminId) {
    throw ApiError.unauthorized("Incorrect Admin ID", "BAD_ADMIN_ID");
  }
  const user = { name: "Owner", role: "owner" };
  res.json({ token: signToken(user), user });
};

export const requestStudentPassword = async (req, res) => {
  res.json(await authService.requestPassword(req.body));
};

export const studentLogin = async (req, res) => {
  const user = await authService.login(req.body);
  res.json({ token: signToken(user), user });
};