import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { nitro } from "nitro/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Same as `capacitor.config.ts` webDir — absolute so Workbox never falls back to multi-env `build.outDir` (`dist`). */
const capacitorWebPublicDir = path.resolve(__dirname, ".output/public");

/** Capacitor needs a prerendered `index.html`; TanStack's prerender uses Vite preview, which only works with a Node-handled Nitro preset (not `aws-lambda`). Android CI sets this for `npm run build` only; SST deploy keeps the default Lambda preset. */
const capacitorWeb =
  process.env.CAPACITOR_WEB_BUILD === "1" || process.env.CAPACITOR_WEB_BUILD === "true";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  /** Browser can't read `COACH_AI_DEBUG`; pass through for `isCoachAiDebugUiEnabled` (see `coach-ai-debug.ts`). */
  const coachAiDebugClient =
    env.VITE_COACH_AI_DEBUG ?? env.COACH_AI_DEBUG ?? "";

  return {
  define: {
    "process.env.PLATECHAT_CAPACITOR_WEB_BUILD": JSON.stringify(
      capacitorWeb ? "1" : "",
    ),
    __COACH_AI_DEBUG_CLIENT__: JSON.stringify(coachAiDebugClient),
  },
  server: {
    port: 3001,
    host: "0.0.0.0",
  },
  nitro: {
    preset: capacitorWeb ? "node-server" : "aws-lambda",
    ...(capacitorWeb ? {} : { awsLambda: { streaming: true } }),
  },
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    nitro(),
    tanstackStart({
      srcDirectory: "src",
      router: {
        routesDirectory: "routes",
        generatedRouteTree: "routeTree.gen.ts",
      },
    }),
    react(),
    VitePWA({
      // TanStack+Nitro emit the browser bundle here; default `dist` breaks workbox glob + leaves sw.js outside `capacitor.webDir`.
      outDir: capacitorWebPublicDir,
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon.svg"],
      devOptions: { enabled: true },
      manifest: {
        name: "Workout",
        short_name: "Workout",
        description:
          "Offline-first workout, nutrition and coaching app.",
        theme_color: "#0b0b0c",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/app",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globDirectory: capacitorWebPublicDir,
        // Local Dexie DB is the source of truth — do not cache /api/sync.
        // Only precache the hashed app shell; everything network-bound must
        // either succeed or surface as an offline state in the UI.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/health$/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/api\/sync\//,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/api\/auth\//,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/api\/coach\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  };
});
