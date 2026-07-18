import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.email("Enter a valid email address"),
});
