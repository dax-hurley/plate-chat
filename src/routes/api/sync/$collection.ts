import { createFileRoute } from "@tanstack/react-router";
import { authenticateBearer } from "@/server/auth/device-tokens";
import { handleSyncRequest } from "@/server/sync/engine";

async function handle({
  request,
  params,
}: {
  request: Request;
  params: { collection: string };
}): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) return new Response("Unauthorized", { status: 401 });
  return handleSyncRequest(request, params.collection, claims.userId);
}

export const Route = createFileRoute("/api/sync/$collection")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
