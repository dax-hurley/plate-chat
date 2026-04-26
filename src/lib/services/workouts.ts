import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
} from "drizzle-orm";

import { db, type Database } from "@/db/client";
import {
  exercises,
  workoutRecurringRules,
  workoutRecurringSkips,
  workoutRoutineGroups,
  workoutScheduledItems,
  workoutSessionExercisePrefs,
  workoutSessions,
  workoutSets,
  workoutTemplateItems,
  workoutTemplates,
} from "@/db/schema";
import {
  baseWeightForSessionAdjust,
  effectiveTargetDistanceForSession,
  effectiveTargetDurationSecForSession,
  roundWorkingWeight,
} from "@/lib/workout-session-state";
import { formatDayKey, localDayRangeBoundsMs, parseDayKey } from "@/lib/date-key";
import {
  expandRecurringPlannedFromRules,
  mergePlannedOnceAndRecurring,
  type PlannedWorkoutEntry,
} from "@/lib/workout-planned-expand";
import { PRESET_EXERCISES } from "@/lib/preset-exercises";
import {
  bumpedDefaultWeight,
  bumpedTargetDurationSec,
  shouldBumpProgressiveOverload,
} from "@/lib/progressive-overload";
import {
  minPositiveDistance,
  parseDistanceUnit,
  roundDistance,
} from "@/lib/distance-units";
import { parseExerciseLogKind } from "@/lib/log-kind";
import { parseWeightUnit } from "@/lib/weight-units";

export type { PlannedWorkoutEntry } from "@/lib/workout-planned-expand";

export async function listTemplates(userId: string) {
  return db.query.workoutTemplates.findMany({
    where: eq(workoutTemplates.userId, userId),
    orderBy: [desc(workoutTemplates.createdAt)],
    with: {
      items: {
        orderBy: [asc(workoutTemplateItems.order)],
        with: { exercise: true },
      },
    },
  });
}

const templateWithItemsQuery = {
  items: {
    orderBy: [asc(workoutTemplateItems.order)],
    with: { exercise: true as const },
  },
};

export type WorkoutTemplateWithItems = Awaited<
  ReturnType<typeof listTemplates>
>[number];

/**
 * Saved workouts grouped into user-defined **routines**, plus templates not in any routine.
 */
export async function listWorkoutRoutinesLibrary(
  userId: string
): Promise<{
  groups: Array<{
    id: string;
    name: string;
    userId: string;
    sortOrder: number;
    createdAt: Date;
    templates: WorkoutTemplateWithItems[];
  }>;
  ungrouped: WorkoutTemplateWithItems[];
}> {
  const groups = await db.query.workoutRoutineGroups.findMany({
    where: eq(workoutRoutineGroups.userId, userId),
    orderBy: [asc(workoutRoutineGroups.sortOrder), asc(workoutRoutineGroups.createdAt)],
    with: {
      templates: {
        orderBy: [
          asc(workoutTemplates.routineOrder),
          asc(workoutTemplates.createdAt),
        ],
        with: templateWithItemsQuery,
      },
    },
  });

  const ungrouped = await db.query.workoutTemplates.findMany({
    where: and(
      eq(workoutTemplates.userId, userId),
      isNull(workoutTemplates.routineGroupId)
    ),
    orderBy: [asc(workoutTemplates.createdAt)],
    with: templateWithItemsQuery,
  });

  return { groups, ungrouped };
}

export async function createRoutineGroup(userId: string, input: { name: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Name required");

  const [maxRow] = await db
    .select({ sortOrder: workoutRoutineGroups.sortOrder })
    .from(workoutRoutineGroups)
    .where(eq(workoutRoutineGroups.userId, userId))
    .orderBy(desc(workoutRoutineGroups.sortOrder))
    .limit(1);

  const nextSort = (maxRow?.sortOrder ?? -1) + 1;

  const [row] = await db
    .insert(workoutRoutineGroups)
    .values({
      userId,
      name,
      sortOrder: nextSort,
    })
    .returning();
  return row;
}

export async function renameRoutineGroup(
  userId: string,
  routineGroupId: string,
  name: string
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  const [row] = await db
    .update(workoutRoutineGroups)
    .set({ name: trimmed })
    .where(
      and(
        eq(workoutRoutineGroups.id, routineGroupId),
        eq(workoutRoutineGroups.userId, userId)
      )
    )
    .returning();
  if (!row) throw new Error("Routine not found");
  return row;
}

export async function deleteRoutineGroup(userId: string, routineGroupId: string) {
  await db
    .delete(workoutRoutineGroups)
    .where(
      and(
        eq(workoutRoutineGroups.id, routineGroupId),
        eq(workoutRoutineGroups.userId, userId)
      )
    );
}

/**
 * Put a saved workout into a routine, or remove it (`routineGroupId` null).
 * New position is appended at the end of the target routine.
 */
export async function setTemplateRoutineGroup(
  userId: string,
  templateId: string,
  routineGroupId: string | null
) {
  const t = await getTemplate(userId, templateId);
  if (!t) throw new Error("Template not found");

  if (routineGroupId === null) {
    await db
      .update(workoutTemplates)
      .set({ routineGroupId: null, routineOrder: null })
      .where(
        and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.userId, userId))
      );
    return;
  }

  const g = await db.query.workoutRoutineGroups.findFirst({
    where: and(
      eq(workoutRoutineGroups.id, routineGroupId),
      eq(workoutRoutineGroups.userId, userId)
    ),
  });
  if (!g) throw new Error("Routine not found");

  const siblings = await db.query.workoutTemplates.findMany({
    where: and(
      eq(workoutTemplates.userId, userId),
      eq(workoutTemplates.routineGroupId, routineGroupId),
      ne(workoutTemplates.id, templateId)
    ),
  });
  const maxOrder = siblings.reduce(
    (m, x) => Math.max(m, x.routineOrder ?? 0),
    -1
  );

  await db
    .update(workoutTemplates)
    .set({
      routineGroupId,
      routineOrder: maxOrder + 1,
    })
    .where(
      and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.userId, userId))
    );
}

