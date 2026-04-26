import { useState, useEffect } from "react";
import { i as isDevForceOffline } from "./router-CUOzYYmk.mjs";
const HEALTH = "/api/health";
const PROBE_MS = 25e3;
const PROBE_TIMEOUT_MS = 5e3;
function useOnline() {
  const [online, setOnline] = useState(() => {
    if (isDevForceOffline()) return false;
    return typeof navigator === "undefined" ? true : navigator.onLine;
  });
  useEffect(() => {
    if (isDevForceOffline()) {
      setOnline(false);
      return;
    }
    if (typeof window === "undefined") return;
    let cancelled = false;
    let probeToken = 0;
    async function probe() {
      if (cancelled) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOnline(false);
        return;
      }
      const myToken = ++probeToken;
      const ac = new AbortController();
      const timeoutId = window.setTimeout(() => ac.abort(), PROBE_TIMEOUT_MS);
      try {
        const res = await fetch(`${HEALTH}?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: ac.signal
        });
        if (cancelled || myToken !== probeToken) return;
        setOnline(res.ok);
      } catch {
        if (cancelled || myToken !== probeToken) return;
        setOnline(false);
      } finally {
        clearTimeout(timeoutId);
      }
    }
    const onWindowOnline = () => {
      void probe();
    };
    const onWindowOffline = () => {
      probeToken += 1;
      setOnline(false);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void probe();
    };
    const onConnectionChange = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        onWindowOffline();
        return;
      }
      void probe();
    };
    window.addEventListener("online", onWindowOnline);
    window.addEventListener("offline", onWindowOffline);
    document.addEventListener("visibilitychange", onVisible);
    const conn = navigator.connection;
    conn?.addEventListener?.("change", onConnectionChange);
    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") void probe();
    }, PROBE_MS);
    void probe();
    return () => {
      cancelled = true;
      probeToken += 1;
      window.removeEventListener("online", onWindowOnline);
      window.removeEventListener("offline", onWindowOffline);
      document.removeEventListener("visibilitychange", onVisible);
      conn?.removeEventListener?.("change", onConnectionChange);
      clearInterval(tick);
    };
  }, []);
  return isDevForceOffline() ? false : online;
}
export {
  useOnline as u
};
