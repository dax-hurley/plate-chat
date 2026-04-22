"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Pencil } from "lucide-react";

import { actionUpdateWorkoutExerciseInTemplate } from "@/app/app/workouts/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDistanceAmount,
  minPositiveDistance,
  parseDistanceUnit,
  roundDistance,
} from "@/lib/distance-units";
import { formatDurationSeconds } from "@/lib/format-duration";
import { parseExerciseLogKind } from "@/lib/log-kind";
import { cn } from "@/lib/utils";

export type EditableTemplateItem = {
  id: string;
  order: number;
  targetSets: number;
  targetReps: number | null;
  targetDurationSec: number | null;
  targetDistance: number | null;
  defaultWeight: number | null;
  weightUnit: string | null;
  trackWeight: boolean;
  progressiveOverloadEnabled: boolean;
  progressiveOverloadIncrement: number | null;
  progressiveOverloadRequireFullCompletion: boolean;
  logTimeForDistanceSets: boolean;
  exercise: {
    id: string;
    name: string;
    muscleGroup?: string | null;
    logKind?: string | null;
    userId?: string | null;
    defaultDurationSec?: number | null;
    defaultDistance?: number | null;
    distanceUnit?: string | null;
    weightUnit: string | null;
  };
};

export function TemplateItemEditDialog({
  templateId,
  item,
}: {
  templateId: string;
  item: EditableTemplateItem;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [trackLoad, setTrackLoad] = useState(item.trackWeight);
  const [logTimeDist, setLogTimeDist] = useState(item.logTimeForDistanceSets);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const timeMode = lk === "time";
  const distanceMode = lk === "distance";

  const canEditExercise = item.exercise.userId != null;
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const defaultDuration = Math.max(
    1,
    Math.round(
      item.targetDurationSec ??
        item.exercise.defaultDurationSec ??
        60
    )
  );
  const defaultTargetDist = roundDistance(
    Math.max(
      minPositiveDistance(dUnit),
      Number(
        item.targetDistance ??
          item.exercise.defaultDistance ??
          (dUnit === "m" ? 400 : 1)
      )
    ),
    dUnit
  );
  const templateUnitSelectValue =
    item.weightUnit === "lb" || item.weightUnit === "kg"
      ? item.weightUnit
      : "";
  const exerciseUnit =
    item.exercise.weightUnit === "kg" ? "kg" : "lb";

  const showProgressiveOverloadSection =
    timeMode || distanceMode || (lk === "reps" && trackLoad);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        await actionUpdateWorkoutExerciseInTemplate(fd);
        setOpen(false);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTrackLoad(item.trackWeight);
          setLogTimeDist(item.logTimeForDistanceSets);
        }
      }}
    >
      <DialogTrigger
        type="button"
        disabled={pending}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "min-h-11 shrink-0 touch-manipulation gap-1.5"
        )}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[min(90dvh,36rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit exercise</DialogTitle>
          <DialogDescription>
            {canEditExercise
              ? "Update this lift and how it appears in this workout."
              : "This preset can only be adjusted for sets, reps, time, distance, and default load in this routine."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <input type="hidden" name="templateId" value={templateId} />
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="exerciseId" value={item.exercise.id} />
          <input
            type="hidden"
            name="canEditExercise"
            value={canEditExercise ? "1" : "0"}
          />

          {canEditExercise ? (
            <>
              <div className="space-y-2">
                <Label htmlFor={`ex-name-${item.id}`}>Exercise name</Label>
                <Input
                  id={`ex-name-${item.id}`}
                  name="exerciseName"
                  required
                  defaultValue={item.exercise.name}
                  className="min-h-11 text-base"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`ex-muscle-${item.id}`}>
                  Muscle group (optional)
                </Label>
                <Input
                  id={`ex-muscle-${item.id}`}
                  name="exerciseMuscleGroup"
                  defaultValue={item.exercise.muscleGroup ?? ""}
                  placeholder="Chest, legs…"
                  className="min-h-11 text-base"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`sets-${item.id}`}>Sets</Label>
            <Input
              id={`sets-${item.id}`}
              name="targetSets"
              type="number"
              inputMode="numeric"
              min={1}
              required
              defaultValue={item.targetSets}
              className="min-h-11"
            />
          </div>

          {timeMode ? (
            <div className="space-y-2">
              <Label htmlFor={`dur-${item.id}`}>
                Target duration per set (seconds)
              </Label>
              <Input
                id={`dur-${item.id}`}
                name="targetDurationSec"
                type="number"
                inputMode="numeric"
                min={1}
                required
                defaultValue={defaultDuration}
                className="min-h-11"
              />
              <p className="text-muted-foreground text-xs">
                Shown in the workout as{" "}
                {formatDurationSeconds(defaultDuration)} per set.
              </p>
            </div>
          ) : distanceMode ? (
            <>
              <input
                type="hidden"
                name="logTimeForDistanceSets"
                value={logTimeDist ? "1" : "0"}
              />
              <div className="flex items-start gap-3 rounded-lg border border-dashed border-emerald-500/25 bg-emerald-500/[0.06] p-3 dark:bg-emerald-950/20">
                <input
                  id={`logt-${item.id}`}
                  type="checkbox"
                  checked={logTimeDist}
                  onChange={(e) => setLogTimeDist(e.target.checked)}
                  className="border-input text-primary mt-1 size-4 shrink-0 rounded"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <Label
                    htmlFor={`logt-${item.id}`}
                    className="text-foreground font-medium"
                  >
                    Log time (stopwatch) instead of distance
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Each set records your elapsed time. Use for intervals and
                    pace work where distance isn&apos;t the focus.
                  </p>
                </div>
              </div>
              {logTimeDist ? (
                <div className="space-y-2">
                  <Label htmlFor={`dur-dist-${item.id}`}>
                    Target time per set (seconds)
                  </Label>
                  <Input
                    id={`dur-dist-${item.id}`}
                    name="targetDurationSec"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    defaultValue={defaultDuration}
                    className="min-h-11"
                  />
                  <p className="text-muted-foreground text-xs">
                    Goal pace: {formatDurationSeconds(defaultDuration)} per set
                    (logged time is capped to this goal in the workout).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={`dist-${item.id}`}>
                    Target distance per set ({dUnit})
                  </Label>
                  <Input
                    id={`dist-${item.id}`}
                    name="targetDistance"
                    type="number"
                    inputMode="decimal"
                    min={minPositiveDistance(dUnit)}
                    step="any"
                    required
                    defaultValue={defaultTargetDist}
                    className="min-h-11"
                  />
                  <p className="text-muted-foreground text-xs">
                    Shown in the workout as{" "}
                    {formatDistanceAmount(defaultTargetDist, dUnit)} per set.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={`reps-${item.id}`}>Target reps per set</Label>
              <Input
                id={`reps-${item.id}`}
                name="targetReps"
                type="number"
                inputMode="numeric"
                min={1}
                required
                defaultValue={item.targetReps ?? 5}
                className="min-h-11"
              />
            </div>
          )}

          {lk === "reps" ? (
            <input type="hidden" name="trackWeight" value="1" />
          ) : (
            <>
              <input
                type="hidden"
                name="trackWeight"
                value={trackLoad ? "1" : "0"}
              />
              <div className="flex items-start gap-3 rounded-lg border border-dashed border-primary/20 bg-muted/20 p-3">
                <input
                  id={`track-w-${item.id}`}
                  type="checkbox"
                  checked={trackLoad}
                  onChange={(e) => setTrackLoad(e.target.checked)}
                  className="border-input text-primary mt-1 size-4 shrink-0 rounded"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <Label
                    htmlFor={`track-w-${item.id}`}
                    className="text-foreground font-medium"
                  >
                    Track load (weight)
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Turn on for weighted carries, sled pushes, or machines with a
                    load setting. Leave off for pace-only cardio and most
                    distance work.
                  </p>
                </div>
              </div>
            </>
          )}

          {(lk === "reps" || trackLoad) ? (
            <>
              <div className="space-y-2">
                <Label htmlFor={`wt-${item.id}`}>
                  Default load (optional)
                </Label>
                <Input
                  id={`wt-${item.id}`}
                  name="defaultWeight"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="e.g. 135"
                  defaultValue={
                    item.defaultWeight != null &&
                    Number.isFinite(item.defaultWeight)
                      ? String(item.defaultWeight)
                      : ""
                  }
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`twu-${item.id}`}>
                  Weight unit in this workout
                </Label>
                <select
                  id={`twu-${item.id}`}
                  name="templateWeightUnit"
                  defaultValue={templateUnitSelectValue}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-11 w-full rounded-md border px-3 py-2 text-base shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    Same as exercise ({exerciseUnit})
                  </option>
                  <option value="lb">lb (imperial)</option>
                  <option value="kg">kg (metric)</option>
                </select>
                <p className="text-muted-foreground text-xs">
                  Numbers are stored as you enter them; pick the unit they
                  represent.
                </p>
              </div>
            </>
          ) : null}

          {showProgressiveOverloadSection ? (
          <div className="border-border space-y-3 rounded-lg border border-dashed p-3">
            <p className="text-foreground text-sm font-medium">
              Exercise progress
            </p>
            <p className="text-muted-foreground text-xs">
              {lk === "reps" ? (
                <>
                  After you finish a workout, optionally raise this line&apos;s
                  default load automatically.
                </>
              ) : timeMode ? (
                <>
                  After you finish a workout, optionally increase the target hold
                  time for the next session.
                </>
              ) : logTimeDist ? (
                <>
                  After you finish a workout, optionally increase the goal time
                  per set for the next session.
                </>
              ) : (
                <>
                  After you finish a workout, optionally increase the target
                  distance per set for the next session.
                </>
              )}
            </p>
            <div className="flex items-start gap-3">
              <input
                id={`po-en-${item.id}`}
                name="progressiveOverloadEnabled"
                type="checkbox"
                value="1"
                defaultChecked={item.progressiveOverloadEnabled}
                className="border-input text-primary mt-1 size-4 shrink-0 rounded"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`po-en-${item.id}`} className="font-medium">
                  {lk === "reps"
                    ? "Increase default load after each session"
                    : timeMode
                      ? "Increase target hold time after each session"
                      : logTimeDist
                        ? "Increase goal time after each session"
                        : "Increase target distance after each session"}
                </Label>
                <p className="text-muted-foreground text-xs">
                  {lk === "reps" ? (
                    <>
                      Uses the increment below (same unit as your default load).
                    </>
                  ) : timeMode || logTimeDist ? (
                    <>Uses seconds for the increment below.</>
                  ) : (
                    <>
                      Uses the same unit as your distance target ({dUnit}).
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`po-inc-${item.id}`}>
                {lk === "reps"
                  ? "Increment per session (load)"
                  : timeMode || logTimeDist
                    ? "Increment per session (seconds)"
                    : "Increment per session (distance)"}
              </Label>
              <Input
                id={`po-inc-${item.id}`}
                name="progressiveOverloadIncrement"
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                placeholder={
                  lk === "reps"
                    ? "e.g. 2.5"
                    : timeMode || logTimeDist
                      ? "e.g. 5"
                      : dUnit === "m"
                        ? "e.g. 50"
                        : "e.g. 0.1"
                }
                defaultValue={
                  item.progressiveOverloadIncrement != null &&
                  Number.isFinite(item.progressiveOverloadIncrement)
                    ? String(item.progressiveOverloadIncrement)
                    : ""
                }
                className="min-h-11"
              />
            </div>
            <div className="flex items-start gap-3">
              <input
                id={`po-full-${item.id}`}
                name="progressiveOverloadRequireFullCompletion"
                type="checkbox"
                value="1"
                defaultChecked={item.progressiveOverloadRequireFullCompletion}
                className="border-input text-primary mt-1 size-4 shrink-0 rounded"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`po-full-${item.id}`} className="font-medium">
                  Only when every set hits target reps, hold time, or distance
                </Label>
                <p className="text-muted-foreground text-xs">
                  {lk === "reps" ? (
                    <>
                      If you miss reps or stop short, the default load stays put
                      so you can repeat the same target next time.
                    </>
                  ) : (
                    <>
                      If you miss targets, this line keeps the same goal for next
                      time.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          ) : null}

          {canEditExercise ? (
            <div className="space-y-2">
              <Label htmlFor={`ewu-${item.id}`}>Exercise library unit</Label>
              <select
                id={`ewu-${item.id}`}
                name="exerciseWeightUnit"
                defaultValue={exerciseUnit}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-11 w-full rounded-md border px-3 py-2 text-base shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="lb">lb (imperial)</option>
                <option value="kg">kg (metric)</option>
              </select>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="min-h-11">
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