export async function moveTemplateWithinRoutine(
  userId: string,
  templateId: string,
  direction: "up" | "down"
) {
  const t = await db.query.workoutTemplates.findFirst({
    where: and(
      eq(workoutTemplates.id, templateId),
      eq(workoutTemplates.userId, userId)
    ),
  });
  if (!t?.routineGroupId) throw new Error("Workout is not in a routine");

  const gid = t.routineGroupId;
  const list = await db.query.workoutTemplates.findMany({
    where: and(
      eq(workoutTemplates.userId, userId),
      eq(workoutTemplates.routineGroupId, gid)
    ),
    orderBy: [asc(workoutTemplates.routineOrder), asc(workoutTemplates.createdAt)],
  });

  const idx = list.findIndex((x) => x.id === templateId);
  if (idx < 0) throw new Error("Workout not found in routine");
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return;

  const next = [...list];
  const [moved] = next.splice(idx, 1);
  next.splice(swapIdx, 0, moved);

  await db.transaction(async (tx) => {
    for (let i = 0; i < next.length; i++) {
      await tx
        .update(workoutTemplates)
        .set({ routineOrder: i })
        .where(eq(workoutTemplates.id, next[i].id));
    }
  });
}

export async function getTemplate(userId: string, templateId: string) {
  const t = await db.query.workoutTemplates.findFirst({
    where: and(
      eq(workoutTemplates.id, templateId),
      eq(workoutTemplates.userId, userId)
    ),
    with: {
      items: {
        orderBy: [asc(workoutTemplateItems.order)],
        with: { exercise: true },
      },
    },
  });
  return t ?? null;
}

export async function createExercise(
  userId: string,
  input: {
    name: string;
    muscleGroup?: string;
    logKind?: "reps" | "time" | "distance";
    defaultDurationSec?: number | null;
    defaultDistance?: number | null;
    distanceUnit?: "km" | "mi" | "m" | string | null;
    weightUnit?: "lb" | "kg" | string | null;
    /** Ignored for rep-based lifts (always tracked). Default false for time/distance. */
    trackWeight?: boolean;
  }
) {
  const logKind = parseExerciseLogKind(input.logKind);
  const trackWeight =
    logKind === "reps"
      ? true
      : input.trackWeight !== undefined
        ? Boolean(input.trackWeight)
        : false;
  const defaultDurationSec =
    logKind === "time"
      ? Math.max(1, Math.round(input.defaultDurationSec ?? 60))
      : null;
  const dUnit = parseDistanceUnit(
    input.distanceUnit === undefined || input.distanceUnit === null
      ? "km"
      : String(input.distanceUnit)
  );
  const defaultDistance =
    logKind === "distance"
      ? roundDistance(
          Math.max(
            minPositiveDistance(dUnit),
            Number(input.defaultDistance ?? (dUnit === "m" ? 400 : 1))
          ),
          dUnit
        )
      : null;
  const weightUnit = parseWeightUnit(
    input.weightUnit === undefined || input.weightUnit === null
      ? "lb"
      : String(input.weightUnit)
  );
  const [row] = await db
    .insert(exercises)
    .values({
      userId,
      name: input.name.trim(),
      muscleGroup: input.muscleGroup?.trim() || null,
      logKind,
      defaultDurationSec,
      defaultDistance,
      distanceUnit: logKind === "distance" ? dUnit : "km",
      weightUnit,
      trackWeight,
      isCustom: true,
    })
    .returning();
  return row;
}

function normalizeRestBetweenSetsSec(
  v: number | null | undefined
): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  const n = Math.round(Number(v));
  if (n <= 0) return null;
  return Math.min(n, 3600);
}

export async function createTemplate(
  userId: string,
  input: { name: string; notes?: string }
) {
  const [row] = await db
    .insert(workoutTemplates)
    .values({
      userId,
      name: input.name.trim(),
      notes: input.notes?.trim() || null,
    })
    .returning();
  return row;
}

/**
 * Update saved workout metadata (partial). Omitted fields are unchanged.
 */
export async function updateWorkoutTemplate(
  userId: string,
  templateId: string,
  input: {
    name?: string;
    notes?: string | null;
  }
) {
  const t = await getTemplate(userId, templateId);
  if (!t) throw new Error("Template not found");

  const set: {
    name?: string;
    notes?: string | null;
  } = {};

  if (input.name !== undefined) {
    const n = input.name.trim();
    if (!n) throw new Error("Name required");
    set.name = n;
  }
  if (input.notes !== undefined) {
    set.notes =
      input.notes === null || String(input.notes).trim() === ""
        ? null
        : String(input.notes).trim();
  }

  if (Object.keys(set).length === 0) return t;

  await db
    .update(workoutTemplates)
    .set(set)
    .where(
      and(
        eq(workoutTemplates.id, templateId),
        eq(workoutTemplates.userId, userId)
      )
    );

  const next = await getTemplate(userId, templateId);
  if (!next) throw new Error("Template not found");
  return next;
}

export async function addTemplateItem(
  userId: string,
  input: {
    templateId: string;
    exerciseId: string;
    order: number;
    targetSets?: number;
    targetReps?: number;
    targetDurationSec?: number | null;
    targetDistance?: number | null;
    defaultWeight?: number | null;
    /** Omit or null to inherit `exercises.weightUnit` for this line. */
    weightUnit?: "lb" | "kg" | string | null;
    progressiveOverloadEnabled?: boolean;
    progressiveOverloadIncrement?: number | null;
    progressiveOverloadRequireFullCompletion?: boolean;
    /** Omit to follow the exercise default. */
    trackWeight?: boolean;
    /** Distance exercises only: log stopwatch time instead of distance. */
    logTimeForDistanceSets?: boolean;
    /** Session list: Warmup tab vs main workout. */
    isWarmup?: boolean;
    /** Between-set rest (seconds) for this line; omit/null = no countdown. */
    restBetweenSetsSec?: number | null;
  }
) {
  const t = await getTemplate(userId, input.templateId);
  if (!t) throw new Error("Template not found");
  const ex = await db.query.exercises.findFirst({
    where: and(
      eq(exercises.id, input.exerciseId),
      or(eq(exercises.userId, userId), isNull(exercises.userId))
    ),
  });
  if (!ex) throw new Error("Exercise not found");
  const lk = parseExerciseLogKind(ex.logKind);
  const isTime = lk === "time";
  const isDistance = lk === "distance";
  const logTimeFD = isDistance && Boolean(input.logTimeForDistanceSets);
  const dUnit = parseDistanceUnit(ex.distanceUnit);
  const targetReps = isTime || isDistance
    ? null
    : Math.max(1, Math.round(input.targetReps ?? 5));
  const targetDurationSec =
    isTime
      ? Math.max(
          1,
          Math.round(
            input.targetDurationSec ??
              ex.defaultDurationSec ??
              60
          )
        )
      : isDistance && logTimeFD
        ? Math.max(
            1,
            Math.round(
              input.targetDurationSec ??
                ex.defaultDurationSec ??
                60
            )
          )
        : null;
  const targetDistance =
    isDistance && !logTimeFD
      ? roundDistance(
          Math.max(
            minPositiveDistance(dUnit),
            Number(
              input.targetDistance ??
                ex.defaultDistance ??
                (dUnit === "m" ? 400 : 1)
            )
          ),
          dUnit
        )
      : null;
  const itemWeightUnit =
    input.weightUnit === undefined
      ? null
      : input.weightUnit === null || String(input.weightUnit).trim() === ""
        ? null
        : parseWeightUnit(String(input.weightUnit));
  const lineTrackWeight =
    input.trackWeight !== undefined ? Boolean(input.trackWeight) : ex.trackWeight;
  const [row] = await db
    .insert(workoutTemplateItems)
    .values({
      userId,
      templateId: input.templateId,
      exerciseId: input.exerciseId,
      order: input.order,
      targetSets: input.targetSets ?? 3,
      targetReps,
      targetDurationSec,
      targetDistance,
      defaultWeight: input.defaultWeight ?? null,
      weightUnit: itemWeightUnit,
      trackWeight: lineTrackWeight,
      progressiveOverloadEnabled:
        input.progressiveOverloadEnabled ?? false,
      progressiveOverloadIncrement:
        input.progressiveOverloadIncrement === undefined
          ? null
          : input.progressiveOverloadIncrement === null ||
              !Number.isFinite(input.progressiveOverloadIncrement)
            ? null
            : Number(input.progressiveOverloadIncrement),
      progressiveOverloadRequireFullCompletion:
        input.progressiveOverloadRequireFullCompletion ?? false,
      logTimeForDistanceSets: logTimeFD,
      isWarmup: input.isWarmup ?? false,
      restBetweenSetsSec: normalizeRestBetweenSetsSec(
        input.restBetweenSetsSec
      ),
    })
    .returning();
  return row;
}

