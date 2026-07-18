import { ApiError } from "../utils/api-error.js";
import { Mutex } from "../utils/mutex.js";
import { flashSaleStore } from "../stores/flashSale.store.js";
import { menuStore } from "../stores/menu.store.js";
import { orderStore } from "../stores/order.store.js";
import { ORDER_SOURCE, ORDER_STATUS } from "./order.service.js";

export const SALE_STATUS = { ACTIVE: "ACTIVE", SOLD_OUT: "SOLD_OUT", ENDED: "ENDED" };
export const CLAIM_STATE = { PENDING: "PENDING", CONFIRMED: "CONFIRMED" };

// One lock per sale: claims for the same sale queue up, but claims for
// different sales never block each other.
const locks = new Map();
const lockFor = (saleId) => {
  if (!locks.has(saleId)) locks.set(saleId, new Mutex());
  return locks.get(saleId);
};

const isExpired = (sale) => Date.now() >= sale.endsAt;
const isLive = (sale) => sale.status === SALE_STATUS.ACTIVE && !isExpired(sale);

// Strip internal fields before a sale leaves the server.
const toPublic = ({ claimedBy, ...sale }) => ({ ...sale, claimedCount: claimedBy.size });

export const flashSaleService = {
  launch({ itemId, salePrice, stock, durationMinutes }) {
    const item = menuStore.findById(itemId);
    if (!item) throw ApiError.notFound("Menu item not found");
    if (!item.available) throw ApiError.conflict("This item is out of stock");
    if (salePrice >= item.price) {
      throw ApiError.badRequest("Sale price must be lower than the regular price");
    }
    if (flashSaleStore.listAll().some((sale) => sale.itemId === itemId && isLive(sale))) {
      throw ApiError.conflict("This item already has a live flash sale");
    }

    return toPublic(flashSaleStore.create({
      itemId,
      itemName: item.name,
      image: item.image,
      originalPrice: item.price,
      salePrice,
      initialStock: stock,
      stock,
      status: SALE_STATUS.ACTIVE,
      endsAt: Date.now() + durationMinutes * 60_000,
    }));
  },

  // Live sales plus just-sold-out ones (until expiry), so the UI can still
  // show a "sold out" card instead of the sale vanishing.
  listCurrent: () =>
    flashSaleStore.listAll()
      .filter((sale) => sale.status !== SALE_STATUS.ENDED && !isExpired(sale))
      .map(toPublic),

  end(id) {
    const sale = flashSaleStore.findById(id);
    if (!sale) throw ApiError.notFound("Flash sale not found");
    sale.status = SALE_STATUS.ENDED;
    return toPublic(sale);
  },

  // Reserve one unit; no order exists yet. Every claim for a sale runs
  // through that sale's mutex, so claims are processed one at a time in
  // arrival order. The stock check and the decrement can never interleave,
  // which is what prevents overselling when many students click at once.
  claim(saleId, customer) {
    return lockFor(saleId).runExclusive(async () => {
      const sale = flashSaleStore.findById(saleId);
      if (!sale) throw ApiError.notFound("Flash sale not found");
      if (sale.status === SALE_STATUS.ENDED || isExpired(sale)) {
        throw ApiError.gone("This flash sale has ended", "SALE_ENDED");
      }
      if (sale.claimedBy.has(customer.phone)) {
        throw ApiError.conflict("You have already claimed this deal", "ALREADY_CLAIMED");
      }
      if (sale.stock === 0) {
        throw ApiError.conflict("Out of stock", "SOLD_OUT");
      }

      sale.stock -= 1;
      sale.claimedBy.set(customer.phone, CLAIM_STATE.PENDING);
      if (sale.stock === 0) sale.status = SALE_STATUS.SOLD_OUT;

      return { stockLeft: sale.stock };
    });
  },

  // PAID at the QR screen: the reservation becomes a kitchen order. Allowed
  // even after the sale ends, because the unit was reserved in time.
  confirm(saleId, customer) {
    return lockFor(saleId).runExclusive(async () => {
      const sale = flashSaleStore.findById(saleId);
      if (!sale) throw ApiError.notFound("Flash sale not found");
      if (sale.claimedBy.get(customer.phone) !== CLAIM_STATE.PENDING) {
        throw ApiError.conflict("No pending claim to confirm", "NO_PENDING_CLAIM");
      }

      sale.claimedBy.set(customer.phone, CLAIM_STATE.CONFIRMED);
      const order = orderStore.create({
        customer,
        items: [{ itemId: sale.itemId, name: sale.itemName, qty: 1, unitPrice: sale.salePrice }],
        total: sale.salePrice,
        paymentMethod: "UPI",
        status: ORDER_STATUS.PREPARING,
        source: ORDER_SOURCE.FLASH_SALE,
        flashSaleId: sale.id,
      });

      return { order };
    });
  },

  // CANCEL at the QR screen: the reserved unit goes back on sale and the
  // student may grab again later while stock lasts.
  release(saleId, customer) {
    return lockFor(saleId).runExclusive(async () => {
      const sale = flashSaleStore.findById(saleId);
      if (!sale) throw ApiError.notFound("Flash sale not found");
      if (sale.claimedBy.get(customer.phone) !== CLAIM_STATE.PENDING) {
        throw ApiError.conflict("No pending claim to release", "NO_PENDING_CLAIM");
      }

      sale.claimedBy.delete(customer.phone);
      sale.stock += 1;
      if (sale.status === SALE_STATUS.SOLD_OUT) sale.status = SALE_STATUS.ACTIVE;

      return { stockLeft: sale.stock };
    });
  },
};
