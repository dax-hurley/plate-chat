import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/server/auth/config";

/**
 * better-auth catch-all. Handles `/api/auth/signin`, `/api/auth/signup`,
 * `/api/auth/signout`, `/api/auth/session`, etc.
 */
async function handler({ request }: { request: Request }) {
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
