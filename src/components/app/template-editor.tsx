import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import {
  type ComboboxOption,
  AutocompleteCombobox,
} from "@/components/ui/autocomplete-combobox";
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
  type Exercise,
  type TemplateItem,
  useWorkoutMutations,
} from "@/lib/stores";

import {
  TemplateItemEditDialog,
  type EditableTemplateItem,
} from "./template-item-edit-dialog";

function groupedLibrary(exercises: Exercise[]) {
  const presets = exercises.filter((e) => e.userId == null);
  const custom = exercises.filter((e) => e.userId != null);
  const byMuscle = new Map<string, Exercise[]>();
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

export function TemplateEditor({
  templateId,
  items,
  exercises,
}: {
  templateId: string;
  items: TemplateItem[];
  exercises: Exercise[];
}) {
  const { addTemplateItem, deleteTemplateItem, updateTemplateItem } =
    useWorkoutMutations();
  const [pending, setPending] = useState(false);
  const [removeItemId, setRemoveItemId] = useState<string | null>(null);
  const { byMuscle, muscleKeys, custom } = groupedLibrary(exercises);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );
  const workoutItems = useMemo(
    () => sorted.filter((i) => i.isWarmup !== true),
    [sorted]
  );
  const warmupItems = useMemo(
    () => sorted.filter((i) => i.isWarmup === true),
    [sorted]
  );

  function nextOrderForInsert(excludeItemId?: string) {
    const list = excludeItemId
      ? items.filter((i) => i.id !== excludeItemId)
      : items;
    if (list.length === 0) return 0;
    return Math.max(0, ...list.map((i) => i.order)) + 1;
  }

  const exerciseMap = useMemo(() => {
    const m = new Map<string, Exercise>();
    for (const e of exercises) m.set(e.id, e);
    return m;
  }, [exercises]);

  const comboboxOptions = useMemo((): ComboboxOption[] => {
    const out: ComboboxOption[] = [];
    for (const muscle of muscleKeys) {
      for (const ex of byMuscle.get(muscle)!) {
        out.push({
          value: ex.id,
          label: ex.name,
          group: muscle,
          description: ex.weightUnit === "kg" ? "kg" : "lb",
        });
      }
    }
    for (const ex of custom) {
      out.push({
        value: ex.id,
        label: ex.name,
        group: "My exercises",
        description: ex.weightUnit === "kg" ? "kg" : "lb",
      });
    }
    return out;
  }, [byMuscle, muscleKeys, custom]);

  async function onAddFromLibrary(exerciseId: string, isWarmup: boolean) {
    if (!exerciseId) return;
    setPending(true);
    try {
      const ex = exerciseMap.get(exerciseId);
      const lk = parseExerciseLogKind(ex?.logKind);
      await addTemplateItem({
        templateId,
        exerciseId,
        order: nextOrderForInsert(),
        targetSets: 3,
        targetReps: lk === "reps" ? 8 : null,
        targetDurationSec:
          lk === "time" ? ex?.defaultDurationSec ?? 60 : null,
        targetDistance: lk === "distance" ? ex?.defaultDistance ?? 1 : null,
        defaultWeight: null,
        weightUnit: null,
        trackWeight: ex?.trackWeight ?? true,
        logTimeForDistanceSets: false,
        progressiveOverloadEnabled: false,
        progressiveOverloadIncrement: null,
        progressiveOverloadRequireFullCompletion: false,
        isWarmup,
        restBetweenSetsSec: null,
      });
      toast.success("Exercise added");
    } catch {
      toast.error("Could not add exercise");
    } finally {
      setPending(false);
    }
  }

  async function moveToWarmup(item: TemplateItem) {
    if (item.isWarmup) return;
    setPending(true);
    try {
      await updateTemplateItem(item.id, {
        isWarmup: true,
        order: nextOrderForInsert(item.id),
      });
      toast.success("Moved to warm-up");
    } catch {
      toast.error("Could not move exercise");
    } finally {
      setPending(false);
    }
  }

  async function moveToWorkout(item: TemplateItem) {
    if (!item.isWarmup) return;
    setPending(true);
    try {
      await updateTemplateItem(item.id, {
        isWarmup: false,
        order: nextOrderForInsert(item.id),
      });
      toast.success("Moved to main workout");
    } catch {
      toast.error("Could not move exercise");
    } finally {
      setPending(false);
    }
  }

  function itemRow(
    item: TemplateItem,
    displayIndex: number,
    which: "workout" | "warmup"
  ) {
    const ex = exerciseMap.get(item.exerciseId);
    if (!ex) return null;
    const lk = parseExerciseLogKind(ex.logKind);
    const dUnit = parseDistanceUnit(ex.distanceUnit);
    const distanceOrTimeSummary =
      lk === "distance"
        ? item.logTimeForDistanceSets
          ? formatDurationSeconds(
              Math.max(1, Math.round(item.targetDurationSec ?? 60))
            )
          : formatDistanceAmount(
              roundDistance(
                Number(
                  item.targetDistance ??
                    ex.defaultDistance ??
                    (dUnit === "m" ? 400 : 1)
                ),
                dUnit
              ),
              dUnit
            )
        : "";
    const editableItem: EditableTemplateItem = {
      id: item.id,
      order: item.order,
      targetSets: item.targetSets,
      targetReps: item.targetReps,
      targetDurationSec: item.targetDurationSec,
      targetDistance: item.targetDistance,
      defaultWeight: item.defaultWeight,
      weightUnit: item.weightUnit,
      trackWeight: item.trackWeight,
      progressiveOverloadEnabled: item.progressiveOverloadEnabled,
      progressiveOverloadIncrement: item.progressiveOverloadIncrement,
      progressiveOverloadRequireFullCompletion:
        item.progressiveOverloadRequireFullCompletion,
      logTimeForDistanceSets: item.logTimeForDistanceSets,
      isWarmup: item.isWarmup,
      restBetweenSetsSec: item.restBetweenSetsSec ?? null,
      exercise: ex,
    };
    return (
      <li
        key={item.id}
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {displayIndex + 1}. {ex.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {lk === "time"
              ? `${item.targetSets}×${formatDurationSeconds(
                  Math.max(1, Math.round(item.targetDurationSec ?? 60))
                )}`
              : lk === "distance"
                ? `${item.targetSets}×${distanceOrTimeSummary}`
                : `${item.targetSets}×${item.targetReps ?? "—"}`}
            {item.trackWeight && item.defaultWeight != null
              ? ` · ${formatLoadNumber(
                  item.defaultWeight
                )} ${resolveTemplateItemWeightUnit({
                  weightUnit: item.weightUnit,
                  exercise: { weightUnit: ex.weightUnit },
                })}`
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
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {which === "workout" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 shrink-0 touch-manipulation"
              disabled={pending}
              onClick={() => void moveToWarmup(item)}
            >
              To warm-up
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 shrink-0 touch-manipulation"
              disabled={pending}
              onClick={() => void moveToWorkout(item)}
            >
              To main workout
            </Button>
          )}
          <TemplateItemEditDialog item={editableItem} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 shrink-0 touch-manipulation"
            disabled={pending}
            onClick={() => setRemoveItemId(item.id)}
          >
            Remove
          </Button>
        </div>
      </li>
    );
  }

  const addCombo = (isWarmup: boolean, idSuffix: string) =>
    exercises.length > 0 ? (
      <div className="space-y-2 pt-1">
        <Label htmlFor={`${templateId}-add-${idSuffix}`}>
          {isWarmup ? "Add to warm-up" : "Add to main workout"}
        </Label>
        <AutocompleteCombobox
          id={`${templateId}-add-${idSuffix}`}
          aria-label={isWarmup ? "Add exercise to warm-up" : "Add exercise to main workout"}
          options={comboboxOptions}
          value={null}
          onValueChange={(v) => {
            if (v) void onAddFromLibrary(v, isWarmup);
          }}
          clearAfterSelect
          disabled={pending}
          placeholder="Search exercises…"
          emptyText="No exercises match your search."
          inputClassName="min-h-12 text-base"
        />
      </div>
    ) : null;

  const removeTarget = removeItemId
    ? items.find((i) => i.id === removeItemId)
    : undefined;
  const removeExerciseName = removeTarget
    ? (exerciseMap.get(removeTarget.exerciseId)?.name ?? "Exercise")
    : "";

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={removeItemId != null}
        onOpenChange={(open) => {
          if (!open) setRemoveItemId(null);
        }}
        title="Remove exercise?"
        description={
          removeExerciseName
            ? `${removeExerciseName} will be removed from this workout template.`
            : undefined
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!removeItemId) return;
          const id = removeItemId;
          setRemoveItemId(null);
          try {
            await deleteTemplateItem(id);
            toast.success("Exercise removed");
          } catch {
            toast.error("Could not remove exercise");
          }
        }}
      />
      <div id="workout-exercises" className="scroll-mt-6 space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Main workout</h2>
          {workoutItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {items.length === 0
                ? "Use the field below to add exercises."
                : "No main lifts here yet—add below or move lifts from the warm-up list."}
            </p>
          ) : (
            <ol className="space-y-2">
              {workoutItems.map((item, idx) => itemRow(item, idx, "workout"))}
            </ol>
          )}
          {addCombo(false, "main")}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Warm-up</h2>
          {warmupItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {items.length === 0
                ? "Add warm-up moves below, or add main lifts and use “To warm-up”."
                : "No warm-up lifts yet—add below or use “To warm-up” on a main lift."}
            </p>
          ) : (
            <ol className="space-y-2">
              {warmupItems.map((item, idx) => itemRow(item, idx, "warmup"))}
            </ol>
          )}
          {addCombo(true, "warmup")}
        </section>
      </div>
    </div>
  );
}
