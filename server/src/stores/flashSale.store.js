import { randomUUID } from "node:crypto";

const sales = new Map();

export const flashSaleStore = {
  create(data) {
    const sale = {
      id: randomUUID(),
      claimedBy: new Map(), // phone → PENDING (at the QR screen) or CONFIRMED (paid)
      createdAt: new Date().toISOString(),
      ...data,
    };
    sales.set(sale.id, sale);
    return sale;
  },

  findById: (id) => sales.get(id),
  listAll: () => [...sales.values()],
};
