"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatDistanceAmount,
  parseDistanceUnit,
  roundDistance,
} from "@/lib/distance-units";
import { formatDurationSeconds } from "@/lib/format-duration";
import { parseExerciseLogKind } from "@/lib/log-kind";
import {
  formatLoadNumber,
  resolveTemplateItemWeightUnit,
} from "@/lib/weight-units";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { actionAddTemplateItem, actionRemoveTemplateItem } from "../actions";

import {
  TemplateItemEditDialog,
  type EditableTemplateItem,
} from "./template-item-edit-dialog";

type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: string | null;
  isPreset: boolean;
  weightUnit: string | null;
};

function groupedLibrary(exercises: LibraryExercise[]) {
  const presets = exercises.filter((e) => e.isPreset);
  const custom = exercises.filter((e) => !e.isPreset);
  const byMuscle = new Map<string, LibraryExercise[]>();
  for (const e of presets) {
    const key = (e.muscleGroup ?? "Other").trim() || "Other";
    const arr = byMuscle.get(key) ?? [];
    arr.push(e);
    byMuscle.set(key, arr);
  }
  const muscleKeys = [...byMuscle.keys()].sort((a, b) => a.localeCompare(b));
  for (const k of muscleKeys) {
    byMuscle.get(k)!.sort((a, b) => a.name.localeCompare(b.name));
  }
  custom.sort((a, b) => a.name.localeCompare(b.name));
  return { byMuscle, muscleKeys, custom };
}
type Item = EditableTemplateItem;

export function TemplateEditor({
  templateId,
  items,
  exercises,
}: {
  templateId: string;
  items: Item[];
  exercises: LibraryExercise[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { byMuscle, muscleKeys, custom } = groupedLibrary(exercises);

  function onAddFromLibrary(exerciseId: string) {
    if (!exerciseId) return;
    start(async () => {
      await actionAddTemplateItem({ templateId, exerciseId });
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section id="workout-exercises" className="scroll-mt-6 space-y-3">
        <h2 className="text-lg font-medium">Exercises in this workout</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Use quick add above, edit a row with the pencil, or pick from the
            library below.
          </p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, idx) => {
              const lk = parseExerciseLogKind(item.exercise.logKind);
              const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
              const distanceOrTimeSummary =
                lk === "distance"
                  ? item.logTimeForDistanceSets
                    ? formatDurationSeconds(
                        Math.max(
                          1,
                          Math.round(item.targetDurationSec ?? 60)
                        )
                      )
                    : formatDistanceAmount(
                        roundDistance(
                          Number(
                            item.targetDistance ??
                              item.exercise.defaultDistance ??
                              (dUnit === "m" ? 400 : 1)
                          ),
                          dUnit
                        ),
                        dUnit
                      )
                  : "";
              return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {idx + 1}. {item.exercise.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {lk === "time"
                      ? `${item.targetSets}×${formatDurationSeconds(
                          Math.max(
                            1,
                            Math.round(item.targetDurationSec ?? 60)
                          )
                        )}`
                      : lk === "distance"
                        ? `${item.targetSets}×${distanceOrTimeSummary}`
                        : `${item.targetSets}×${item.targetReps ?? "—"}`}
                    {item.trackWeight && item.defaultWeight != null
                      ? ` · ${formatLoadNumber(item.defaultWeight)} ${resolveTemplateItemWeightUnit(
                          {
                            weightUnit: item.weightUnit,
                            exercise: {
                              weightUnit: item.exercise.weightUnit,
                            },
                          }
                        )}`
                      : ""}
                    {item.progressiveOverloadEnabled ? (
                      <span className="text-primary">
                        {" "}
                        · auto
                        {lk === "time" ||
                        (lk === "distance" && item.logTimeForDistanceSets)
                          ? ` +${item.progressiveOverloadIncrement ?? "?"}s`
                          : lk === "distance"
                            ? ` +${item.progressiveOverloadIncrement ?? "?"} ${dUnit}`
                            : ` +${item.progressiveOverloadIncrement ?? "?"}`}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <TemplateItemEditDialog templateId={templateId} item={item} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 shrink-0 touch-manipulation"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await actionRemoveTemplateItem(templateId, item.id);
                        router.refresh();
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
            })}
          </ol>
        )}
      </section>

      {exercises.length > 0 ? (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="text-lg font-medium">Exercise library</h2>
          <p className="text-muted-foreground text-sm">
            Standard lifts plus anything you created. Picks append to the end of
            this workout.
          </p>
          <div className="space-y-2">
            <Label>Add exercise</Label>
            <Select
              disabled={pending}
              onValueChange={(v) => onAddFromLibrary(String(v))}
            >
              <SelectTrigger className="min-h-12 w-full text-base">
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {muscleKeys.map((muscle) => (
                  <SelectGroup key={muscle}>
                    <SelectLabel>{muscle}</SelectLabel>
                    {byMuscle.get(muscle)!.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name}
                        <span className="text-muted-foreground">
                          {" "}
                          · {ex.weightUnit === "kg" ? "kg" : "lb"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                {custom.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>My exercises</SelectLabel>
                    {custom.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name}
                        <span className="text-muted-foreground">
                          {" "}
                          · {ex.weightUnit === "kg" ? "kg" : "lb"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </section>
      ) : null}
    </div>
  );
}
