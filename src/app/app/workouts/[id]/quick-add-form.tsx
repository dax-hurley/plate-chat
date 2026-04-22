"use client";

import { useState } from "react";
import { CirclePlus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ExerciseLogKind } from "@/lib/log-kind";

import { actionCreateExerciseForTemplate } from "../actions";

export function QuickAddExerciseForm({
  templateId,
  templateName,
}: {
  templateId: string;
  templateName: string;
}) {
  const [logKind, setLogKind] = useState<ExerciseLogKind>("reps");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi" | "m">("km");
  const [trackLoad, setTrackLoad] = useState(true);
  const [logTimeDist, setLogTimeDist] = useState(false);

  return (
    <form
      action={actionCreateExerciseForTemplate}
      className="bg-card border-primary/15 space-y-4 rounded-xl border p-4 shadow-sm"
    >
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="logKind" value={logKind} />
      <input type="hidden" name="weightUnit" value={weightUnit} />
      <input type="hidden" name="distanceUnit" value={distanceUnit} />
      <input
        type="hidden"
        name="trackWeight"
        value={logKind === "reps" || trackLoad ? "1" : "0"}
      />
      <input
        type="hidden"
        name="logTimeForDistanceSets"
        value={logKind === "distance" && logTimeDist ? "1" : "0"}
      />
      <h2 className="text-foreground flex items-center gap-2 text-lg font-semibold">
        <CirclePlus className="text-primary size-5" aria-hidden />
        Quick add exercise
      </h2>
      <p className="text-muted-foreground text-sm">
        Adds to <span className="text-foreground font-medium">{templateName}</span>{" "}
        and returns you to the workout editor.
      </p>
      <div className="space-y-2">
        <Label htmlFor="qa-name">Name</Label>
        <Input
          id="qa-name"
          name="name"
          required
          placeholder="Squat"
          className="min-h-12 text-base"
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label>Log by</Label>
        <div className="bg-muted/60 grid grid-cols-3 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setLogKind("reps");
              setTrackLoad(true);
            }}
            className={
              logKind === "reps"
                ? "bg-background text-foreground min-h-11 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground min-h-11 rounded-md text-sm font-medium"
            }
          >
            Reps
          </button>
          <button
            type="button"
            onClick={() => {
              setLogKind("time");
              setTrackLoad(false);
            }}
            className={
              logKind === "time"
                ? "bg-background text-foreground min-h-11 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground min-h-11 rounded-md text-sm font-medium"
            }
          >
            Time
          </button>
          <button
            type="button"
            onClick={() => {
              setLogKind("distance");
              setTrackLoad(false);
              setLogTimeDist(false);
            }}
            className={
              logKind === "distance"
                ? "bg-background text-foreground min-h-11 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground min-h-11 rounded-md text-sm font-medium"
            }
          >
            Distance
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          {logKind === "reps"
            ? "Each set logs weight and rep count (strength and hypertrophy work)."
            : logKind === "time"
              ? "Each set logs duration — ideal for cardio machines, intervals, and holds."
              : "Each set logs distance (running, rowing, cycling routes)."}
        </p>
      </div>
      {logKind === "distance" ? (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.06] p-3 dark:bg-emerald-950/25">
          <input
            id="qa-log-time"
            type="checkbox"
            checked={logTimeDist}
            onChange={(e) => setLogTimeDist(e.target.checked)}
            className="border-input text-primary mt-1 size-4 shrink-0 rounded"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="qa-log-time" className="text-foreground font-medium">
              Log time (stopwatch) instead of distance
            </Label>
            <p className="text-muted-foreground text-xs">
              Record each set&apos;s duration from the stopwatch. Good for timed
              intervals and tempo runs.
            </p>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="qa-sets">Sets</Label>
          <Input
            id="qa-sets"
            name="targetSets"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            defaultValue={3}
            className="min-h-12 text-base"
          />
        </div>
        {logKind === "reps" ? (
          <div className="space-y-2">
            <Label htmlFor="qa-reps">Reps</Label>
            <Input
              id="qa-reps"
              name="targetReps"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              defaultValue={5}
              className="min-h-12 text-base"
            />
          </div>
        ) : logKind === "time" ? (
          <div className="space-y-2">
            <Label htmlFor="qa-dur">Seconds / set</Label>
            <Input
              id="qa-dur"
              name="targetDurationSec"
              type="number"
              inputMode="numeric"
              min={1}
              max={36_000}
              defaultValue={120}
              className="min-h-12 text-base"
            />
          </div>
        ) : logTimeDist ? (
          <div className="space-y-2">
            <Label htmlFor="qa-dur-dist">Goal time / set (seconds)</Label>
            <Input
              id="qa-dur-dist"
              name="targetDurationSecForDistance"
              type="number"
              inputMode="numeric"
              min={1}
              max={36_000}
              defaultValue={120}
              className="min-h-12 text-base"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="qa-dist">Distance / set</Label>
            <Input
              id="qa-dist"
              name="targetDistance"
              type="number"
              inputMode="decimal"
              min={0.01}
              step="any"
              defaultValue={distanceUnit === "m" ? 400 : 1}
              className="min-h-12 text-base"
            />
          </div>
        )}
      </div>
      {logKind === "distance" && !logTimeDist ? (
        <div className="space-y-2">
          <Label>Distance unit</Label>
          <div className="bg-muted/60 grid grid-cols-3 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setDistanceUnit("km")}
              className={
                distanceUnit === "km"
                  ? "bg-background text-foreground min-h-11 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                  : "text-muted-foreground min-h-11 rounded-md text-sm font-medium"
              }
            >
              km
            </button>
            <button
              type="button"
              onClick={() => setDistanceUnit("mi")}
              className={
                distanceUnit === "mi"
                  ? "bg-background text-foreground min-h-11 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                  : "text-muted-foreground min-h-11 rounded-md text-sm font-medium"
              }
            >
              mi
            </button>
            <button
              type="button"
              onClick={() => setDistanceUnit("m")}
              className={
                distanceUnit === "m"
                  ? "bg-background text-foreground min-h-11 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                  : "text-muted-foreground min-h-11 rounded-md text-sm font-medium"
              }
            >
              m
            </button>
          </div>
        </div>
      ) : null}
      {logKind !== "reps" ? (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-primary/20 bg-muted/25 p-3">
          <input
            id="qa-track-load"
            type="checkbox"
            checked={trackLoad}
            onChange={(e) => setTrackLoad(e.target.checked)}
            className="border-input text-primary mt-1 size-4 shrink-0 rounded"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="qa-track-load" className="text-foreground font-medium">
              Track load (weight)
            </Label>
            <p className="text-muted-foreground text-xs">
              Enable if you use added resistance (vest, sled, machine stack).
              Off by default for pace and distance work.
            </p>
          </div>
        </div>
      ) : null}
      {(logKind === "reps" || trackLoad) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="qa-weight">Default load (optional)</Label>
            <Input
              id="qa-weight"
              name="defaultWeight"
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder="e.g. 60"
              className="min-h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label>Weight unit</Label>
            <div className="bg-muted/60 flex rounded-lg p-1">
              <button
                type="button"
                onClick={() => setWeightUnit("lb")}
                className={
                  weightUnit === "lb"
                    ? "bg-background text-foreground min-h-11 flex-1 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                    : "text-muted-foreground min-h-11 flex-1 rounded-md text-sm font-medium"
                }
              >
                lb
              </button>
              <button
                type="button"
                onClick={() => setWeightUnit("kg")}
                className={
                  weightUnit === "kg"
                    ? "bg-background text-foreground min-h-11 flex-1 rounded-md text-sm font-semibold shadow-sm ring-1 ring-border/70"
                    : "text-muted-foreground min-h-11 flex-1 rounded-md text-sm font-medium"
                }
              >
                kg
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="qa-muscle">Muscle (optional)</Label>
        <Input
          id="qa-muscle"
          name="muscleGroup"
          placeholder="Legs"
          className="min-h-12 text-base"
        />
      </div>
      <Button type="submit" className="min-h-12 w-full gap-2 text-base shadow-sm">
        <Plus className="size-4" aria-hidden />
        Quick add exercise
      </Button>
    </form>
  );
}
