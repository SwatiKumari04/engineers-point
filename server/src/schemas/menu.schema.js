import { z } from "zod";

export const availabilitySchema = z.object({
  available: z.boolean(),
});
