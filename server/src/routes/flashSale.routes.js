import { Router } from "express";
import * as flashSales from "../controllers/flashSale.controller.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { claimSaleSchema, launchSaleSchema } from "../schemas/flashSale.schema.js";

export const flashSaleRoutes = Router();

flashSaleRoutes.get("/current", flashSales.listCurrentSales);
flashSaleRoutes.post("/", requireAdmin, validate(launchSaleSchema), flashSales.launchSale);
flashSaleRoutes.post("/:id/claim", validate(claimSaleSchema), flashSales.claimSale);
flashSaleRoutes.post("/:id/confirm", validate(claimSaleSchema), flashSales.confirmSale);
flashSaleRoutes.post("/:id/release", validate(claimSaleSchema), flashSales.releaseSale);
flashSaleRoutes.patch("/:id/end", requireAdmin, flashSales.endSale);
