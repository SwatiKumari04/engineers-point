import { Router } from "express";
import * as orders from "../controllers/order.controller.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { placeOrderSchema } from "../schemas/order.schema.js";

export const orderRoutes = Router();

orderRoutes.post("/", validate(placeOrderSchema), orders.placeOrder);
orderRoutes.get("/", orders.listMyOrders); // ?phone=XXXXXXXXXX
orderRoutes.get("/all", requireAdmin, orders.listAllOrders);
orderRoutes.patch("/:id/ready", requireAdmin, orders.markOrderReady);
