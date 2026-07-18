import { useCallback, useMemo, useState } from "react";
import { claimSale, confirmSale, fetchCurrentSales, releaseSale } from "../api/flashSales.api.js";
import { usePolling } from "./usePolling.js";

export function useFlashSales(pollMs = 2000) {
  const [sales, setSales] = useState([]);

  const refresh = useCallback(async () => setSales(await fetchCurrentSales()), []);
  usePolling(refresh, pollMs);

  // Each action refreshes stock whether it succeeded or failed.
  const withRefresh = useCallback(
    (apiCall) =>
      async (saleId, customer) => {
        try {
          return await apiCall(saleId, customer);
        } finally {
          await refresh();
        }
      },
    [refresh],
  );

  const claim = useMemo(() => withRefresh(claimSale), [withRefresh]);
  const confirm = useMemo(() => withRefresh(confirmSale), [withRefresh]);
  const release = useMemo(() => withRefresh(releaseSale), [withRefresh]);

  return { sales, claim, confirm, release, refresh };
}