/** Append one lift to the end of a template (next order index). */
export async function appendTemplateItem(
  userId: string,
  input: {
    templateId: string;
    exerciseId: string;
    targetSets?: number;
    targetReps?: number;
    targetDurationSec?: number | null;
    targetDistance?: number | null;
    defaultWeight?: number | null;
    weightUnit?: "lb" | "kg" | string | null;
    progressiveOverloadEnabled?: boolean;
    progressiveOverloadIncrement?: number | null;
    progressiveOverloadRequireFullCompletion?: boolean;
    trackWeight?: boolean;
    logTimeForDistanceSets?: boolean;
    isWarmup?: boolean;
    restBetweenSetsSec?: number | null;
  }
) {
  const t = await getTemplate(userId, input.templateId);
  if (!t) throw new Error("Template not found");
  const nextOrder = t.items.reduce((m, i) => Math.max(m, i.order), -1) + 1;
  return addTemplateItem(userId, {
    templateId: input.templateId,
    exerciseId: input.exerciseId,
    order: nextOrder,
    targetSets: input.targetSets,
    targetReps: input.targetReps,
    targetDurationSec: input.targetDurationSec,
    targetDistance: input.targetDistance,
    defaultWeight: input.defaultWeight,
    weightUnit: input.weightUnit,
    progressiveOverloadEnabled: input.progressiveOverloadEnabled,
    progressiveOverloadIncrement: input.progressiveOverloadIncrement,
    progressiveOverloadRequireFullCompletion:
      input.progressiveOverloadRequireFullCompletion,
    trackWeight: input.trackWeight,
    logTimeForDistanceSets: input.logTimeForDistanceSets,
    isWarmup: input.isWarmup,
    restBetweenSetsSec: input.restBetweenSetsSec,
  });
}

/** Append many lifts to the end of a template in order (same semantics as repeated appendTemplateItem). */
export async function appendTemplateItemsBulk(
  userId: string,
  templateId: string,
  items: Array<{
    exerciseId: string;
    targetSets?: number;
    targetReps?: number;
    targetDurationSec?: number | null;
    targetDistance?: number | null;
    defaultWeight?: number | null;
    weightUnit?: "lb" | "kg" | null;
    progressiveOverloadEnabled?: boolean;
    progressiveOverloadIncrement?: number | null;
    progressiveOverloadRequireFullCompletion?: boolean;
    trackWeight?: boolean;
    logTimeForDistanceSets?: boolean;
    isWarmup?: boolean;
    restBetweenSetsSec?: number | null;
  }>
) {
  const tid = templateId.trim();
  const out: Awaited<ReturnType<typeof appendTemplateItem>>[] = [];
  for (const i of items) {
    const row = await appendTemplateItem(userId, {
      templateId: tid,
      exerciseId: i.exerciseId.trim(),
      targetSets: i.targetSets,
      targetReps: i.targetReps,
      targetDurationSec: i.targetDurationSec,
      targetDistance: i.targetDistance,
      defaultWeight: i.defaultWeight,
      weightUnit: i.weightUnit,
      progressiveOverloadEnabled: i.progressiveOverloadEnabled,
      progressiveOverloadIncrement: i.progressiveOverloadIncrement,
      progressiveOverloadRequireFullCompletion:
        i.progressiveOverloadRequireFullCompletion,
      trackWeight: i.trackWeight,
      logTimeForDistanceSets: i.logTimeForDistanceSets,
      isWarmup: i.isWarmup,
      restBetweenSetsSec: i.restBetweenSetsSec,
    });
    out.push(row);
  }
  return out;
}

export async function deleteTemplateItem(
  userId: string,
  itemId: string,
  templateId: string
) {
  const t = await getTemplate(userId, templateId);
  if (!t) throw new Error("Template not found");
  await db
    .delete(workoutTemplateItems)
    .where(
      and(
        eq(workoutTemplateItems.id, itemId),
        eq(workoutTemplateItems.templateId, templateId)
      )
    );
}

