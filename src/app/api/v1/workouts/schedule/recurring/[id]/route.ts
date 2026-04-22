import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const ruleId = id?.trim();
    if (!ruleId) return json({ error: "Missing id" }, { status: 400 });
    try {
      await workouts.deleteRecurringWorkoutRule(userId, ruleId);
      return json({ ok: true, id: ruleId });
    } catch {
      return json({ error: "Not found" }, { status: 404 });
    }
  
}
