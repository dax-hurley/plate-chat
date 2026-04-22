"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  actionAdjustSessionExerciseDuration,
  actionAdjustSessionExerciseTargetDistance,
  actionAdjustSessionExerciseWeight,
  actionDecrementSetReps,
  actionFillSetSlot,
} from "@/app/app/workouts/actions";
import {
  DistanceStopwatch,
  TimeSetCountdown,
} from "@/app/app/workouts/session/[sessionId]/session-set-timers";
import { Button } from "@/components/ui/button";
import { formatDurationSeconds } from "@/lib/format-duration";
import {
  baseWeightForSessionAdjust,
  effectiveTargetDistanceForSession,
  effectiveTargetDurationSecForSession,
  getNextOpenSetIndex,
} from "@/lib/workout-session-state";
import {
  formatDistanceAmount,
  minPositiveDistance,
  parseDistanceUnit,
  type DistanceUnit,
} from "@/lib/distance-units";
import { parseExerciseLogKind } from "@/lib/log-kind";
import {
  formatLoadNumber,
  resolveTemplateItemWeightUnit,
  type WeightUnit,
} from "@/lib/weight-units";
import { cn } from "@/lib/utils";

type TemplateItem = {
  order: number;
  targetSets: number;
  targetReps: number | null;
  targetDurationSec: number | null;
  targetDistance: number | null;
  /** When true, distance exercises log hold time (stopwatch) instead of distance. */
  logTimeForDistanceSets: boolean;
  defaultWeight: number | null;
  weightUnit: string | null;
  trackWeight: boolean;
  exercise: {
    id: string;
    name: string;
    logKind: string | null;
    defaultDurationSec: number | null;
    defaultDistance: number | null;
    distanceUnit: string | null;
    weightUnit: string | null;
  };
};

type SetRow = {
  exerciseId: string;
  setIndex: number;
  reps: number | null;
  durationSec: number | null;
  distance: number | null;
  weight: number;
};

type ExercisePrefRow = {
  exerciseId: string;
  workingWeight: number | null;
  workingDurationSec: number | null;
  workingDistance: number | null;
};

type TabKey = "workout" | "warmup";

