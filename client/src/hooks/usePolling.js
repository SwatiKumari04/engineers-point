import { useEffect } from "react";

// Runs fn immediately and then every intervalMs. fn must be wrapped in
// useCallback by the caller, otherwise the effect restarts on every render.
export function usePolling(fn, intervalMs) {
  useEffect(() => {
    const tick = () => fn().catch(() => {}); // a failed poll should not kill the loop
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [fn, intervalMs]);
}
