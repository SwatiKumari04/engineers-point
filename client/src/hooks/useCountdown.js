import { useLayoutEffect, useState } from "react";

/** Returns the time left until `endsAt` (epoch ms) as an "m:ss" string, ticking every second. */
export function useCountdown(endsAt) {
  const [msLeft, setMsLeft] = useState(0);

  useLayoutEffect(() => {
    const update = () => setMsLeft(Math.max(0, endsAt - Date.now()));
    update(); // sync before paint, so the first frame shows the real value
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const minutes = Math.floor(msLeft / 60_000);
  const seconds = Math.floor((msLeft % 60_000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
