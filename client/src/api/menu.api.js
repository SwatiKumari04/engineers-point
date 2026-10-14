import { http } from "./http.js";

export const fetchMenu = () => http.get("/menu");

export const setItemAvailability = (itemId, available) =>
  http.patch(`/menu/${itemId}/availability`, { available });