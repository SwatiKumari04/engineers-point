import { useMemo, useState } from "react";

const MAX_QTY_PER_ITEM = 15;

export function useCart(menu) {
  const [cart, setCart] = useState({}); // { itemId: qty }

  const getQty = (itemId) => cart[itemId] ?? 0;

  const updateQty = (itemId, delta) =>
    setCart((prev) => {
      const qty = (prev[itemId] ?? 0) + delta;
      if (qty < 0 || qty > MAX_QTY_PER_ITEM) return prev;
      const next = { ...prev };
      if (qty === 0) delete next[itemId];
      else next[itemId] = qty;
      return next;
    });

  const clear = () => setCart({});

  const { total, count } = useMemo(() => {
    const priceOf = Object.fromEntries(menu.map((item) => [item.id, item.price]));
    return {
      total: Object.entries(cart).reduce((sum, [id, qty]) => sum + (priceOf[id] ?? 0) * qty, 0),
      count: Object.keys(cart).length,
    };
  }, [cart, menu]);

  const toOrderItems = () => Object.entries(cart).map(([itemId, qty]) => ({ itemId, qty }));

  return { getQty, updateQty, clear, total, count, toOrderItems };
}
