import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "@/server/auth/config";
import { issueDeviceTokens } from "@/server/auth/device-tokens";

const bodySchema = z.object({
  deviceName: z.string().max(200).default(""),
});

/**
 * Mint a device token bundle for the authenticated user. Client calls this
 * exactly once on first login (online); thereafter it only uses the refresh
 * endpoint to stay signed-in.
 */
export const Route = createFileRoute("/api/auth/device-tokens")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return new Response("Unauthorized", { status: 401 });
        }
        const parsed = bodySchema.safeParse(
          await request.json().catch(() => ({}))
        );
        const deviceName = parsed.success ? parsed.data.deviceName : "";
        const bundle = await issueDeviceTokens(session.user.id, deviceName);
        return Response.json(bundle);
      },
    },
  },
});
