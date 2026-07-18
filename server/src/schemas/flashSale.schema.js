import { z } from "zod";
import { customerSchema } from "./customer.schema.js";

export const launchSaleSchema = z.object({
  itemId: z.string().min(1),
  salePrice: z.number().int().positive(),
  stock: z.number().int().min(1).max(500),
  durationMinutes: z.number().int().min(1).max(180),
});

export const claimSaleSchema = z.object({
  customer: customerSchema,
});
