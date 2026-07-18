import { Router } from "express";
import { getMenu, setAvailability } from "../controllers/menu.controller.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { availabilitySchema } from "../schemas/menu.schema.js";

export const menuRoutes = Router();

menuRoutes.get("/", getMenu);
menuRoutes.patch("/:id/availability", requireAdmin, validate(availabilitySchema), setAvailability);
