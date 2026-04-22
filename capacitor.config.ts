import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor always bundles the TanStack Start SPA build into the APK so the
 * app works from cold start in airplane mode. `server.url` is intentionally
 * not supported here — a live dev server defeats the whole offline-first
 * model. For dev on a device, run `pnpm dev:tanstack` on the host and point
 * `VITE_API_URL` at it so the APK still bundles the offline shell but makes
 * network calls (sync, auth, coach) against the dev backend.
 */
const config: CapacitorConfig = {
  appId: "com.trainlog.app",
  appName: "Trainlog",
  webDir: "dist/client",
  android: {
    allowMixedContent: false,
  },
};

export default config;
