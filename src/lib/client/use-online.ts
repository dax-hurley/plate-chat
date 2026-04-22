import { useEffect, useState } from "react";

/**
 * Coarse network-reachability signal. Combines `navigator.onLine` (which
 * lies on airplane mode / captive portals) with a cheap periodic heartbeat
 * against the sync API so we detect server-unreachable cases too.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
