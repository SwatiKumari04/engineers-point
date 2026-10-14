import { http } from "./http.js";

export const placeOrder = (payload) => http.post("/orders", payload);

export const fetchMyOrders = () => http.get("/orders/mine");

export const fetchAllOrders = () => http.get("/orders/all");

export const markOrderReady = (orderId) => http.patch(`/orders/${orderId}/ready`);