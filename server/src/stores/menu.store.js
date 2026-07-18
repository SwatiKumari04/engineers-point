import { MENU_SEED } from "../data/menu.seed.js";

// In-memory store. It exposes the same interface a database-backed store
// would, so swapping in MongoDB later only changes this file.
const items = MENU_SEED.map((item) => ({ ...item, available: true }));

export const menuStore = {
  list: () => items.map((item) => ({ ...item })),
  findById: (id) => items.find((item) => item.id === id),
  setAvailability(id, available) {
    const item = items.find((i) => i.id === id);
    if (item) item.available = available;
    return item;
  },
};
