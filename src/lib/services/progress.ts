import { and, asc, eq, gte, inArray, lt, lte } from "drizzle-orm";

import { db } from "@/db/client";
import {
  exercises,
  userVitalEntries,
  workoutSessions,
} from "@/db/schema";
import { bmiFromLbIn } from "@/lib/bmi";
import {
  eachDayKeyInRange,
  formatDayKey,
  localDayRangeBoundsMs,
  parseDayKey,
} from "@/lib/date-key";
import { parseExerciseLogKind } from "@/lib/log-kind";
import * as nutrition from "@/lib/services/nutrition";
import { getEffectiveHeightIn } from "@/lib/services/profile";
import { isAllowedVitalKey } from "@/lib/vitals-keys";

export type DayPoint = { dayKey: string; value: number };

export type ExerciseProgressMetric = "weight" | "duration_sec" | "distance";

function aggregateExerciseDayValue(
  logKind: ReturnType<typeof parseExerciseLogKind>,
  sets: { weight: number; durationSec: number | null; distance: number | null }[]
): number | null {
  if (sets.length === 0) return null;
  if (logKind === "time") {
    const durs = sets
      .map((x) => x.durationSec)
      .filter((x): x is number => x != null && Number.isFinite(x));
    if (durs.length === 0) return null;
    return Math.max(...durs);
  }
  if (logKind === "distance") {
    const dists = sets
      .map((x) => x.distance)
      .filter((x): x is number => x != null && Number.isFinite(x));
    if (dists.length > 0) return Math.max(...dists);
    const durs = sets
      .map((x) => x.durationSec)
      .filter((x): x is number => x != null && Number.isFinite(x));
    if (durs.length === 0) return null;
    return Math.max(...durs);
  }
  return Math.max(...sets.map((x) => x.weight));
}

/**
 * Best logged value per calendar day for one exercise (max across sets that day).
 * Metric follows exercise `logKind`: reps → max weight; time → max duration (s);
 * distance → max distance, or max duration when sets only have time logged.
 */
export async function getExerciseProgressByDay(
  userId: string,
  exerciseId: string,
  fromDayKey: string,
  toDayKey: string
): Promise<{
  metric: ExerciseProgressMetric;
  points: DayPoint[];
}> {
  const ex = await db.query.exercises.findFirst({
    where: eq(exercises.id, exerciseId),
    columns: { logKind: true },
  });
  const lk = parseExerciseLogKind(ex?.logKind);
  const metric: ExerciseProgressMetric =
    lk === "time"
      ? "duration_sec"
      : lk === "distance"
        ? "distance"
        : "weight";

  const bounds = localDayRangeBoundsMs(fromDayKey, toDayKey);
  if (!bounds) return { metric, points: [] };

  const rows = await db.query.workoutSessions.findMany({
    where: and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "completed"),
      gte(workoutSessions.startedAt, new Date(bounds.startMs)),
      lt(workoutSessions.startedAt, new Date(bounds.endExclusiveMs))
    ),
    with: { sets: true },
  });
  const map = new Map<string, number>();
  for (const s of rows) {
    const dk = formatDayKey(new Date(s.startedAt));
    const sets = s.sets.filter((x) => x.exerciseId === exerciseId);
    const v = aggregateExerciseDayValue(lk, sets);
    if (v == null) continue;
    map.set(dk, Math.max(map.get(dk) ?? 0, v));
  }
  const points = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, value]) => ({ dayKey, value }));
  return { metric, points };
}

