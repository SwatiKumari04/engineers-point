import { adminHeaders, http } from "./http.js";

export const placeOrder = (payload) => http.post("/orders", payload);

export const fetchMyOrders = (phone) => http.get(`/orders?phone=${encodeURIComponent(phone)}`);

export const fetchAllOrders = (adminId) => http.get("/orders/all", { headers: adminHeaders(adminId) });

export const markOrderReady = (orderId, adminId) =>
  http.patch(`/orders/${orderId}/ready`, undefined, { headers: adminHeaders(adminId) });