/** Rep / time set controls — always inline (never behind a modal). */
function ExerciseSetButtons({
  sessionId,
  item,
  exSets,
  effectiveTargetSec,
  effectiveTargetDist,
  dUnit,
  pending,
  runAction,
}: {
  sessionId: string;
  item: TemplateItem;
  exSets: SetRow[];
  effectiveTargetSec: number;
  effectiveTargetDist: number;
  dUnit: DistanceUnit;
  pending: boolean;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const timeMode = lk === "time";
  const distanceMode = lk === "distance";
  const logTimeForDistance = distanceMode && item.logTimeForDistanceSets;
  const nextOpen = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((s) => s.setIndex)
  );
  const byIndex = new Map(exSets.map((s) => [s.setIndex, s]));
  const targetSec = effectiveTargetSec;
  const repCircle =
    "min-h-14 min-w-14 size-14 text-lg md:min-h-[3.25rem] md:min-w-[3.25rem] md:size-[3.25rem] md:text-lg";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {Array.from({ length: item.targetSets }, (_, i) => {
        const setIndex = i + 1;
        const row = byIndex.get(setIndex);
        const isNextSlot = nextOpen === setIndex;
        const isFuture = !row && !isNextSlot;
        const emptyLabel = timeMode
          ? formatDurationSeconds(targetSec)
          : distanceMode
            ? logTimeForDistance
              ? formatDurationSeconds(targetSec)
              : formatDistanceAmount(effectiveTargetDist, dUnit)
            : String(item.targetReps ?? "—");

        if (!row && isNextSlot && timeMode) {
          return (
            <TimeSetCountdown
              key={`${item.exercise.id}-${setIndex}-${targetSec}`}
              sessionId={sessionId}
              exerciseId={item.exercise.id}
              setIndex={setIndex}
              targetSec={targetSec}
              pending={pending}
              runAction={runAction}
            />
          );
        }

        if (!row && isNextSlot && distanceMode) {
          return (
            <DistanceStopwatch
              key={`${item.exercise.id}-${setIndex}-${logTimeForDistance ? `t${targetSec}` : `d${effectiveTargetDist}`}`}
              sessionId={sessionId}
              exerciseId={item.exercise.id}
              setIndex={setIndex}
              targetLabel={
                logTimeForDistance
                  ? formatDurationSeconds(targetSec)
                  : formatDistanceAmount(effectiveTargetDist, dUnit)
              }
              logTimeInsteadOfDistance={logTimeForDistance}
              pending={pending}
              runAction={runAction}
            />
          );
        }

        if (row) {
          if (timeMode && row.durationSec != null) {
            return (
              <div
                key={setIndex}
                className={cn(
                  "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full px-2 font-semibold shadow-md ring-1 ring-primary/25 touch-manipulation",
                  "min-h-14 min-w-14 text-base md:min-h-[3.25rem] md:min-w-[3.25rem] md:text-lg"
                )}
                title="Timed set"
              >
                {formatDurationSeconds(row.durationSec)}
              </div>
            );
          }
          if (
            distanceMode &&
            logTimeForDistance &&
            row.durationSec != null
          ) {
            return (
              <div
                key={setIndex}
                className={cn(
                  "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full px-2 font-semibold shadow-md ring-1 ring-primary/25 touch-manipulation",
                  "min-h-14 min-w-14 text-base md:min-h-[3.25rem] md:min-w-[3.25rem] md:text-lg"
                )}
                title="Time (distance workout)"
              >
                {formatDurationSeconds(row.durationSec)}
              </div>
            );
          }
          if (distanceMode && row.distance != null) {
            return (
              <div
                key={setIndex}
                className={cn(
                  "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full px-2 font-semibold shadow-md ring-1 ring-primary/25 touch-manipulation",
                  "min-h-14 min-w-[4.5rem] text-base md:min-h-[3.25rem] md:min-w-[4.5rem] md:text-sm"
                )}
                title="Distance set"
              >
                {formatDistanceAmount(row.distance, dUnit)}
              </div>
            );
          }
          return (
            <button
              key={setIndex}
              type="button"
              disabled={pending}
              aria-label={`Set ${setIndex}, ${row.reps} reps, tap to decrease`}
              onClick={() =>
                runAction(() =>
                  actionDecrementSetReps(sessionId, item.exercise.id, setIndex)
                )
              }
              className={cn(
                "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-semibold shadow-md ring-1 ring-primary/25 transition-transform touch-manipulation",
                "hover:bg-primary/92 active:scale-95 disabled:opacity-60",
                repCircle
              )}
            >
              {row.reps ?? "—"}
            </button>
          );
        }

        return (
          <button
            key={setIndex}
            type="button"
            disabled={pending || isFuture}
            aria-label={
              isNextSlot
                ? timeMode
                  ? `Set ${setIndex}, tap to log ${targetSec}s`
                  : distanceMode
                    ? logTimeForDistance
                      ? `Set ${setIndex}, use stopwatch to log time (${formatDurationSeconds(targetSec)} goal)`
                      : `Set ${setIndex}, tap to log ${formatDistanceAmount(effectiveTargetDist, dUnit)}`
                    : `Set ${setIndex}, tap to log ${item.targetReps} reps`
                : `Set ${setIndex} locked`
            }
            onClick={() => {
              if (!isNextSlot) return;
              runAction(() =>
                actionFillSetSlot(sessionId, item.exercise.id, setIndex)
              );
            }}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full font-semibold transition-transform touch-manipulation",
              timeMode || distanceMode
                ? "min-h-14 min-w-[4.5rem] px-2 text-base md:min-h-[3.25rem] md:min-w-[3.25rem] md:px-1.5 md:text-sm"
                : repCircle,
              isNextSlot
                ? "bg-muted text-muted-foreground border-primary/35 hover:border-primary/55 border-2 border-dashed shadow-inner hover:bg-muted/80 active:scale-95"
                : "bg-muted/40 text-muted-foreground/45 cursor-not-allowed border border-border/40"
            )}
          >
            {emptyLabel}
          </button>
        );
      })}
    </div>
  );
}

