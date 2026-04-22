import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

function serializeLibrary(lib: Awaited<
  ReturnType<typeof workouts.listWorkoutRoutinesLibrary>
>) {
  return {
    groups: lib.groups.map((g) => ({
      id: g.id,
      name: g.name,
      sortOrder: g.sortOrder,
      createdAt: g.createdAt.toISOString(),
      templates: g.templates.map((t) => ({
        id: t.id,
        name: t.name,
        routineOrder: t.routineOrder ?? null,
      })),
    })),
    ungrouped: lib.ungrouped.map((t) => ({
      id: t.id,
      name: t.name,
    })),
  };
}

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const lib = await workouts.listWorkoutRoutinesLibrary(userId);
  return json(serializeLibrary(lib));
  
}

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return json({ error: "name required" }, { status: 400 });
  try {
    const row = await workouts.createRoutineGroup(userId, { name });
    return json({
      routineGroup: {
        id: row.id,
        name: row.name,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch {
    return json({ error: "Could not create routine" }, { status: 400 });
  }
  
}