export async function updateTemplateItem(
  userId: string,
  input: {
    templateId: string;
    itemId: string;
    targetSets: number;
    targetReps?: number | null;
    targetDurationSec?: number | null;
    targetDistance?: number | null;
    defaultWeight?: number | null;
    /** Pass `null` to inherit exercise default; omit to leave unchanged. */
    weightUnit?: "lb" | "kg" | string | null;
    progressiveOverloadEnabled?: boolean;
    progressiveOverloadIncrement?: number | null;
    progressiveOverloadRequireFullCompletion?: boolean;
    trackWeight?: boolean;
    logTimeForDistanceSets?: boolean;
    isWarmup?: boolean;
    restBetweenSetsSec?: number | null;
  }
) {
  const t = await getTemplate(userId, input.templateId);
  if (!t) throw new Error("Template not found");
  const item = t.items.find((i) => i.id === input.itemId);
  if (!item) throw new Error("Item not found");
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const isTime = lk === "time";
  const isDistance = lk === "distance";
  const logTimeFD =
    input.logTimeForDistanceSets !== undefined
      ? Boolean(input.logTimeForDistanceSets)
      : item.logTimeForDistanceSets;
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const targetSets = Math.max(1, Math.round(input.targetSets));
  const targetReps = isTime || isDistance
    ? null
    : Math.max(
        1,
        Math.round(
          input.targetReps ?? item.targetReps ?? 5
        )
      );
  const targetDurationSec =
    isTime
      ? Math.max(
          1,
          Math.round(
            input.targetDurationSec ??
              item.targetDurationSec ??
              item.exercise.defaultDurationSec ??
              60
          )
        )
      : isDistance && logTimeFD
        ? Math.max(
            1,
            Math.round(
              input.targetDurationSec ??
                item.targetDurationSec ??
                item.exercise.defaultDurationSec ??
                60
            )
          )
        : null;
  const targetDistance =
    isDistance && !logTimeFD
      ? roundDistance(
          Math.max(
            minPositiveDistance(dUnit),
            Number(
              input.targetDistance ??
                item.targetDistance ??
                item.exercise.defaultDistance ??
                (dUnit === "m" ? 400 : 1)
            )
          ),
          dUnit
        )
      : null;
  const dw = input.defaultWeight;
  const defaultWeight =
    dw === null || dw === undefined
      ? null
      : Number.isFinite(Number(dw))
        ? Number(dw)
        : null;

  const wuPatch =
    input.weightUnit === undefined
      ? {}
      : {
          weightUnit:
            input.weightUnit === null ||
            String(input.weightUnit).trim() === ""
              ? null
              : parseWeightUnit(String(input.weightUnit)),
        };

  const progInc =
    input.progressiveOverloadIncrement === undefined
      ? undefined
      : input.progressiveOverloadIncrement === null ||
          !Number.isFinite(input.progressiveOverloadIncrement)
        ? null
        : Number(input.progressiveOverloadIncrement);

  const progPatch =
    input.progressiveOverloadEnabled === undefined &&
    input.progressiveOverloadIncrement === undefined &&
    input.progressiveOverloadRequireFullCompletion === undefined
      ? {}
      : {
          ...(input.progressiveOverloadEnabled !== undefined
            ? {
                progressiveOverloadEnabled: input.progressiveOverloadEnabled,
              }
            : {}),
          ...(input.progressiveOverloadIncrement !== undefined
            ? { progressiveOverloadIncrement: progInc ?? null }
            : {}),
          ...(input.progressiveOverloadRequireFullCompletion !== undefined
            ? {
                progressiveOverloadRequireFullCompletion:
                  input.progressiveOverloadRequireFullCompletion,
              }
            : {}),
        };

  const trackPatch =
    input.trackWeight === undefined
      ? {}
      : { trackWeight: Boolean(input.trackWeight) };

  const logTimePatch =
    input.logTimeForDistanceSets === undefined
      ? {}
      : { logTimeForDistanceSets: Boolean(input.logTimeForDistanceSets) };

  const warmupPatch =
    input.isWarmup === undefined ? {} : { isWarmup: Boolean(input.isWarmup) };

  const restPatch =
    input.restBetweenSetsSec === undefined
      ? {}
      : {
          restBetweenSetsSec: normalizeRestBetweenSetsSec(
            input.restBetweenSetsSec
          ),
        };

  await db
    .update(workoutTemplateItems)
    .set({
      targetSets,
      targetReps,
      targetDurationSec,
      targetDistance,
      defaultWeight,
      ...wuPatch,
      ...progPatch,
      ...trackPatch,
      ...logTimePatch,
      ...warmupPatch,
      ...restPatch,
    })
    .where(
      and(
        eq(workoutTemplateItems.id, input.itemId),
        eq(workoutTemplateItems.templateId, input.templateId)
      )
    );
}

/** Name / muscle group / weight unit for user-owned lifts (not global presets). */
export async function updateCustomExercise(
  userId: string,
  exerciseId: string,
  input: {
    name: string;
    muscleGroup?: string | null;
    weightUnit?: "lb" | "kg" | string | null;
    trackWeight?: boolean;
  }
) {
  const ex = await db.query.exercises.findFirst({
    where: and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)),
  });
  if (!ex) throw new Error("Exercise not found or not editable");
  const unitPatch =
    input.weightUnit === undefined
      ? {}
      : { weightUnit: parseWeightUnit(String(input.weightUnit)) };
  const trackPatch =
    input.trackWeight === undefined
      ? {}
      : { trackWeight: Boolean(input.trackWeight) };
  await db
    .update(exercises)
    .set({
      name: input.name.trim(),
      muscleGroup: input.muscleGroup?.trim() || null,
      ...unitPatch,
      ...trackPatch,
    })
    .where(
      and(eq(exercises.id, exerciseId), eq(exercises.userId, userId))
    );
}

export async function deleteTemplate(userId: string, templateId: string) {
  await db
    .delete(workoutTemplates)
    .where(
      and(
        eq(workoutTemplates.id, templateId),
        eq(workoutTemplates.userId, userId)
      )
    );
}

export async function getActiveSession(userId: string) {
  return db.query.workoutSessions.findFirst({
    where: and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "active")
    ),
    orderBy: [desc(workoutSessions.startedAt)],
    with: {
      template: {
        with: {
          items: {
            orderBy: [asc(workoutTemplateItems.order)],
            with: { exercise: true },
          },
        },
      },
      sets: true,
      exercisePrefs: true,
    },
  });
}

export async function startWorkoutFromTemplate(
  userId: string,
  templateId: string
) {
  const existing = await getActiveSession(userId);
  if (existing) {
    return { kind: "existing" as const, session: existing };
  }
  const t = await getTemplate(userId, templateId);
  if (!t) throw new Error("Template not found");
  const now = new Date();
  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId,
      templateId,
      startedAt: now,
      status: "active",
    })
    .returning();
  return { kind: "new" as const, session };
}

export async function getSession(userId: string, sessionId: string) {
  const s = await db.query.workoutSessions.findFirst({
    where: and(
      eq(workoutSessions.id, sessionId),
      eq(workoutSessions.userId, userId)
    ),
    with: {
      template: {
        with: {
          items: {
            orderBy: [asc(workoutTemplateItems.order)],
            with: { exercise: true },
          },
        },
      },
      sets: true,
      exercisePrefs: true,
    },
  });
  return s ?? null;
}

