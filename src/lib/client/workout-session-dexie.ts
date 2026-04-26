import type { TrainlogDB } from "@/lib/client/db/database";
import { insertLocal, updateLocal, softDeleteLocal } from "@/lib/client/db/writes";
import { newId, nowMs } from "@/lib/stores/ids";
import type { Exercise, TemplateItem, WorkoutSet } from "@/lib/stores/workouts";
import { parseDistanceUnit, roundDistance, minPositiveDistance, sessionDistanceStep } from "@/lib/distance-units";
import { parseExerciseLogKind } from "@/lib/log-kind";
import { resolveTemplateItemWeightUnit, sessionWeightStep } from "@/lib/weight-units";
import {
  baseWeightForSessionAdjust,
  effectiveTargetDistanceForSession,
  effectiveTargetDurationSecForSession,
  effectiveTemplateWeightForSession,
  getNextOpenSetIndex,
  roundWorkingWeight,
  SESSION_DURATION_STEP_SEC,
  suggestedWeightForSet,
} from "@/lib/workout-session-state";

type SessionViewItem = TemplateItem & { exercise: Exercise };

export type WorkoutSessionView = {
  status: string;
  templateId: string | null;
  items: SessionViewItem[];
  sets: WorkoutSet[];
  prefs: Array<{
    id: string;
    sessionId: string;
    exerciseId: string;
    workingWeight: number | null;
    workingDurationSec: number | null;
    workingDistance: number | null;
  }>;
};

function isTimeItem(item: { exercise: { logKind?: string } }): boolean {
  return (item.exercise.logKind ?? "reps") === "time";
}
function isDistanceItem(item: { exercise: { logKind?: string } }): boolean {
  return (item.exercise.logKind ?? "reps") === "distance";
}

function prefFor(
  v: WorkoutSessionView,
  exerciseId: string
): WorkoutSessionView["prefs"][0] | null {
  return v.prefs.find((p) => p.exerciseId === exerciseId) ?? null;
}

function itemFor(v: WorkoutSessionView, exerciseId: string): SessionViewItem {
  const it = v.items.find((i) => i.exerciseId === exerciseId);
  if (!it) throw new Error("Exercise not in session");
  return it;
}

function targetDurationForActive(
  v: WorkoutSessionView,
  exerciseId: string,
  item: SessionViewItem
) {
  return effectiveTargetDurationSecForSession(prefFor(v, exerciseId), {
    targetDurationSec: item.targetDurationSec,
    exercise: { defaultDurationSec: item.exercise.defaultDurationSec },
  });
}

function targetDistanceForActive(
  v: WorkoutSessionView,
  exerciseId: string,
  item: SessionViewItem
) {
  return effectiveTargetDistanceForSession(prefFor(v, exerciseId), {
    targetDistance: item.targetDistance,
    exercise: {
      defaultDistance: item.exercise.defaultDistance,
      distanceUnit: item.exercise.distanceUnit,
    },
  });
}

