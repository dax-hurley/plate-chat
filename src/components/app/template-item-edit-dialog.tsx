import { FormEvent, useState } from "react";
import { Pencil } from "lucide-react";

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
import { toast } from "sonner";

import { useWorkoutMutations, type Exercise } from "@/lib/stores";
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
  isWarmup: boolean;
  restBetweenSetsSec: number | null;
  exercise: Pick<
    Exercise,
    | "id"
    | "name"
    | "muscleGroup"
    | "logKind"
    | "userId"
    | "defaultDurationSec"
    | "defaultDistance"
    | "distanceUnit"
    | "weightUnit"
  >;
};

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  const t = String(raw ?? "").trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseRestBetweenSetsSec(
  raw: FormDataEntryValue | null
): number | null {
  const t = String(raw ?? "").trim();
  if (t === "") return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0 || n > 3600) return null;
  return n > 0 ? n : null;
}

export function TemplateItemEditDialog({
  item,
}: {
  item: EditableTemplateItem;
}) {
  const { updateTemplateItem, createExercise } = useWorkoutMutations();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
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
      item.targetDurationSec ?? item.exercise.defaultDurationSec ?? 60
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
  const exerciseUnit = item.exercise.weightUnit === "kg" ? "kg" : "lb";
  const showProgressiveOverloadSection =
    timeMode || distanceMode || (lk === "reps" && trackLoad);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    try {
      const targetSets = Math.max(
        1,
        Math.round(Number(fd.get("targetSets")) || 1)
      );
      const targetReps =
        lk === "reps"
          ? Math.max(1, Math.round(Number(fd.get("targetReps")) || 1))
          : null;
      const targetDurationSec =
        timeMode || (distanceMode && logTimeDist)
          ? Math.max(1, Math.round(Number(fd.get("targetDurationSec")) || 60))
          : null;
      const targetDistance =
        distanceMode && !logTimeDist
          ? roundDistance(
              Math.max(
                minPositiveDistance(dUnit),
                Number(fd.get("targetDistance")) || 0
              ),
              dUnit
            )
          : null;
      const defaultWeight =
        lk === "reps" || trackLoad
          ? parseOptionalNumber(fd.get("defaultWeight"))
          : null;
      const templateWeightUnit = (() => {
        if (!(lk === "reps" || trackLoad)) return null;
        const v = String(fd.get("templateWeightUnit") ?? "");
        return v === "lb" || v === "kg" ? v : null;
      })();
      const progressiveOverloadEnabled =
        showProgressiveOverloadSection &&
        String(fd.get("progressiveOverloadEnabled") ?? "") === "1";
      const progressiveOverloadIncrement = showProgressiveOverloadSection
        ? parseOptionalNumber(fd.get("progressiveOverloadIncrement"))
        : null;
      const progressiveOverloadRequireFullCompletion =
        showProgressiveOverloadSection &&
        String(fd.get("progressiveOverloadRequireFullCompletion") ?? "") ===
          "1";
      const restBetweenSetsSec = parseRestBetweenSetsSec(
        fd.get("restBetweenSetsSec")
      );

      await updateTemplateItem(item.id, {
        targetSets,
        targetReps,
        targetDurationSec,
        targetDistance,
        defaultWeight,
        weightUnit: templateWeightUnit,
        trackWeight: lk === "reps" ? true : trackLoad,
        logTimeForDistanceSets: distanceMode ? logTimeDist : false,
        progressiveOverloadEnabled,
        progressiveOverloadIncrement,
        progressiveOverloadRequireFullCompletion,
        isWarmup: item.isWarmup,
        restBetweenSetsSec,
      });

      if (canEditExercise) {
        const exerciseName = String(fd.get("exerciseName") ?? "").trim();
        const exerciseMuscleGroup = String(
          fd.get("exerciseMuscleGroup") ?? ""
        ).trim();
        const exerciseWeightUnit = String(fd.get("exerciseWeightUnit") ?? "");
        const eu = exerciseWeightUnit === "kg" ? "kg" : "lb";
        await createExercise({
          name: exerciseName || item.exercise.name,
          muscleGroup: exerciseMuscleGroup || item.exercise.muscleGroup || null,
          logKind: (item.exercise.logKind ?? "reps") as Exercise["logKind"],
          defaultDurationSec: item.exercise.defaultDurationSec ?? null,
          defaultDistance: item.exercise.defaultDistance ?? null,
          distanceUnit: item.exercise.distanceUnit ?? "mi",
          weightUnit: eu,
          trackWeight: true,
          isCustom: true,
        });
      }
      setOpen(false);
      toast.success("Exercise saved", { description: "Workout updated." });
    } catch {
      toast.error("Could not save changes");
    } finally {
      setPending(false);
    }
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

          <div className="space-y-2">
            <Label htmlFor={`rest-${item.id}`}>
              Rest after each set (seconds)
            </Label>
            <Input
              id={`rest-${item.id}`}
              name="restBetweenSetsSec"
              type="number"
              inputMode="numeric"
              min={0}
              max={3600}
              defaultValue={
                item.restBetweenSetsSec != null && item.restBetweenSetsSec > 0
                  ? String(item.restBetweenSetsSec)
                  : ""
              }
              placeholder="Blank = no rest timer"
              className="min-h-11"
            />
            <p className="text-muted-foreground text-xs">
              In the live workout, starts after you log a set for this exercise.
            </p>
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

          {lk === "reps" ? null : (
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
          )}

          {lk === "reps" || trackLoad ? (
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
                  <option value="">Same as exercise ({exerciseUnit})</option>
                  <option value="lb">lb (imperial)</option>
                  <option value="kg">kg (metric)</option>
                </select>
              </div>
            </>
          ) : null}

          {showProgressiveOverloadSection ? (
            <div className="border-border space-y-3 rounded-lg border border-dashed p-3">
              <p className="text-foreground text-sm font-medium">
                Exercise progress
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
                  placeholder="e.g. 2.5"
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
                  <Label
                    htmlFor={`po-full-${item.id}`}
                    className="font-medium"
                  >
                    Only when every set hits target reps, hold time, or distance
                  </Label>
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
