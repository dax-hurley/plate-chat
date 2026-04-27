import { createFileRoute } from "@tanstack/react-router";

/**
 * Lightweight same-origin check for client connectivity (PWA / unreliable `navigator.onLine`).
 * No auth; must stay NetworkOnly in the service worker.
 *
 * Use 200 + JSON (not 204 empty): some API-gateway / Lambda paths mishandle 204 or empty
 * bodies, which breaks `fetch` probes in production while dev looks fine.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          { ok: true },
          {
            status: 200,
            headers: { "Cache-Control": "no-store" },
          }
        ),
    },
  },
});
