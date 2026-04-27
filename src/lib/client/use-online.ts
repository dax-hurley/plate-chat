import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

import { isDevForceOffline } from "@/lib/client/dev-force-offline";

const PROBE_MS = 25_000;
/** Lambda cold starts can exceed a few seconds; short timeouts falsely mark the app offline. */
const PROBE_TIMEOUT_MS = 15_000;

function healthProbeUrl(): string {
  if (Capacitor.isNativePlatform()) {
    const base = import.meta.env.VITE_API_URL;
    if (typeof base === "string" && base.trim() !== "") {
      return `${base.replace(/\/$/, "")}/api/health`;
    }
  }
  return "/api/health";
}

/**
 * Real connectivity: combines `navigator.onLine` (best-effort) with a
 * `GET /api/health` probe (same-origin on web; on Capacitor native, uses
 * `VITE_API_URL` so the request hits the deployed API). `navigator.onLine` and
 * `online` / `offline` are unreliable in PWAs (e.g. standalone) and on some
 * mobile browsers, so we verify with a network request that the service worker
 * does not cache (see `vite.config` Workbox: `/api/health` is NetworkOnly).
 */
export function useOnline(): boolean {
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

    async function probe(): Promise<void> {
      if (cancelled) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOnline(false);
        return;
      }
      const myToken = ++probeToken;
      const ac = new AbortController();
      const timeoutId = window.setTimeout(() => ac.abort(), PROBE_TIMEOUT_MS);
      try {
        const res = await fetch(`${healthProbeUrl()}?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: ac.signal,
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

    const conn = (
      navigator as Navigator & { connection?: EventTarget }
    ).connection;
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
