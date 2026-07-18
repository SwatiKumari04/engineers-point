import { z } from "zod";

export const adminLoginSchema = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
});

export const requestPasswordSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

export const studentLoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password: z.string().min(4, "Password is required"),
});