function SessionExerciseTargets({
  sessionId,
  exerciseId,
  timeMode,
  distanceMode,
  logTimeForDistanceSets,
  trackWeight,
  sessionLoad,
  holdSec,
  targetDist,
  dUnit,
  weightUnit,
  pending,
  runAction,
}: {
  sessionId: string;
  exerciseId: string;
  timeMode: boolean;
  distanceMode: boolean;
  logTimeForDistanceSets: boolean;
  trackWeight: boolean;
  sessionLoad: number;
  holdSec: number;
  targetDist: number;
  dUnit: DistanceUnit;
  weightUnit: WeightUnit;
  pending: boolean;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const loadAtMin = sessionLoad <= 0;
  const holdAtMin = holdSec <= 1;
  const distAtMin = targetDist <= minPositiveDistance(dUnit) + 1e-9;
  const unitLabel = weightUnit;
  const showDistanceGoal =
    distanceMode && !logTimeForDistanceSets;
  const showDurationGoalForDistance =
    distanceMode && logTimeForDistanceSets;

  return (
    <div className="flex flex-col gap-4">
      {timeMode ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Hold this session
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending || holdAtMin}
              aria-label="Decrease target hold time"
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseDuration(
                    sessionId,
                    exerciseId,
                    "down"
                  )
                )
              }
            >
              <Minus className="size-5" aria-hidden />
            </Button>
            <span className="text-foreground min-w-[3.25rem] text-center text-base font-semibold tabular-nums">
              {formatDurationSeconds(holdSec)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending}
              aria-label="Increase target hold time"
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseDuration(
                    sessionId,
                    exerciseId,
                    "up"
                  )
                )
              }
            >
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      {showDurationGoalForDistance ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Goal time this session
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending || holdAtMin}
              aria-label="Decrease goal time"
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseDuration(
                    sessionId,
                    exerciseId,
                    "down"
                  )
                )
              }
            >
              <Minus className="size-5" aria-hidden />
            </Button>
            <span className="text-foreground min-w-[3.25rem] text-center text-base font-semibold tabular-nums">
              {formatDurationSeconds(holdSec)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending}
              aria-label="Increase goal time"
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseDuration(
                    sessionId,
                    exerciseId,
                    "up"
                  )
                )
              }
            >
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      {showDistanceGoal ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Distance this session
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending || distAtMin}
              aria-label="Decrease target distance"
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseTargetDistance(
                    sessionId,
                    exerciseId,
                    "down"
                  )
                )
              }
            >
              <Minus className="size-5" aria-hidden />
            </Button>
            <span className="text-foreground min-w-[4.5rem] text-center text-base font-semibold tabular-nums">
              {formatDistanceAmount(targetDist, dUnit)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending}
              aria-label="Increase target distance"
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseTargetDistance(
                    sessionId,
                    exerciseId,
                    "up"
                  )
                )
              }
            >
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      {trackWeight ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {timeMode || distanceMode
              ? "Load this session"
              : "Weight this session"}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending || loadAtMin}
              aria-label={`Decrease session working weight (${unitLabel})`}
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseWeight(
                    sessionId,
                    exerciseId,
                    "down"
                  )
                )
              }
            >
              <Minus className="size-5" aria-hidden />
            </Button>
            <span className="text-foreground min-w-[4.5rem] text-center text-base font-semibold tabular-nums">
              {formatLoadNumber(sessionLoad)}{" "}
              <span className="text-muted-foreground text-sm font-medium">
                {unitLabel}
              </span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 touch-manipulation"
              disabled={pending}
              aria-label={`Increase session working weight (${unitLabel})`}
              onClick={() =>
                runAction(() =>
                  actionAdjustSessionExerciseWeight(sessionId, exerciseId, "up")
                )
              }
            >
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SessionTargetsAccordion({
  exerciseName,
  targetLabel,
  defaultWeight,
  weightUnit,
  trackWeight,
  sessionId,
  exerciseId,
  timeMode,
  distanceMode,
  logTimeForDistanceSets,
  sessionLoad,
  holdSec,
  targetDist,
  dUnit,
  pending,
  runAction,
}: {
  exerciseName: string;
  targetLabel: string;
  defaultWeight: number | null;
  weightUnit: WeightUnit;
  trackWeight: boolean;
  sessionId: string;
  exerciseId: string;
  timeMode: boolean;
  distanceMode: boolean;
  logTimeForDistanceSets: boolean;
  sessionLoad: number;
  holdSec: number;
  targetDist: number;
  dUnit: DistanceUnit;
  pending: boolean;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground font-heading min-w-0 flex-1 text-base font-semibold tracking-tight">
          {exerciseName}
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "text-muted-foreground hover:text-foreground/90 inline-flex shrink-0 items-center gap-1 rounded-md py-0.5 text-sm tabular-nums outline-none touch-manipulation",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            open && "text-foreground"
          )}
        >
          <span className="min-w-0 text-right leading-snug">
            <span>{targetLabel}</span>
            {trackWeight &&
            defaultWeight != null &&
            Number.isFinite(defaultWeight) ? (
              <span className="text-muted-foreground/90">
                {" "}
                · {formatLoadNumber(defaultWeight)} {weightUnit}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 opacity-80 transition-transform duration-200",
              open && "-rotate-180"
            )}
            aria-hidden
          />
        </button>
      </div>
      {open ? (
        <div className="border-border/70 mt-3 border-t border-dashed pt-3">
          <SessionExerciseTargets
            sessionId={sessionId}
            exerciseId={exerciseId}
            timeMode={timeMode}
            distanceMode={distanceMode}
            logTimeForDistanceSets={logTimeForDistanceSets}
            trackWeight={trackWeight}
            sessionLoad={sessionLoad}
            holdSec={holdSec}
            targetDist={targetDist}
            dUnit={dUnit}
            weightUnit={weightUnit}
            pending={pending}
            runAction={runAction}
          />
        </div>
      ) : null}
    </>
  );
}