export async function loadWorkoutSessionView(
  db: TrainlogDB,
  _userId: string,
  sessionId: string
): Promise<WorkoutSessionView | null> {
  const srow = (await db.workoutSessions.get(sessionId)) as Record<
    string,
    unknown
  > | undefined;
  if (!srow || srow.deletedAt) return null;
  const templateId = srow.templateId as string | null;
  if (!templateId) {
    return {
      status: String(srow.status),
      templateId: null,
      items: [],
      sets: [],
      prefs: [],
    };
  }
  const rawItems = (await db.workoutTemplateItems
    .where("templateId")
    .equals(templateId)
    .toArray()) as unknown as TemplateItem[];
  const tItems = rawItems
    .filter((r) => r.deletedAt === null)
    .sort((a, b) => a.order - b.order);
  const items: SessionViewItem[] = [];
  for (const ti of tItems) {
    const ex = (await db.exercises.get(
      ti.exerciseId
    )) as unknown as Exercise | undefined;
    if (!ex) continue;
    items.push({ ...ti, isWarmup: Boolean(ti.isWarmup), exercise: ex });
  }
  const allSets = (await db.workoutSets
    .where("sessionId")
    .equals(sessionId)
    .toArray()) as unknown as WorkoutSet[];
  const sets = allSets.filter((r) => r.deletedAt === null);
  const rawPrefs = (await db.workoutSessionExercisePrefs
    .toArray()
    .then((rows) =>
      (rows as unknown as Record<string, unknown>[]).filter(
        (p) => p.sessionId === sessionId && p.deletedAt == null
      )
    )) as WorkoutSessionView["prefs"];
  return {
    status: String(srow.status),
    templateId,
    items,
    sets,
    prefs: rawPrefs.map((p) => ({
      id: String(p.id),
      sessionId: String(p.sessionId),
      exerciseId: String(p.exerciseId),
      workingWeight: (p.workingWeight as number) ?? null,
      workingDurationSec: (p.workingDurationSec as number) ?? null,
      workingDistance: (p.workingDistance as number) ?? null,
    })),
  };
}

async function findSet(
  db: TrainlogDB,
  sessionId: string,
  exerciseId: string,
  setIndex: number
) {
  const all = (await db.workoutSets
    .where("sessionId")
    .equals(sessionId)
    .toArray()) as unknown as WorkoutSet[];
  return all.find(
    (r) =>
      r.deletedAt == null &&
      r.exerciseId === exerciseId &&
      r.setIndex === setIndex
  );
}

async function hasHigherSet(
  db: TrainlogDB,
  sessionId: string,
  exerciseId: string,
  setIndex: number
) {
  const all = (await db.workoutSets
    .where("sessionId")
    .equals(sessionId)
    .toArray()) as unknown as WorkoutSet[];
  return all.some(
    (r) =>
      r.deletedAt == null &&
      r.exerciseId === exerciseId &&
      r.setIndex > setIndex
  );
}