export async function upsertSessionExercisePref(
  userId: string,
  input: {
    sessionId: string;
    exerciseId: string;
    workingWeight?: number | null;
    workingDurationSec?: number | null;
    workingDistance?: number | null;
  }
) {
  const s = await getSession(userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = templateItemForExercise(s, input.exerciseId);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const now = new Date();
  const existing = await db.query.workoutSessionExercisePrefs.findFirst({
    where: and(
      eq(workoutSessionExercisePrefs.sessionId, input.sessionId),
      eq(workoutSessionExercisePrefs.exerciseId, input.exerciseId)
    ),
  });
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
      : input.workingDistance === null ||
          !Number.isFinite(input.workingDistance)
        ? null
        : roundDistance(
            Math.max(
              minPositiveDistance(dUnit),
              Number(input.workingDistance)
            ),
            dUnit
          );

  if (existing) {
    await db
      .update(workoutSessionExercisePrefs)
      .set({
        workingWeight: w,
        workingDurationSec: d,
        workingDistance: dist,
        updatedAt: now,
      })
      .where(eq(workoutSessionExercisePrefs.id, existing.id));
    return;
  }
  if (w === null && d === null && dist === null) return;
  await db.insert(workoutSessionExercisePrefs).values({
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    workingWeight: w,
    workingDurationSec: d,
    workingDistance: dist,
    updatedAt: now,
  });
}

export async function adjustSessionExerciseWorkingWeight(
  userId: string,
  input: { sessionId: string; exerciseId: string; delta: number }
) {
  const s = await getSession(userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = templateItemForExercise(s, input.exerciseId);
  if (!item.trackWeight) throw new Error("Weight not tracked for this exercise");
  const exSets = s.sets.filter((x) => x.exerciseId === input.exerciseId);
  const pref = sessionPrefForExercise(s, input.exerciseId);
  const base = baseWeightForSessionAdjust(pref, item.defaultWeight, exSets);
  const next = roundWorkingWeight(base + input.delta);
  await upsertSessionExercisePref(userId, {
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    workingWeight: next,
  });
}

export async function adjustSessionExerciseWorkingDuration(
  userId: string,
  input: { sessionId: string; exerciseId: string; delta: number }
) {
  const s = await getSession(userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = templateItemForExercise(s, input.exerciseId);
  const canAdjustDuration =
    isTimeTemplateItem(item) ||
    (isDistanceTemplateItem(item) && item.logTimeForDistanceSets);
  if (!canAdjustDuration) throw new Error("Not a timed exercise");
  const pref = sessionPrefForExercise(s, input.exerciseId);
  const current = effectiveTargetDurationSecForSession(pref, item);
  const next = Math.max(1, Math.round(current + input.delta));
  await upsertSessionExercisePref(userId, {
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    workingDurationSec: next,
  });
}

export async function adjustSessionExerciseWorkingDistance(
  userId: string,
  input: { sessionId: string; exerciseId: string; delta: number }
) {
  const s = await getSession(userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = templateItemForExercise(s, input.exerciseId);
  if (!isDistanceTemplateItem(item)) throw new Error("Not a distance exercise");
  const pref = sessionPrefForExercise(s, input.exerciseId);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const current = effectiveTargetDistanceForSession(pref, item);
  const next = roundDistance(
    Math.max(minPositiveDistance(dUnit), current + input.delta),
    dUnit
  );
  await upsertSessionExercisePref(userId, {
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    workingDistance: next,
  });
}

function templateItemForExercise(
  s: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  exerciseId: string
) {
  const item = s.template?.items.find((i) => i.exercise.id === exerciseId);
  if (!item) throw new Error("Exercise not in session");
  return item;
}

function sessionPrefForExercise(
  s: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  exerciseId: string
) {
  return s.exercisePrefs?.find((p) => p.exerciseId === exerciseId) ?? null;
}

function targetDurationSecForActiveSet(
  s: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  exerciseId: string,
  item: {
    targetDurationSec: number | null;
    exercise: { defaultDurationSec: number | null };
  }
) {
  return effectiveTargetDurationSecForSession(
    sessionPrefForExercise(s, exerciseId),
    item
  );
}

function targetDistanceForActiveSet(
  s: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  exerciseId: string,
  item: {
    targetDistance: number | null;
    exercise: {
      defaultDistance: number | null;
      distanceUnit: string | null;
    };
  }
) {
  return effectiveTargetDistanceForSession(
    sessionPrefForExercise(s, exerciseId),
    item
  );
}

function isTimeTemplateItem(item: {
  exercise: { logKind: string | null };
}): boolean {
  return (item.exercise.logKind ?? "reps") === "time";
}

function isDistanceTemplateItem(item: {
  exercise: { logKind: string | null };
}): boolean {
  return (item.exercise.logKind ?? "reps") === "distance";
}

/**
 * Insert or update a set row for (session, exercise, setIndex).
 * Rep-based: if reps fall below 1 on an existing row, deletes or resets like before.
 * Time-based: uses `durationSec` instead of reps (reps column stays null).
 */
export async function upsertWorkoutSet(
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
  const s = await getSession(userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = templateItemForExercise(s, input.exerciseId);
  const timeMode = isTimeTemplateItem(item);
  const distanceMode = isDistanceTemplateItem(item);
  const durationAsDistanceExercise =
    distanceMode && item.logTimeForDistanceSets;
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const weight = Number(input.weight);

  const existing = await db.query.workoutSets.findFirst({
    where: and(
      eq(workoutSets.sessionId, input.sessionId),
      eq(workoutSets.exerciseId, input.exerciseId),
      eq(workoutSets.setIndex, input.setIndex)
    ),
  });

  if (timeMode || durationAsDistanceExercise) {
    const d =
      input.durationSec != null && Number.isFinite(input.durationSec)
        ? Math.round(input.durationSec)
        : null;

    if (existing) {
      if (d !== null && d < 1) {
        const higher = await db.query.workoutSets.findFirst({
          where: and(
            eq(workoutSets.sessionId, input.sessionId),
            eq(workoutSets.exerciseId, input.exerciseId),
            gt(workoutSets.setIndex, input.setIndex)
          ),
        });
        if (higher) {
          const resetD = targetDurationSecForActiveSet(
            s,
            input.exerciseId,
            item
          );
          await db
            .update(workoutSets)
            .set({
              durationSec: resetD,
              reps: null,
              distance: null,
              weight: existing.weight,
              rpe: existing.rpe ?? null,
            })
            .where(eq(workoutSets.id, existing.id));
          const updated = await db.query.workoutSets.findFirst({
            where: eq(workoutSets.id, existing.id),
          });
          return updated ?? null;
        }
        await db.delete(workoutSets).where(eq(workoutSets.id, existing.id));
        return null;
      }
      if (d !== null) {
        await db
          .update(workoutSets)
          .set({
            durationSec: d,
            reps: null,
            distance: null,
            weight,
            rpe: input.rpe ?? existing.rpe ?? null,
          })
          .where(eq(workoutSets.id, existing.id));
        const updated = await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id),
        });
        return updated ?? null;
      }
      return (
        (await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id),
        })) ?? null
      );
    }

    if (d === null || d < 1) throw new Error("Invalid duration");
    const [row] = await db
      .insert(workoutSets)
      .values({
        sessionId: input.sessionId,
        exerciseId: input.exerciseId,
        setIndex: input.setIndex,
        reps: null,
        durationSec: d,
        distance: null,
        weight,
        rpe: input.rpe ?? null,
      })
      .returning();
    return row;
  }

  if (distanceMode) {
    const minD = minPositiveDistance(dUnit);
    const dist =
      input.distance != null && Number.isFinite(input.distance)
        ? roundDistance(Number(input.distance), dUnit)
        : null;

    if (existing) {
      if (dist !== null && dist < minD) {
        const higher = await db.query.workoutSets.findFirst({
          where: and(
            eq(workoutSets.sessionId, input.sessionId),
            eq(workoutSets.exerciseId, input.exerciseId),
            gt(workoutSets.setIndex, input.setIndex)
          ),
        });
        if (higher) {
          const resetDist = targetDistanceForActiveSet(
            s,
            input.exerciseId,
            item
          );
          await db
            .update(workoutSets)
            .set({
              distance: resetDist,
              reps: null,
              durationSec: null,
              weight: existing.weight,
              rpe: existing.rpe ?? null,
            })
            .where(eq(workoutSets.id, existing.id));
          const updated = await db.query.workoutSets.findFirst({
            where: eq(workoutSets.id, existing.id),
          });
          return updated ?? null;
        }
        await db.delete(workoutSets).where(eq(workoutSets.id, existing.id));
        return null;
      }
      if (dist !== null) {
        await db
          .update(workoutSets)
          .set({
            distance: dist,
            reps: null,
            durationSec: null,
            weight,
            rpe: input.rpe ?? existing.rpe ?? null,
          })
          .where(eq(workoutSets.id, existing.id));
        const updated = await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id),
        });
        return updated ?? null;
      }
      return (
        (await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id),
        })) ?? null
      );
    }

    if (dist === null || dist < minD) throw new Error("Invalid distance");
    const [row] = await db
      .insert(workoutSets)
      .values({
        sessionId: input.sessionId,
        exerciseId: input.exerciseId,
        setIndex: input.setIndex,
        reps: null,
        durationSec: null,
        distance: dist,
        weight,
        rpe: input.rpe ?? null,
      })
      .returning();
    return row;
  }

  const reps =
    input.reps != null && Number.isFinite(input.reps)
      ? Math.round(input.reps)
      : NaN;

  if (existing) {
    if (!Number.isFinite(reps)) throw new Error("Invalid reps");
    if (reps < 1) {
      const higher = await db.query.workoutSets.findFirst({
        where: and(
          eq(workoutSets.sessionId, input.sessionId),
          eq(workoutSets.exerciseId, input.exerciseId),
          gt(workoutSets.setIndex, input.setIndex)
        ),
      });
      if (higher) {
        const resetReps = Math.max(1, item.targetReps ?? 5);
        await db
          .update(workoutSets)
          .set({
            reps: resetReps,
            durationSec: null,
            distance: null,
            weight: existing.weight,
            rpe: existing.rpe ?? null,
          })
          .where(eq(workoutSets.id, existing.id));
        const updated = await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id),
        });
        return updated ?? null;
      }
      await db.delete(workoutSets).where(eq(workoutSets.id, existing.id));
      return null;
    }
    await db
      .update(workoutSets)
      .set({
        reps,
        durationSec: null,
        distance: null,
        weight,
        rpe: input.rpe ?? existing.rpe ?? null,
      })
      .where(eq(workoutSets.id, existing.id));
    const updated = await db.query.workoutSets.findFirst({
      where: eq(workoutSets.id, existing.id),
    });
    return updated ?? null;
  }

  if (!Number.isFinite(reps) || reps < 1) throw new Error("Invalid reps");
  const [row] = await db
    .insert(workoutSets)
    .values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: input.setIndex,
      reps,
      durationSec: null,
      distance: null,
      weight,
      rpe: input.rpe ?? null,
    })
    .returning();
  return row;
}

