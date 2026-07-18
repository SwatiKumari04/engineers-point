import { useCallback, useMemo, useState } from "react";
import { fetchMenu } from "../api/menu.api.js";
import { usePolling } from "./usePolling.js";

// Polls the menu so availability changes made by the owner show up
// for students without a page reload.
export function useMenu(pollMs = 5000) {
  const [menu, setMenu] = useState([]);

  const refresh = useCallback(async () => setMenu(await fetchMenu()), []);
  usePolling(refresh, pollMs);

  // Categories are derived from the menu itself, so adding a new dish
  // on the server needs no client change.
  const categories = useMemo(
    () => ["All", ...new Set(menu.map((item) => item.category))],
    [menu],
  );

  return { menu, categories, refresh };
}
