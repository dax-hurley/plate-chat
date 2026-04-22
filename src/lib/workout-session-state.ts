import type { ExerciseLogKind } from "@/lib/log-kind";
import { parseExerciseLogKind } from "@/lib/log-kind";
import { parseDistanceUnit, roundDistance } from "@/lib/distance-units";

export type TemplateItemLike = {
  order: number;
  targetSets: number;
  targetReps: number | null;
  targetDurationSec?: number | null;
  targetDistance?: number | null;
  defaultWeight: number | null;
  exercise: {
    id: string;
    name: string;
    logKind?: string | null;
    defaultDurationSec?: number | null;
    defaultDistance?: number | null;
    distanceUnit?: string | null;
  };
};

export type SetLike = {
  exerciseId: string;
  setIndex: number;
  reps: number | null;
  durationSec: number | null;
  distance?: number | null;
  weight: number;
};

export const SESSION_DURATION_STEP_SEC = 5;

export function roundWorkingWeight(n: number): number {
  return Math.round(Math.max(0, n) * 2) / 2;
}

/** Baseline load for +/- during a session (template default unless overridden). */
export function baseWeightForSessionAdjust(
  pref: { workingWeight: number | null } | null | undefined,
  templateDefault: number | null,
  setsForExercise: { setIndex: number; weight: number }[]
): number {
  if (pref?.workingWeight != null && Number.isFinite(pref.workingWeight)) {
    return roundWorkingWeight(pref.workingWeight);
  }
  if (templateDefault != null && Number.isFinite(templateDefault)) {
    return roundWorkingWeight(templateDefault);
  }
  if (setsForExercise.length === 0) return 0;
  const last = [...setsForExercise].sort((a, b) => b.setIndex - a.setIndex)[0];
  return roundWorkingWeight(last?.weight ?? 0);
}

export function effectiveTemplateWeightForSession(
  pref: { workingWeight: number | null } | null | undefined,
  templateDefault: number | null
): number | null {
  if (pref?.workingWeight != null && Number.isFinite(pref.workingWeight)) {
    return roundWorkingWeight(pref.workingWeight);
  }
  if (templateDefault != null && Number.isFinite(templateDefault)) {
    return roundWorkingWeight(templateDefault);
  }
  return null;
}

export function effectiveTargetDurationSecForSession(
  pref: { workingDurationSec: number | null } | null | undefined,
  item: {
    targetDurationSec: number | null;
    exercise: { defaultDurationSec?: number | null };
  }
): number {
  if (
    pref?.workingDurationSec != null &&
    Number.isFinite(pref.workingDurationSec) &&
    pref.workingDurationSec >= 1
  ) {
    return Math.round(pref.workingDurationSec);
  }
  return Math.max(
    1,
    Math.round(
      item.targetDurationSec ??
        item.exercise.defaultDurationSec ??
        60
    )
  );
}

export function effectiveTargetDistanceForSession(
  pref: { workingDistance: number | null } | null | undefined,
  item: {
    targetDistance: number | null;
    exercise: {
      defaultDistance?: number | null;
      distanceUnit?: string | null;
    };
  }
): number {
  const unit = parseDistanceUnit(item.exercise.distanceUnit);
  if (
    pref?.workingDistance != null &&
    Number.isFinite(pref.workingDistance) &&
    pref.workingDistance > 0
  ) {
    return roundDistance(pref.workingDistance, unit);
  }
  const fallback =
    item.targetDistance ??
    item.exercise.defaultDistance ??
    (unit === "m" ? 400 : 1);
  return roundDistance(
    Math.max(unit === "m" ? 1 : 0.01, Number(fallback)),
    unit
  );
}

/** Smallest missing set slot in 1..targetSets, or null if full. */
export function getNextOpenSetIndex(
  targetSets: number,
  existingSetIndices: number[]
): number | null {
  const logged = new Set(existingSetIndices);
  for (let i = 1; i <= targetSets; i++) {
    if (!logged.has(i)) return i;
  }
  return null;
}

export function suggestedWeightForSet(
  defaultWeight: number | null,
  setsForExercise: { setIndex: number; weight: number }[],
  setIndex: number
): number {
  const lower = setsForExercise
    .filter((s) => s.setIndex < setIndex)
    .sort((a, b) => b.setIndex - a.setIndex)[0];
  if (lower && Number.isFinite(lower.weight)) return lower.weight;
  if (defaultWeight != null && Number.isFinite(defaultWeight)) {
    return roundWorkingWeight(defaultWeight);
  }
  return 0;
}

/** Next set to log, or null if all template sets are complete. */
export function getCurrentStep(items: TemplateItemLike[], sets: SetLike[]) {
  const ordered = [...items].sort((a, b) => a.order - b.order);
  for (const item of ordered) {
    const forEx = sets.filter((s) => s.exerciseId === item.exercise.id);
    const done = forEx.length;
    if (done < item.targetSets) {
      const last =
        forEx.length === 0
          ? undefined
          : forEx.reduce((a, b) => (b.setIndex > a.setIndex ? b : a));
      const suggested =
        last?.weight ?? item.defaultWeight ?? ("" as const);
      const lk = parseExerciseLogKind(item.exercise.logKind);
      const logKind: ExerciseLogKind =
        lk === "time" || lk === "distance" ? lk : "reps";
      return {
        exerciseId: item.exercise.id,
        exerciseName: item.exercise.name,
        setIndex: done + 1,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        targetDurationSec: item.targetDurationSec ?? null,
        targetDistance: item.targetDistance ?? null,
        logKind,
        suggestedWeight:
          typeof suggested === "number" && Number.isFinite(suggested)
            ? suggested
            : ("" as const),
      };
    }
  }
  return null;
}
