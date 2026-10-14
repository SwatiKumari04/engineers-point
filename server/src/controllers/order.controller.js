import { orderService } from "../services/order.service.js";

export const placeOrder = async (req, res) => {
  res.status(201).json(await orderService.place(req.body));
};

export const listMyOrders = async (req, res) => {
  res.json(await orderService.listForPhone(req.user.phone));
};

export const listAllOrders = async (_req, res) => {
  res.json(await orderService.listAll());
};

export const markOrderReady = async (req, res) => {
  res.json(await orderService.markReady(req.params.id));
};