export async function clientUpsertWorkoutSet(
  db: TrainlogDB,
  userId: string,
  input: {
    sessionId: string;
    exerciseId: string;
    setIndex: number;
    weight: number;
    reps?: number | null;
    durationSec?: number | null;
    distance?: number | null;
    rpe?: number | null;
  }
) {
  const s = await loadWorkoutSessionView(db, userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = itemFor(s, input.exerciseId);
  const timeMode = isTimeItem(item);
  const distanceMode = isDistanceItem(item);
  const durationAsDistance = distanceMode && item.logTimeForDistanceSets;
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const weight = Number(input.weight);
  const existing = await findSet(
    db,
    input.sessionId,
    input.exerciseId,
    input.setIndex
  );

  if (timeMode || durationAsDistance) {
    const d =
      input.durationSec != null && Number.isFinite(input.durationSec)
        ? Math.round(input.durationSec)
        : null;
    if (existing) {
      if (d !== null && d < 1) {
        const higher = await hasHigherSet(
          db,
          input.sessionId,
          input.exerciseId,
          input.setIndex
        );
        if (higher) {
          const resetD = targetDurationForActive(
            s,
            input.exerciseId,
            item
          );
          await updateLocal(db.workoutSets, existing.id, {
            durationSec: resetD,
            reps: null,
            distance: null,
            weight: existing.weight,
            rpe: existing.rpe ?? null,
            completedAt: nowMs(),
          });
          return;
        }
        await softDeleteLocal(db.workoutSets, existing.id);
        return;
      }
      if (d !== null) {
        await updateLocal(db.workoutSets, existing.id, {
          durationSec: d,
          reps: null,
          distance: null,
          weight,
          rpe: input.rpe ?? existing.rpe ?? null,
          completedAt: nowMs(),
        });
        return;
      }
      return;
    }
    if (d === null || d < 1) throw new Error("Invalid duration");
    await insertLocal(db.workoutSets, {
      id: newId(),
      userId,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: input.setIndex,
      reps: null,
      durationSec: d,
      distance: null,
      weight,
      rpe: input.rpe ?? null,
      completedAt: nowMs(),
    } as unknown as Record<string, unknown>);
    return;
  }

  if (distanceMode) {
    const minD = minPositiveDistance(dUnit);
    const dist =
      input.distance != null && Number.isFinite(input.distance)
        ? roundDistance(Number(input.distance), dUnit)
        : null;
    if (existing) {
      if (dist !== null && dist < minD) {
        const higher = await hasHigherSet(
          db,
          input.sessionId,
          input.exerciseId,
          input.setIndex
        );
        if (higher) {
          const resetDist = targetDistanceForActive(
            s,
            input.exerciseId,
            item
          );
          await updateLocal(db.workoutSets, existing.id, {
            distance: resetDist,
            reps: null,
            durationSec: null,
            weight: existing.weight,
            rpe: existing.rpe ?? null,
            completedAt: nowMs(),
          });
          return;
        }
        await softDeleteLocal(db.workoutSets, existing.id);
        return;
      }
      if (dist !== null) {
        await updateLocal(db.workoutSets, existing.id, {
          distance: dist,
          reps: null,
          durationSec: null,
          weight,
          rpe: input.rpe ?? existing.rpe ?? null,
          completedAt: nowMs(),
        });
        return;
      }
      return;
    }
    if (dist === null || dist < minD) throw new Error("Invalid distance");
    await insertLocal(db.workoutSets, {
      id: newId(),
      userId,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: input.setIndex,
      reps: null,
      durationSec: null,
      distance: dist,
      weight,
      rpe: input.rpe ?? null,
      completedAt: nowMs(),
    } as unknown as Record<string, unknown>);
    return;
  }

  const reps =
    input.reps != null && Number.isFinite(input.reps)
      ? Math.round(input.reps)
      : NaN;
  if (existing) {
    if (!Number.isFinite(reps)) throw new Error("Invalid reps");
    if (reps < 1) {
      const higher = await hasHigherSet(
        db,
        input.sessionId,
        input.exerciseId,
        input.setIndex
      );
      if (higher) {
        const resetReps = Math.max(1, item.targetReps ?? 5);
        await updateLocal(db.workoutSets, existing.id, {
          reps: resetReps,
          durationSec: null,
          distance: null,
          weight: existing.weight,
          rpe: existing.rpe ?? null,
          completedAt: nowMs(),
        });
        return;
      }
      await softDeleteLocal(db.workoutSets, existing.id);
      return;
    }
    await updateLocal(db.workoutSets, existing.id, {
      reps,
      durationSec: null,
      distance: null,
      weight,
      rpe: input.rpe ?? existing.rpe ?? null,
      completedAt: nowMs(),
    });
    return;
  }
  if (!Number.isFinite(reps) || reps < 1) throw new Error("Invalid reps");
  await insertLocal(db.workoutSets, {
    id: newId(),
    userId,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    setIndex: input.setIndex,
    reps,
    durationSec: null,
    distance: null,
    weight,
    rpe: input.rpe ?? null,
    completedAt: nowMs(),
  } as unknown as Record<string, unknown>);
}

export async function clientFillSetSlot(
  db: TrainlogDB,
  userId: string,
  sessionId: string,
  exerciseId: string,
  setIndex: number
) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s?.templateId) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((x) => x.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");
  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk === "distance" && item.logTimeForDistanceSets) {
    throw new Error("Log this set using the stopwatch");
  }
  const pref = prefFor(s, exerciseId);
  const weight = item.trackWeight
    ? suggestedWeightForSet(
        effectiveTemplateWeightForSession(pref, item.defaultWeight),
        exSets.map((x) => ({ setIndex: x.setIndex, weight: x.weight })),
        setIndex
      )
    : 0;
  const targetDuration = effectiveTargetDurationSecForSession(pref, {
    targetDurationSec: item.targetDurationSec,
    exercise: { defaultDurationSec: item.exercise.defaultDurationSec },
  });
  const targetDist = effectiveTargetDistanceForSession(pref, {
    targetDistance: item.targetDistance,
    exercise: {
      defaultDistance: item.exercise.defaultDistance,
      distanceUnit: item.exercise.distanceUnit,
    },
  });
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  await clientUpsertWorkoutSet(db, userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: lk === "time" || lk === "distance" ? null : Math.max(1, item.targetReps ?? 5),
    durationSec: lk === "time" ? targetDuration : null,
    distance:
      lk === "distance" && !item.logTimeForDistanceSets
        ? roundDistance(
            Math.max(
              dUnit === "m" ? 1 : 0.01,
              targetDist
            ),
            dUnit
          )
        : null,
  });
}

