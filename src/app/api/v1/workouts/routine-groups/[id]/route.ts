import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const routineGroupId = id?.trim();
    if (!routineGroupId) return json({ error: "id required" }, { status: 400 });

    let body: { name?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    const name = body.name?.trim();
    if (!name) return json({ error: "name required" }, { status: 400 });

    try {
      const row = await workouts.renameRoutineGroup(userId, routineGroupId, name);
      return json({
        routineGroup: {
          id: row.id,
          name: row.name,
          sortOrder: row.sortOrder,
        },
      });
    } catch {
      return json({ error: "Could not rename routine" }, { status: 400 });
    }
  
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const routineGroupId = id?.trim();
    if (!routineGroupId) return json({ error: "id required" }, { status: 400 });

    try {
      await workouts.deleteRoutineGroup(userId, routineGroupId);
      return json({ ok: true as const });
    } catch {
      return json({ error: "Could not delete routine" }, { status: 400 });
    }
  
}
