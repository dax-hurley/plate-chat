import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { rotateRefreshToken } from "@/server/auth/device-tokens";

const bodySchema = z.object({
  refreshToken: z.string().min(16),
});

/**
 * Rotate a refresh token. The caller never sees the previous refresh token
 * again; a leak is therefore single-use before rotation races a legitimate
 * refresh.
 */
export const Route = createFileRoute("/api/auth/refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
          return new Response("Bad request", { status: 400 });
        }
        const bundle = await rotateRefreshToken(parsed.data.refreshToken);
        if (!bundle) {
          return new Response("Unauthorized", { status: 401 });
        }
        return Response.json(bundle);
      },
    },
  },
});