export async function logSet(
  userId: string,
  input: {
    sessionId: string;
    exerciseId: string;
    setIndex: number;
    weight: number;
    reps?: number;
    durationSec?: number;
    distance?: number;
    rpe?: number | null;
  }
) {
  return upsertWorkoutSet(userId, input);
}

async function applyProgressiveOverloadAfterCompletedSession(
  userId: string,
  s: NonNullable<Awaited<ReturnType<typeof getSession>>>
) {
  const templateId = s.templateId;
  if (!templateId || !s.template?.items.length) return;

  const tmpl = await getTemplate(userId, templateId);
  if (!tmpl) return;

  for (const sessionItem of s.template.items) {
    const live = tmpl.items.find((i) => i.id === sessionItem.id);
    if (!live?.progressiveOverloadEnabled) continue;
    if (live.isWarmup) continue;
    const inc = live.progressiveOverloadIncrement;
    if (inc == null || !Number.isFinite(inc) || inc <= 0) continue;

    const lk = parseExerciseLogKind(sessionItem.exercise.logKind);
    const weightPo = lk === "reps" && live.trackWeight;
    const durationPo =
      lk === "time" ||
      (lk === "distance" && sessionItem.logTimeForDistanceSets);
    const distancePo = lk === "distance" && !sessionItem.logTimeForDistanceSets;
    if (!weightPo && !durationPo && !distancePo) continue;

    const setsForExercise = s.sets
      .filter((x) => x.exerciseId === sessionItem.exercise.id)
      .map((x) => ({
        setIndex: x.setIndex,
        reps: x.reps,
        durationSec: x.durationSec,
        distance: x.distance,
      }));
    const pref =
      s.exercisePrefs?.find((p) => p.exerciseId === sessionItem.exercise.id) ??
      null;

    const itemShape = {
      targetSets: sessionItem.targetSets,
      targetReps: sessionItem.targetReps,
      targetDurationSec: sessionItem.targetDurationSec,
      targetDistance: sessionItem.targetDistance,
      logTimeForDistanceSets: sessionItem.logTimeForDistanceSets,
      exercise: {
        logKind: sessionItem.exercise.logKind,
        defaultDurationSec: sessionItem.exercise.defaultDurationSec,
        defaultDistance: sessionItem.exercise.defaultDistance,
        distanceUnit: sessionItem.exercise.distanceUnit,
      },
    };

    const ok = shouldBumpProgressiveOverload({
      enabled: live.progressiveOverloadEnabled,
      increment: inc,
      requireFullCompletion: live.progressiveOverloadRequireFullCompletion,
      item: itemShape,
      pref,
      setsForExercise,
    });
    if (!ok) continue;

    if (weightPo) {
      const next = bumpedDefaultWeight(live.defaultWeight, inc);
      await db
        .update(workoutTemplateItems)
        .set({ defaultWeight: next })
        .where(
          and(
            eq(workoutTemplateItems.id, live.id),
            eq(workoutTemplateItems.templateId, templateId)
          )
        );
      continue;
    }

    if (durationPo) {
      const next = bumpedTargetDurationSec(
        live.targetDurationSec ?? sessionItem.exercise.defaultDurationSec,
        inc
      );
      await db
        .update(workoutTemplateItems)
        .set({ targetDurationSec: next })
        .where(
          and(
            eq(workoutTemplateItems.id, live.id),
            eq(workoutTemplateItems.templateId, templateId)
          )
        );
      continue;
    }

    if (distancePo) {
      const u = parseDistanceUnit(sessionItem.exercise.distanceUnit);
      const base =
        live.targetDistance ??
        sessionItem.exercise.defaultDistance ??
        (u === "m" ? 400 : 1);
      const cur = roundDistance(
        Math.max(minPositiveDistance(u), Number(base)),
        u
      );
      const next = roundDistance(
        Math.max(minPositiveDistance(u), cur + inc),
        u
      );
      await db
        .update(workoutTemplateItems)
        .set({ targetDistance: next })
        .where(
          and(
            eq(workoutTemplateItems.id, live.id),
            eq(workoutTemplateItems.templateId, templateId)
          )
        );
    }
  }
}

