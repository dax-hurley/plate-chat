import { createFileRoute } from "@tanstack/react-router";
import { authenticateBearer } from "@/server/auth/device-tokens";
import {
  handleSyncStatus,
  type PullCheckpoint,
} from "@/server/sync/engine";

export const Route = createFileRoute("/api/sync/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const claims = await authenticateBearer(request);
        if (!claims) return new Response("Unauthorized", { status: 401 });
        try {
          const body = (await request.json()) as {
            checkpoints?: Record<string, PullCheckpoint | null>;
          };
          const checkpoints = body?.checkpoints ?? {};
          const result = await handleSyncStatus(claims.userId, checkpoints);
          return Response.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          return new Response("Bad request", { status: 400 });
        }
      },
    },
  },
});
