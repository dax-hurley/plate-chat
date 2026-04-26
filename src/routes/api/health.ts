import { createFileRoute } from "@tanstack/react-router";

/**
 * Lightweight same-origin check for client connectivity (PWA / unreliable `navigator.onLine`).
 * No auth; must stay NetworkOnly in the service worker.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => new Response(null, { status: 204 }),
    },
  },
});
