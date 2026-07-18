import { z } from "zod";
import { customerSchema } from "./customer.schema.js";

export const placeOrderSchema = z.object({
  customer: customerSchema,
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        qty: z.number().int().min(1).max(15, "Maximum 15 units per item"),
      }),
    )
    .min(1, "Cart is empty"),
  paymentMethod: z.literal("UPI").default("UPI"),
});
