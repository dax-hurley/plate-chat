import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { parseExerciseLogKind } from "@/lib/log-kind";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const list = await workouts.listUserExercises(userId);
  return json({
    exercises: list.map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscleGroup,
      isPreset: e.userId == null,
      logKind: e.logKind ?? "reps",
      defaultDurationSec: e.defaultDurationSec,
      defaultDistance: e.defaultDistance,
      distanceUnit: e.distanceUnit ?? "km",
      weightUnit: e.weightUnit ?? "lb",
      trackWeight: e.trackWeight,
    })),
  });
}

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: {
    name?: string;
    muscleGroup?: string;
    logKind?: string;
    defaultDurationSec?: number;
    defaultDistance?: number;
    distanceUnit?: string;
    weightUnit?: string;
    trackWeight?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return json({ error: "name required" }, { status: 400 });
  const muscleGroup = body.muscleGroup?.trim() || undefined;
  const logKind = parseExerciseLogKind(body.logKind);
  const defaultDurationSec =
    typeof body.defaultDurationSec === "number" &&
    Number.isFinite(body.defaultDurationSec)
      ? body.defaultDurationSec
      : undefined;
  const defaultDistance =
    typeof body.defaultDistance === "number" &&
    Number.isFinite(body.defaultDistance)
      ? body.defaultDistance
      : undefined;
  const distanceUnit =
    body.distanceUnit === "mi" || body.distanceUnit === "m"
      ? body.distanceUnit
      : "km";
  try {
    const row = await workouts.createExercise(userId, {
      name,
      muscleGroup,
      logKind,
      defaultDurationSec:
        logKind === "time" ? (defaultDurationSec ?? 60) : null,
      defaultDistance: logKind === "distance" ? defaultDistance : null,
      distanceUnit: logKind === "distance" ? distanceUnit : undefined,
      weightUnit:
        body.weightUnit === "kg" || body.weightUnit === "lb"
          ? body.weightUnit
          : "lb",
      trackWeight:
        typeof body.trackWeight === "boolean"
          ? body.trackWeight
          : undefined,
    });
    return json({
      exercise: {
        id: row.id,
        name: row.name,
        muscleGroup: row.muscleGroup,
        logKind: row.logKind,
        defaultDurationSec: row.defaultDurationSec,
        defaultDistance: row.defaultDistance,
        distanceUnit: row.distanceUnit ?? "km",
        weightUnit: row.weightUnit ?? "lb",
        trackWeight: row.trackWeight,
      },
    });
  } catch {
    return json({ error: "Could not create exercise" }, { status: 400 });
  }
  
}
