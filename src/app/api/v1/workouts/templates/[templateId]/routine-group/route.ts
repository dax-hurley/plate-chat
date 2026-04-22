import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ templateId: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { templateId } = await ctx.params;
    const tid = templateId?.trim();
    if (!tid) return json({ error: "templateId required" }, { status: 400 });

    let body: { routineGroupId?: string | null };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!("routineGroupId" in body)) {
      return json({ error: "routineGroupId required (string or null)" }, { status: 400 });
    }

    const routineGroupId =
      body.routineGroupId === null || body.routineGroupId === undefined
        ? null
        : String(body.routineGroupId).trim() || null;

    try {
      await workouts.setTemplateRoutineGroup(userId, tid, routineGroupId);
      const t = await workouts.getTemplate(userId, tid);
      return json({
        template: t
          ? {
              id: t.id,
              name: t.name,
              routineGroupId: t.routineGroupId ?? null,
              routineOrder: t.routineOrder ?? null,
            }
          : null,
      });
    } catch {
      return json({ error: "Could not update routine assignment" }, { status: 400 });
    }
  
}
