import { useCallback, useState } from "react";
import { fetchAllOrders, markOrderReady } from "../api/orders.api.js";
import { usePolling } from "./usePolling.js";

export function useAllOrders(pollMs = 2000) {
  const [orders, setOrders] = useState([]);

  const refresh = useCallback(async () => setOrders(await fetchAllOrders()), []);
  usePolling(refresh, pollMs);

  const markReady = useCallback(
    async (orderId) => {
      await markOrderReady(orderId);
      await refresh();
    },
    [refresh],
  );

  return { orders, markReady };
}