import { ApiError } from "../utils/api-error.js";
import { flashSaleStore } from "../stores/flashSale.store.js";
import { menuStore } from "../stores/menu.store.js";
import { orderStore } from "../stores/order.store.js";
import { ORDER_SOURCE, ORDER_STATUS } from "./order.service.js";

export const SALE_STATUS = { ACTIVE: "ACTIVE", SOLD_OUT: "SOLD_OUT", ENDED: "ENDED" };
export const CLAIM_STATE = { PENDING: "PENDING", CONFIRMED: "CONFIRMED" };

// A reserved-but-unpaid claim is auto-released after this long.
const CLAIM_TTL_MS = 3 * 60_000;

const isExpired = (sale) => Date.now() >= sale.endsAt;
const isLive = (sale) => sale.status === SALE_STATUS.ACTIVE && !isExpired(sale);

// claimedBy is { phone: { state, at } }. A sold-out sale (stock 0, still active)
// is presented as SOLD_OUT — derived, not stored.
const toPublic = ({ claimedBy, ...sale }) => ({
  ...sale,
  status: sale.status === SALE_STATUS.ACTIVE && sale.stock === 0 ? SALE_STATUS.SOLD_OUT : sale.status,
  claimedCount: Object.keys(claimedBy ?? {}).length,
});

// Lazily return units from PENDING claims older than the TTL — no background
// timer; we sweep right when someone new tries to claim, which is when it matters.
async function releaseStaleClaims(saleId) {
  const sale = await flashSaleStore.findById(saleId);
  if (!sale) return;
  const cutoff = Date.now() - CLAIM_TTL_MS;
  for (const [phone, claim] of Object.entries(sale.claimedBy ?? {})) {
    if (claim.state === CLAIM_STATE.PENDING && claim.at < cutoff) {
      await flashSaleStore.tryRelease(saleId, phone); // atomic: only releases if still PENDING
    }
  }
}

export const flashSaleService = {
  async launch({ itemId, salePrice, stock, durationMinutes }) {
    const item = await menuStore.findById(itemId);
    if (!item) throw ApiError.notFound("Menu item not found");
    if (!item.available) throw ApiError.conflict("This item is out of stock");
    if (salePrice >= item.price) {
      throw ApiError.badRequest("Sale price must be lower than the regular price");
    }
    const existing = await flashSaleStore.listAll();
    if (existing.some((sale) => sale.itemId === itemId && isLive(sale))) {
      throw ApiError.conflict("This item already has a live flash sale");
    }

    return toPublic(await flashSaleStore.create({
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

  listCurrent: async () =>
    (await flashSaleStore.listAll())
      .filter((sale) => sale.status !== SALE_STATUS.ENDED && !isExpired(sale))
      .map(toPublic),

  async end(id) {
    const sale = await flashSaleStore.setEnded(id);
    if (!sale) throw ApiError.notFound("Flash sale not found");
    return toPublic(sale);
  },

  async claim(saleId, customer) {
    await releaseStaleClaims(saleId); // free abandoned reservations first
    const updated = await flashSaleStore.tryClaim(saleId, customer.phone, Date.now());
    if (updated) return { stockLeft: updated.stock };

    // The atomic update matched nothing — inspect the sale to return a precise error.
    const sale = await flashSaleStore.findById(saleId);
    if (!sale) throw ApiError.notFound("Flash sale not found");
    if (sale.status === SALE_STATUS.ENDED || isExpired(sale)) {
      throw ApiError.gone("This flash sale has ended", "SALE_ENDED");
    }
    if (sale.claimedBy[customer.phone]) {
      throw ApiError.conflict("You have already claimed this deal", "ALREADY_CLAIMED");
    }
    throw ApiError.conflict("Out of stock", "SOLD_OUT");
  },

  async confirm(saleId, customer) {
    const sale = await flashSaleStore.tryConfirm(saleId, customer.phone);
    if (!sale) {
      if (!(await flashSaleStore.findById(saleId))) throw ApiError.notFound("Flash sale not found");
      throw ApiError.conflict("No pending claim to confirm", "NO_PENDING_CLAIM");
    }

    const order = await orderStore.create({
      customer,
      items: [{ itemId: sale.itemId, name: sale.itemName, qty: 1, unitPrice: sale.salePrice }],
      total: sale.salePrice,
      paymentMethod: "UPI",
      status: ORDER_STATUS.PREPARING,
      source: ORDER_SOURCE.FLASH_SALE,
      flashSaleId: sale.id,
    });

    return { order };
  },

  async release(saleId, customer) {
    const sale = await flashSaleStore.tryRelease(saleId, customer.phone);
    if (!sale) {
      if (!(await flashSaleStore.findById(saleId))) throw ApiError.notFound("Flash sale not found");
      throw ApiError.conflict("No pending claim to release", "NO_PENDING_CLAIM");
    }
    return { stockLeft: sale.stock };
  },
};