import { adminHeaders, http } from "./http.js";

export const fetchMenu = () => http.get("/menu");

export const setItemAvailability = (itemId, available, adminId) =>
  http.patch(`/menu/${itemId}/availability`, { available }, { headers: adminHeaders(adminId) });