export async function clientDecrementSetReps(
  db: TrainlogDB,
  userId: string,
  sessionId: string,
  exerciseId: string,
  setIndex: number
) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const row = s.sets.find(
    (x) => x.exerciseId === exerciseId && x.setIndex === setIndex
  );
  if (!row) throw new Error("Set not found");
  const item = itemFor(s, exerciseId);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  if (row.durationSec != null) {
    await clientUpsertWorkoutSet(db, userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      durationSec: row.durationSec - 1,
    });
  } else if (row.distance != null && lk === "distance") {
    const step = sessionDistanceStep(dUnit);
    const next = roundDistance(row.distance - step, dUnit);
    await clientUpsertWorkoutSet(db, userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      distance: next,
    });
  } else {
    await clientUpsertWorkoutSet(db, userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      reps: (row.reps ?? 1) - 1,
    });
  }
}

export async function clientUpsertSessionPref(
  db: TrainlogDB,
  userId: string,
  input: {
    sessionId: string;
    exerciseId: string;
    workingWeight?: number | null;
    workingDurationSec?: number | null;
    workingDistance?: number | null;
  }
) {
  const s = await loadWorkoutSessionView(db, userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = itemFor(s, input.exerciseId);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const existing = s.prefs.find((p) => p.exerciseId === input.exerciseId);
  const w =
    input.workingWeight === undefined
      ? (existing?.workingWeight ?? null)
      : input.workingWeight === null || !Number.isFinite(input.workingWeight)
        ? null
        : roundWorkingWeight(Number(input.workingWeight));
  const d =
    input.workingDurationSec === undefined
      ? (existing?.workingDurationSec ?? null)
      : input.workingDurationSec === null ||
          !Number.isFinite(input.workingDurationSec)
        ? null
        : Math.max(1, Math.round(Number(input.workingDurationSec)));
  const dist =
    input.workingDistance === undefined
      ? (existing?.workingDistance ?? null)
      : input.workingDistance === null || !Number.isFinite(input.workingDistance)
        ? null
        : roundDistance(
            Math.max(
              minPositiveDistance(dUnit),
              Number(input.workingDistance)
            ),
            dUnit
          );
  if (existing) {
    await updateLocal(db.workoutSessionExercisePrefs, existing.id, {
      workingWeight: w,
      workingDurationSec: d,
      workingDistance: dist,
    } as Record<string, unknown>);
    return;
  }
  if (w === null && d === null && dist === null) return;
  await insertLocal(db.workoutSessionExercisePrefs, {
    id: newId(),
    userId,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    workingWeight: w,
    workingDurationSec: d,
    workingDistance: dist,
  } as unknown as Record<string, unknown>);
}

export async function clientAdjustSessionExerciseWeight(
  db: TrainlogDB,
  userId: string,
  sessionId: string,
  exerciseId: string,
  direction: "up" | "down"
) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  if (!item.trackWeight) throw new Error("Weight not tracked");
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const unit = resolveTemplateItemWeightUnit({
    weightUnit: item.weightUnit,
    exercise: { weightUnit: item.exercise.weightUnit },
  });
  const step = sessionWeightStep(unit);
  const delta = direction === "up" ? step : -step;
  const pref = prefFor(s, exerciseId);
  const base = baseWeightForSessionAdjust(
    pref,
    item.defaultWeight,
    exSets.map((x) => ({ setIndex: x.setIndex, weight: x.weight }))
  );
  const next = roundWorkingWeight(base + delta);
  await clientUpsertSessionPref(db, userId, {
    sessionId,
    exerciseId,
    workingWeight: next,
  });
}

