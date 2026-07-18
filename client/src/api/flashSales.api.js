import { adminHeaders, http } from "./http.js";

export const fetchCurrentSales = () => http.get("/flash-sales/current");

export const claimSale = (saleId, customer) => http.post(`/flash-sales/${saleId}/claim`, { customer });

export const confirmSale = (saleId, customer) => http.post(`/flash-sales/${saleId}/confirm`, { customer });

export const releaseSale = (saleId, customer) => http.post(`/flash-sales/${saleId}/release`, { customer });

export const launchSale = (payload, adminId) =>
  http.post("/flash-sales", payload, { headers: adminHeaders(adminId) });

export const endSale = (saleId, adminId) =>
  http.patch(`/flash-sales/${saleId}/end`, undefined, { headers: adminHeaders(adminId) });
