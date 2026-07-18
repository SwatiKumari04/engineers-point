import { ApiError } from "../utils/api-error.js";
import { orderService } from "../services/order.service.js";

export const placeOrder = (req, res) => {
  res.status(201).json(orderService.place(req.body));
};

export const listMyOrders = (req, res) => {
  const { phone } = req.query;
  if (!/^\d{10}$/.test(phone ?? "")) {
    throw ApiError.badRequest("A valid 10-digit phone query param is required");
  }
  res.json(orderService.listForPhone(phone));
};

export const listAllOrders = (_req, res) => {
  res.json(orderService.listAll());
};

export const markOrderReady = (req, res) => {
  res.json(orderService.markReady(req.params.id));
};