export async function completeWorkout(userId: string, sessionId: string) {
  const s = await getSession(userId, sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  await applyProgressiveOverloadAfterCompletedSession(userId, s);
  await db
    .update(workoutSessions)
    .set({
      status: "completed",
      endedAt: new Date(),
    })
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      )
    );
}

export async function abandonWorkout(userId: string, sessionId: string) {
  const s = await getSession(userId, sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  await db
    .update(workoutSessions)
    .set({
      status: "abandoned",
      endedAt: new Date(),
    })
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      )
    );
}

export async function listRecentSessions(userId: string, limit = 8) {
  return db.query.workoutSessions.findMany({
    where: and(eq(workoutSessions.userId, userId)),
    orderBy: [desc(workoutSessions.startedAt)],
    limit,
    with: {
      template: true,
    },
  });
}

/** Idempotent preset rows; safe to call from `scripts/seed.ts`. */
export async function ensurePresetExercisesSeeded(database?: Database) {
  const client = database ?? db;
  if (PRESET_EXERCISES.length === 0) return;
  const rows = PRESET_EXERCISES.map((p) => {
    const logKind = p.logKind === "time" ? "time" : "reps";
    const defaultDurationSec =
      logKind === "time"
        ? Math.max(1, Math.round(p.defaultDurationSec ?? 60))
        : null;
    return {
      id: p.id,
      userId: null as string | null,
      name: p.name,
      muscleGroup: p.muscleGroup,
      logKind,
      defaultDurationSec,
      defaultDistance: null as number | null,
      distanceUnit: "km" as const,
      weightUnit: "lb" as const,
      trackWeight: true,
      isCustom: false,
    };
  });
  await client.insert(exercises).values(rows).onConflictDoNothing();
  for (const r of rows) {
    await client
      .update(exercises)
      .set({
        name: r.name,
        muscleGroup: r.muscleGroup,
        logKind: r.logKind,
        defaultDurationSec: r.defaultDurationSec,
        defaultDistance: r.defaultDistance,
        distanceUnit: r.distanceUnit,
        weightUnit: "lb",
        trackWeight: true,
        isCustom: false,
        userId: null,
      })
      .where(eq(exercises.id, r.id));
  }
}

export async function listUserExercises(userId: string) {
  await ensurePresetExercisesSeeded();
  return db.query.exercises.findMany({
    where: or(eq(exercises.userId, userId), isNull(exercises.userId)),
    orderBy: [asc(exercises.name)],
  });
}

/** Exercises that appear in this user's workout templates or logged sessions (not the full catalog). */
export async function listExercisesUsedInWorkouts(userId: string) {
  const templateRows = await db
    .select({ exerciseId: workoutTemplateItems.exerciseId })
    .from(workoutTemplateItems)
    .innerJoin(
      workoutTemplates,
      eq(workoutTemplateItems.templateId, workoutTemplates.id)
    )
    .where(eq(workoutTemplates.userId, userId));

  const sessionRows = await db
    .select({ exerciseId: workoutSets.exerciseId })
    .from(workoutSets)
    .innerJoin(
      workoutSessions,
      eq(workoutSets.sessionId, workoutSessions.id)
    )
    .where(eq(workoutSessions.userId, userId));

  const ids = new Set<string>();
  for (const r of templateRows) ids.add(r.exerciseId);
  for (const r of sessionRows) ids.add(r.exerciseId);
  if (ids.size === 0) return [];
  return db.query.exercises.findMany({
    where: inArray(exercises.id, [...ids]),
    orderBy: [asc(exercises.name)],
  });
}

export async function listScheduledInRange(
  userId: string,
  fromDayKey: string,
  toDayKey: string
) {
  return db.query.workoutScheduledItems.findMany({
    where: and(
      eq(workoutScheduledItems.userId, userId),
      gte(workoutScheduledItems.dayKey, fromDayKey),
      lte(workoutScheduledItems.dayKey, toDayKey)
    ),
    orderBy: [
      asc(workoutScheduledItems.dayKey),
      asc(workoutScheduledItems.createdAt),
    ],
    with: { template: true },
  });
}

