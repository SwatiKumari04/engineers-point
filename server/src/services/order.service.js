import { ApiError } from "../utils/api-error.js";
import { menuStore } from "../stores/menu.store.js";
import { orderStore } from "../stores/order.store.js";

export const ORDER_STATUS = { PREPARING: "PREPARING", READY: "READY" };
export const ORDER_SOURCE = { REGULAR: "REGULAR", FLASH_SALE: "FLASH_SALE" };

export const orderService = {
  // Prices are looked up from the menu on the server. Any total sent by the
  // client is ignored, so a tampered request cannot change what is charged.
  // Out-of-stock items are dropped from the order; if nothing is left the
  // whole order is rejected.
  place({ customer, items, paymentMethod }) {
    const lines = [];
    const droppedItems = [];

    for (const { itemId, qty } of items) {
      const item = menuStore.findById(itemId);
      if (!item) throw ApiError.badRequest(`Unknown menu item: ${itemId}`);
      if (!item.available) {
        droppedItems.push(item.name);
        continue;
      }
      lines.push({ itemId, name: item.name, qty, unitPrice: item.price });
    }

    if (lines.length === 0) {
      throw ApiError.conflict("Out of stock", "OUT_OF_STOCK");
    }

    const order = orderStore.create({
      customer,
      items: lines,
      total: lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0),
      paymentMethod,
      status: ORDER_STATUS.PREPARING,
      source: ORDER_SOURCE.REGULAR,
    });

    return { order, droppedItems };
  },

  listForPhone: (phone) => orderStore.listByPhone(phone),
  listAll: () => orderStore.listAll(),

  markReady(id) {
    const order = orderStore.findById(id);
    if (!order) throw ApiError.notFound("Order not found");
    if (order.status !== ORDER_STATUS.PREPARING) {
      throw ApiError.conflict("Only preparing orders can be marked ready");
    }
    order.status = ORDER_STATUS.READY;
    return order;
  },
};
