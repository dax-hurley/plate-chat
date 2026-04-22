import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const { sessionId } = await ctx.params;
  try {
    await workouts.completeWorkout(userId, sessionId);
    return json({ ok: true });
  } catch {
    return json({ error: "Could not complete" }, { status: 400 });
  }
}
