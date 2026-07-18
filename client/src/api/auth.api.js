import { http } from "./http.js";

export const adminLogin = (adminId) => http.post("/auth/admin", { adminId });

export const requestStudentPassword = (details) => http.post("/auth/student/password", details);

export const studentLogin = (credentials) => http.post("/auth/student/login", credentials);