export async function getMacroTotalsByDay(
  userId: string,
  fromDayKey: string,
  toDayKey: string
): Promise<
  {
    dayKey: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[]
> {
  if (!parseDayKey(fromDayKey) || !parseDayKey(toDayKey)) return [];
  const out: {
    dayKey: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[] = [];
  const days: string[] = [];
  eachDayKeyInRange(fromDayKey, toDayKey, (k) => days.push(k));
  for (const dayKey of days) {
    const t = await nutrition.getDailyTotals(userId, dayKey);
    out.push({ dayKey, ...t });
  }
  return out;
}

export async function listVitalEntriesInRange(
  userId: string,
  fromDayKey: string,
  toDayKey: string,
  keys?: string[]
) {
  const cond = [
    eq(userVitalEntries.userId, userId),
    gte(userVitalEntries.dayKey, fromDayKey),
    lte(userVitalEntries.dayKey, toDayKey),
  ];
  if (keys?.length) {
    const allowed = keys.filter(isAllowedVitalKey);
    if (allowed.length === 0) return [];
    cond.push(inArray(userVitalEntries.vitalKey, allowed));
  }
  return db.query.userVitalEntries.findMany({
    where: and(...cond),
    orderBy: [asc(userVitalEntries.dayKey), asc(userVitalEntries.vitalKey)],
  });
}

export async function getLatestVitalMap(userId: string) {
  const rows = await db
    .select({
      vitalKey: userVitalEntries.vitalKey,
      dayKey: userVitalEntries.dayKey,
      value: userVitalEntries.value,
      recordedAt: userVitalEntries.recordedAt,
    })
    .from(userVitalEntries)
    .where(eq(userVitalEntries.userId, userId));

  const best = new Map<
    string,
    { dayKey: string; value: number; recordedAt: Date }
  >();
  for (const r of rows) {
    const cur = best.get(r.vitalKey);
    if (
      !cur ||
      r.dayKey > cur.dayKey ||
      (r.dayKey === cur.dayKey && r.recordedAt > cur.recordedAt)
    ) {
      best.set(r.vitalKey, {
        dayKey: r.dayKey,
        value: r.value,
        recordedAt: r.recordedAt,
      });
    }
  }
  return best;
}

export async function upsertVitalEntry(
  userId: string,
  input: { vitalKey: string; value: number; dayKey?: string }
) {
  if (!isAllowedVitalKey(input.vitalKey)) throw new Error("Invalid vital key");
  const dayKey = (input.dayKey?.trim() && parseDayKey(input.dayKey.trim())
    ? input.dayKey.trim()
    : formatDayKey()) as string;
  const v = Number(input.value);
  if (!Number.isFinite(v)) throw new Error("Invalid value");
  const now = new Date();

  await db
    .delete(userVitalEntries)
    .where(
      and(
        eq(userVitalEntries.userId, userId),
        eq(userVitalEntries.vitalKey, input.vitalKey),
        eq(userVitalEntries.dayKey, dayKey)
      )
    );
  const [row] = await db
    .insert(userVitalEntries)
    .values({
      userId,
      vitalKey: input.vitalKey,
      dayKey,
      value: v,
      recordedAt: now,
    })
    .returning();
  return row;
}

export async function getWeightAndBmiSeries(
  userId: string,
  fromDayKey: string,
  toDayKey: string
): Promise<{
  weight: DayPoint[];
  bmi: { dayKey: string; value: number }[];
  /** Effective height (profile, else legacy vitals) used for BMI in this range. */
  latestHeightIn: number | null;
}> {
  const height = await getEffectiveHeightIn(userId);
  const vitals = await listVitalEntriesInRange(
    userId,
    fromDayKey,
    toDayKey,
    ["body_weight_lb"]
  );

  const weight = vitals
    .filter((r) => r.vitalKey === "body_weight_lb")
    .map((r) => ({ dayKey: r.dayKey, value: r.value }))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  const bmi: { dayKey: string; value: number }[] = [];
  if (height != null) {
    for (const w of weight) {
      const b = bmiFromLbIn(w.value, height);
      if (b != null) {
        bmi.push({ dayKey: w.dayKey, value: Math.round(b * 10) / 10 });
      }
    }
  }

  return { weight, bmi, latestHeightIn: height };
}

export async function listExercisesWithCompletedSets(userId: string) {
  const sessions = await db.query.workoutSessions.findMany({
    where: and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "completed")
    ),
    columns: { id: true },
    with: {
      sets: { columns: { exerciseId: true } },
    },
    limit: 500,
  });
  const ids = new Set<string>();
  for (const s of sessions) {
    for (const st of s.sets) ids.add(st.exerciseId);
  }
  if (ids.size === 0) return [] as { id: string; name: string }[];
  const ex = await db.query.exercises.findMany({
    where: inArray(exercises.id, [...ids]),
    columns: { id: true, name: true },
    orderBy: [asc(exercises.name)],
  });
  return ex;
}