export async function createScheduledWorkout(
  userId: string,
  input: { templateId: string; dayKey: string; notes?: string }
) {
  const dk = input.dayKey.trim();
  if (!parseDayKey(dk)) throw new Error("Invalid dayKey");
  const t = await getTemplate(userId, input.templateId.trim());
  if (!t) throw new Error("Template not found");
  const [row] = await db
    .insert(workoutScheduledItems)
    .values({
      userId,
      templateId: t.id,
      dayKey: dk,
      notes: input.notes?.trim() || null,
    })
    .returning();
  return row;
}

export async function deleteScheduledWorkout(userId: string, scheduleId: string) {
  const row = await db.query.workoutScheduledItems.findFirst({
    where: and(
      eq(workoutScheduledItems.id, scheduleId),
      eq(workoutScheduledItems.userId, userId)
    ),
  });
  if (!row) throw new Error("Scheduled workout not found");
  await db
    .delete(workoutScheduledItems)
    .where(
      and(
        eq(workoutScheduledItems.id, scheduleId),
        eq(workoutScheduledItems.userId, userId)
      )
    );
}

/**
 * Sessions whose `startedAt` falls on a local calendar day within [fromDayKey, toDayKey].
 */
export async function listSessionsStartedInDayRange(
  userId: string,
  fromDayKey: string,
  toDayKey: string
) {
  const bounds = localDayRangeBoundsMs(fromDayKey, toDayKey);
  if (!bounds) return [];
  const rows = await db.query.workoutSessions.findMany({
    where: and(
      eq(workoutSessions.userId, userId),
      gte(workoutSessions.startedAt, new Date(bounds.startMs)),
      lt(workoutSessions.startedAt, new Date(bounds.endExclusiveMs))
    ),
    orderBy: [desc(workoutSessions.startedAt)],
    with: { template: true },
  });
  return rows.map((s) => ({
    ...s,
    dayKey: formatDayKey(new Date(s.startedAt)),
  }));
}

export async function listRecurringRules(userId: string) {
  return db.query.workoutRecurringRules.findMany({
    where: eq(workoutRecurringRules.userId, userId),
    orderBy: [asc(workoutRecurringRules.startDayKey)],
    with: { template: true },
  });
}

export async function createRecurringWorkoutRule(
  userId: string,
  input: {
    templateId: string;
    byDay: number[];
    startDayKey: string;
    untilDayKey?: string | null;
    intervalWeeks?: number;
    notes?: string | null;
  }
) {
  const start = input.startDayKey.trim();
  if (!parseDayKey(start)) throw new Error("Invalid startDayKey");
  const days = [...new Set(input.byDay.filter((d) => d >= 0 && d <= 6))].sort(
    (a, b) => a - b
  );
  if (days.length === 0) throw new Error("Select at least one weekday");

  const until: string | null = input.untilDayKey?.trim() || null;
  if (until && !parseDayKey(until)) throw new Error("Invalid untilDayKey");
  if (until && until < start) throw new Error("End date must be on or after start");

  const t = await getTemplate(userId, input.templateId.trim());
  if (!t) throw new Error("Template not found");

  const iw = Math.max(1, Math.round(input.intervalWeeks ?? 1));

  const [row] = await db
    .insert(workoutRecurringRules)
    .values({
      userId,
      templateId: t.id,
      intervalWeeks: iw,
      byDay: JSON.stringify(days),
      startDayKey: start,
      untilDayKey: until,
      notes: input.notes?.trim() || null,
    })
    .returning();
  return row;
}

export async function deleteRecurringWorkoutRule(userId: string, ruleId: string) {
  const r = await db.query.workoutRecurringRules.findFirst({
    where: and(
      eq(workoutRecurringRules.id, ruleId),
      eq(workoutRecurringRules.userId, userId)
    ),
  });
  if (!r) throw new Error("Rule not found");
  await db
    .delete(workoutRecurringRules)
    .where(
      and(
        eq(workoutRecurringRules.id, ruleId),
        eq(workoutRecurringRules.userId, userId)
      )
    );
}

export async function skipRecurringOccurrence(
  userId: string,
  ruleId: string,
  dayKey: string
) {
  const dk = dayKey.trim();
  if (!parseDayKey(dk)) throw new Error("Invalid dayKey");
  const r = await db.query.workoutRecurringRules.findFirst({
    where: and(
      eq(workoutRecurringRules.id, ruleId),
      eq(workoutRecurringRules.userId, userId)
    ),
  });
  if (!r) throw new Error("Rule not found");
  await db
    .insert(workoutRecurringSkips)
    .values({ ruleId, dayKey: dk })
    .onConflictDoNothing();
}

async function expandRecurringPlanned(
  userId: string,
  fromKey: string,
  toKey: string
) {
  const rules = await db.query.workoutRecurringRules.findMany({
    where: and(
      eq(workoutRecurringRules.userId, userId),
      lte(workoutRecurringRules.startDayKey, toKey),
      or(
        isNull(workoutRecurringRules.untilDayKey),
        gte(workoutRecurringRules.untilDayKey, fromKey)
      )
    ),
    with: { template: true },
  });
  if (rules.length === 0) return [];

  const ruleIds = rules.map((r) => r.id);
  const skips = await db.query.workoutRecurringSkips.findMany({
    where: inArray(workoutRecurringSkips.ruleId, ruleIds),
  });

  return expandRecurringPlannedFromRules(
    rules.map((r) => ({
      id: r.id,
      startDayKey: r.startDayKey,
      untilDayKey: r.untilDayKey,
      byDay: r.byDay,
      intervalWeeks: r.intervalWeeks,
      templateId: r.templateId,
      templateName: r.template.name,
      notes: r.notes,
    })),
    skips.map((s) => ({ ruleId: s.ruleId, dayKey: s.dayKey })),
    fromKey,
    toKey
  );
}

export async function listPlannedWorkoutsInRange(
  userId: string,
  fromKey: string,
  toKey: string
): Promise<PlannedWorkoutEntry[]> {
  const [onceRows, recurring] = await Promise.all([
    listScheduledInRange(userId, fromKey, toKey),
    expandRecurringPlanned(userId, fromKey, toKey),
  ]);

  const onceEntries = onceRows.map((s) => ({
    source: "once" as const,
    scheduleId: s.id,
    dayKey: s.dayKey,
    templateId: s.templateId,
    templateName: s.template.name,
    notes: s.notes,
  }));

  return mergePlannedOnceAndRecurring(onceEntries, recurring);
}
