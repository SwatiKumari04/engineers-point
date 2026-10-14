import { ApiError } from "../utils/api-error.js";
import { menuStore } from "../stores/menu.store.js";

export const getMenu = async (_req, res) => {
  res.json(await menuStore.list());
};

export const setAvailability = async (req, res) => {
  const item = await menuStore.setAvailability(req.params.id, req.body.available);
  if (!item) throw ApiError.notFound("Menu item not found");
  res.json(item);
};