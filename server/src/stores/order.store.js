import { randomUUID } from "node:crypto";

const orders = [];
let orderSeq = 100; // human-friendly pickup number: EP-101, EP-102, ...

export const orderStore = {
  create(data) {
    const order = {
      id: randomUUID(),
      orderNo: `EP-${++orderSeq}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    orders.unshift(order); // newest first
    return order;
  },

  findById: (id) => orders.find((order) => order.id === id),
  listAll: () => [...orders],
  listByPhone: (phone) => orders.filter((order) => order.customer.phone === phone),
};
