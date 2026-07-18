import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { flashSaleRoutes } from "./flashSale.routes.js";
import { menuRoutes } from "./menu.routes.js";
import { orderRoutes } from "./order.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
apiRouter.use("/auth", authRoutes);
apiRouter.use("/menu", menuRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/flash-sales", flashSaleRoutes);