export function WorkoutSessionBoard({
  sessionId,
  items,
  sets,
  exercisePrefs,
}: {
  sessionId: string;
  items: TemplateItem[];
  sets: SetRow[];
  exercisePrefs: ExercisePrefRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<TabKey>("workout");

  const ordered = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );

  const byExercise = useMemo(() => {
    const m = new Map<string, SetRow[]>();
    for (const s of sets) {
      const list = m.get(s.exerciseId) ?? [];
      list.push(s);
      m.set(s.exerciseId, list);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.setIndex - b.setIndex);
    }
    return m;
  }, [sets]);

  const prefByExercise = useMemo(() => {
    const m = new Map<string, ExercisePrefRow>();
    for (const p of exercisePrefs) {
      m.set(p.exerciseId, p);
    }
    return m;
  }, [exercisePrefs]);

  function runAction(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }

  return (
    <div
      className={cn(
        "-mx-5 rounded-none border border-border bg-card/90 px-4 pb-6 pt-4 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm md:mx-0 md:rounded-2xl",
        "from-primary/[0.07] bg-gradient-to-b to-transparent"
      )}
    >
      <div className="bg-muted/80 mb-5 flex rounded-xl p-1 ring-1 ring-border/60 md:mb-6">
        <button
          type="button"
          onClick={() => setTab("workout")}
          className={cn(
            "min-h-12 flex-1 touch-manipulation rounded-lg py-2.5 text-sm font-semibold transition-all md:min-h-11 md:py-2",
            tab === "workout"
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          Workout
        </button>
        <button
          type="button"
          onClick={() => setTab("warmup")}
          className={cn(
            "min-h-12 flex-1 touch-manipulation rounded-lg py-2.5 text-sm font-semibold transition-all md:min-h-11 md:py-2",
            tab === "warmup"
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/70"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          Warmup
        </button>
      </div>

      {tab === "warmup" ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No warmup lifts in this template.
        </p>
      ) : (
        <ul className="space-y-5 md:space-y-8">
          {ordered.map((item) => {
            const exSets = byExercise.get(item.exercise.id) ?? [];
            const pref = prefByExercise.get(item.exercise.id) ?? null;
            const lk = parseExerciseLogKind(item.exercise.logKind);
            const timeMode = lk === "time";
            const distanceMode = lk === "distance";
            const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
            const effectiveTargetSec =
              effectiveTargetDurationSecForSession(pref, item);
            const effectiveTargetDist =
              effectiveTargetDistanceForSession(pref, item);
            const sessionLoad = baseWeightForSessionAdjust(
              pref,
              item.defaultWeight,
              exSets.map((s) => ({ setIndex: s.setIndex, weight: s.weight }))
            );
            const targetLabel = timeMode
              ? `${item.targetSets}×${formatDurationSeconds(effectiveTargetSec)}`
              : distanceMode
                ? item.logTimeForDistanceSets
                  ? `${item.targetSets}×${formatDurationSeconds(effectiveTargetSec)}`
                  : `${item.targetSets}×${formatDistanceAmount(effectiveTargetDist, dUnit)}`
                : `${item.targetSets}×${item.targetReps ?? "—"}`;
            const wUnit = resolveTemplateItemWeightUnit({
              weightUnit: item.weightUnit,
              exercise: { weightUnit: item.exercise.weightUnit },
            });

            return (
              <li key={item.exercise.id}>
                <div className="border-border bg-muted/15 ring-foreground/5 rounded-xl border px-3 py-4 ring-1">
                  <SessionTargetsAccordion
                    exerciseName={item.exercise.name}
                    targetLabel={targetLabel}
                    defaultWeight={item.defaultWeight}
                    weightUnit={wUnit}
                    trackWeight={item.trackWeight}
                    sessionId={sessionId}
                    exerciseId={item.exercise.id}
                    timeMode={timeMode}
                    distanceMode={distanceMode}
                    logTimeForDistanceSets={item.logTimeForDistanceSets}
                    sessionLoad={sessionLoad}
                    holdSec={effectiveTargetSec}
                    targetDist={effectiveTargetDist}
                    dUnit={dUnit}
                    pending={pending}
                    runAction={runAction}
                  />
                  <div className="mt-4">
                    <ExerciseSetButtons
                      sessionId={sessionId}
                      item={item}
                      exSets={exSets}
                      effectiveTargetSec={effectiveTargetSec}
                      effectiveTargetDist={effectiveTargetDist}
                      dUnit={dUnit}
                      pending={pending}
                      runAction={runAction}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
