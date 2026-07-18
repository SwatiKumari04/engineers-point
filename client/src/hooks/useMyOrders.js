import { useCallback, useState } from "react";
import { fetchMyOrders } from "../api/orders.api.js";
import { usePolling } from "./usePolling.js";

export function useMyOrders(phone, pollMs = 3000) {
  const [orders, setOrders] = useState([]);

  const refresh = useCallback(async () => setOrders(await fetchMyOrders(phone)), [phone]);
  usePolling(refresh, pollMs);

  return orders;
}
