import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const s = await workouts.getActiveSession(userId);
  if (!s) return json({ session: null });
  return json({
    session: {
      id: s.id,
      templateId: s.templateId,
      templateName: s.template?.name ?? null,
      status: s.status,
      startedAt: s.startedAt,
    },
  });
  
}