export async function clientAdjustSessionExerciseDuration(
  db: TrainlogDB,
  userId: string,
  sessionId: string,
  exerciseId: string,
  direction: "up" | "down"
) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const can =
    isTimeItem(item) ||
    (isDistanceItem(item) && item.logTimeForDistanceSets);
  if (!can) throw new Error("Not a timed exercise");
  const pref = prefFor(s, exerciseId);
  const current = targetDurationForActive(s, exerciseId, item);
  const next = Math.max(
    1,
    Math.round(current + (direction === "up" ? SESSION_DURATION_STEP_SEC : -SESSION_DURATION_STEP_SEC))
  );
  await clientUpsertSessionPref(db, userId, {
    sessionId,
    exerciseId,
    workingDurationSec: next,
  });
}

export async function clientAdjustSessionExerciseTargetDistance(
  db: TrainlogDB,
  userId: string,
  sessionId: string,
  exerciseId: string,
  direction: "up" | "down"
) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  if (!isDistanceItem(item)) throw new Error("Not a distance exercise");
  const pref = prefFor(s, exerciseId);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const current = targetDistanceForActive(s, exerciseId, item);
  const step = sessionDistanceStep(dUnit);
  const next = roundDistance(
    Math.max(minPositiveDistance(dUnit), current + (direction === "up" ? step : -step)),
    dUnit
  );
  await clientUpsertSessionPref(db, userId, {
    sessionId,
    exerciseId,
    workingDistance: next,
  });
}

export async function clientLogTimedSet(
  db: TrainlogDB,
  userId: string,
  sessionId: string,
  exerciseId: string,
  setIndex: number,
  durationSec: number
) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk !== "time") throw new Error("Not a time-based exercise");
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((x) => x.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");
  const pref = prefFor(s, exerciseId);
  const weight = item.trackWeight
    ? suggestedWeightForSet(
        effectiveTemplateWeightForSession(pref, item.defaultWeight),
        exSets.map((s) => ({ setIndex: s.setIndex, weight: s.weight })),
        setIndex
      )
    : 0;
  const targetDuration = targetDurationForActive(s, exerciseId, item);
  const raw = Math.round(Number(durationSec));
  if (!Number.isFinite(raw)) throw new Error("Invalid duration");
  const clamped = Math.min(Math.max(1, raw), targetDuration);
  await clientUpsertWorkoutSet(db, userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: null,
    durationSec: clamped,
  });
}

export async function clientLogDistanceTimeFromStopwatch(
  db: TrainlogDB,
  userId: string,
  sessionId: string,
  exerciseId: string,
  setIndex: number,
  durationSec: number
) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk !== "distance" || !item.logTimeForDistanceSets) {
    throw new Error("Stopwatch logging is not enabled for this exercise");
  }
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((x) => x.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");
  const pref = prefFor(s, exerciseId);
  const weight = item.trackWeight
    ? suggestedWeightForSet(
        effectiveTemplateWeightForSession(pref, item.defaultWeight),
        exSets.map((s) => ({ setIndex: s.setIndex, weight: s.weight })),
        setIndex
      )
    : 0;
  const targetDuration = targetDurationForActive(s, exerciseId, item);
  const raw = Math.round(Number(durationSec));
  if (!Number.isFinite(raw)) throw new Error("Invalid duration");
  const clamped = Math.min(Math.max(1, raw), targetDuration);
  await clientUpsertWorkoutSet(db, userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: null,
    durationSec: clamped,
  });
}
