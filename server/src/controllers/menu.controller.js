import { ApiError } from "../utils/api-error.js";
import { menuStore } from "../stores/menu.store.js";

export const getMenu = (_req, res) => {
  res.json(menuStore.list());
};

export const setAvailability = (req, res) => {
  const item = menuStore.setAvailability(req.params.id, req.body.available);
  if (!item) throw ApiError.notFound("Menu item not found");
  res.json(item);
};
