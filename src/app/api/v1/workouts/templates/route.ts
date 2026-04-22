import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const list = await workouts.listTemplates(userId);
  return json({
    templates: list.map((t) => ({
      id: t.id,
      name: t.name,
      notes: t.notes,
      routineGroupId: t.routineGroupId ?? null,
      routineOrder: t.routineOrder ?? null,
      exercises: t.items.map((i) => ({
        exerciseId: i.exercise.id,
        name: i.exercise.name,
        order: i.order,
        targetSets: i.targetSets,
        targetReps: i.targetReps,
        targetDurationSec: i.targetDurationSec,
        targetDistance: i.targetDistance,
        logKind: i.exercise.logKind ?? "reps",
        defaultDistance: i.exercise.defaultDistance,
        distanceUnit: i.exercise.distanceUnit ?? "km",
        defaultWeight: i.defaultWeight,
        weightUnit: i.weightUnit,
        exerciseWeightUnit: i.exercise.weightUnit ?? "lb",
        progressiveOverloadEnabled: i.progressiveOverloadEnabled,
        progressiveOverloadIncrement: i.progressiveOverloadIncrement,
        progressiveOverloadRequireFullCompletion:
          i.progressiveOverloadRequireFullCompletion,
      })),
    })),
  });
  
}

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: { name?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return json({ error: "name required" }, { status: 400 });
  const notes = body.notes?.trim() || undefined;
  try {
    const row = await workouts.createTemplate(userId, { name, notes });
    return json({
      template: { id: row.id, name: row.name, notes: row.notes },
    });
  } catch {
    return json({ error: "Could not create template" }, { status: 400 });
  }
  
}
