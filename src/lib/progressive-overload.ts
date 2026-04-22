import {
  effectiveTargetDistanceForSession,
  effectiveTargetDurationSecForSession,
  roundWorkingWeight,
} from "@/lib/workout-session-state";

export type ProgressiveItemShape = {
  targetSets: number;
  targetReps: number | null;
  targetDurationSec: number | null;
  targetDistance: number | null;
  /** When true, distance exercises log `durationSec` (stopwatch) instead of distance. */
  logTimeForDistanceSets?: boolean;
  exercise: {
    logKind: string | null;
    defaultDurationSec: number | null;
    defaultDistance: number | null;
    distanceUnit: string | null;
  };
};

export type SetRowShape = {
  setIndex: number;
  reps: number | null;
  durationSec: number | null;
  distance: number | null;
};

/** Every target set index 1..n has a logged row. */
export function exerciseLoggedAllTargetSlots(
  targetSets: number,
  setsForExercise: SetRowShape[]
): boolean {
  if (setsForExercise.length < targetSets) return false;
  const seen = new Set<number>();
  for (const s of setsForExercise) {
    if (s.setIndex >= 1 && s.setIndex <= targetSets) seen.add(s.setIndex);
  }
  for (let i = 1; i <= targetSets; i++) {
    if (!seen.has(i)) return false;
  }
  return true;
}

export function exerciseMeetsRepAndDurationTargets(
  item: ProgressiveItemShape,
  pref:
    | {
        workingDurationSec: number | null;
        workingDistance: number | null;
      }
    | null
    | undefined,
  setsForExercise: SetRowShape[]
): boolean {
  const lk = item.exercise.logKind ?? "reps";
  const timeMode = lk === "time";
  const distanceMode = lk === "distance";
  const byIdx = new Map(setsForExercise.map((s) => [s.setIndex, s]));
  for (let i = 1; i <= item.targetSets; i++) {
    const row = byIdx.get(i);
    if (!row) return false;
    if (timeMode) {
      const need = effectiveTargetDurationSecForSession(pref, item);
      if (
        row.durationSec == null ||
        !Number.isFinite(row.durationSec) ||
        row.durationSec < need
      ) {
        return false;
      }
    } else if (distanceMode) {
      if (item.logTimeForDistanceSets) {
        const need = effectiveTargetDurationSecForSession(pref, item);
        if (
          row.durationSec == null ||
          !Number.isFinite(row.durationSec) ||
          row.durationSec < need
        ) {
          return false;
        }
      } else {
        const need = effectiveTargetDistanceForSession(pref, item);
        if (
          row.distance == null ||
          !Number.isFinite(row.distance) ||
          row.distance < need
        ) {
          return false;
        }
      }
    } else {
      const need = Math.max(1, item.targetReps ?? 5);
      if (
        row.reps == null ||
        !Number.isFinite(row.reps) ||
        row.reps < need
      ) {
        return false;
      }
    }
  }
  return true;
}

export function shouldBumpProgressiveOverload(args: {
  enabled: boolean;
  increment: number | null;
  requireFullCompletion: boolean;
  item: ProgressiveItemShape;
  pref: {
    workingDurationSec: number | null;
    workingDistance: number | null;
  } | null | undefined;
  setsForExercise: SetRowShape[];
}): boolean {
  if (!args.enabled) return false;
  const inc = args.increment;
  if (inc == null || !Number.isFinite(inc) || inc <= 0) return false;
  if (
    !exerciseLoggedAllTargetSlots(
      args.item.targetSets,
      args.setsForExercise
    )
  ) {
    return false;
  }
  if (args.requireFullCompletion) {
    return exerciseMeetsRepAndDurationTargets(
      args.item,
      args.pref,
      args.setsForExercise
    );
  }
  return true;
}

export function bumpedDefaultWeight(
  current: number | null,
  increment: number
): number {
  return roundWorkingWeight((current ?? 0) + increment);
}

/** Increase template hold / goal time (seconds) after a qualifying session. */
export function bumpedTargetDurationSec(
  current: number | null | undefined,
  increment: number
): number {
  const base = Math.max(1, Math.round(Number(current ?? 60)));
  const inc = Number(increment);
  if (!Number.isFinite(inc)) return base;
  return Math.max(1, Math.round(base + inc));
}
