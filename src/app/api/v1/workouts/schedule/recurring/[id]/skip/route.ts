import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const ruleId = id?.trim();
    if (!ruleId) return json({ error: "Missing id" }, { status: 400 });
    let body: { dayKey?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    const dayKey = body.dayKey?.trim();
    if (!dayKey) return json({ error: "dayKey required" }, { status: 400 });
    try {
      await workouts.skipRecurringOccurrence(userId, ruleId, dayKey);
      return json({ ok: true, ruleId, dayKey });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not skip";
      return json({ error: msg }, { status: 400 });
    }
  
}
