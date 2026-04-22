import type { InferSelectModel } from "drizzle-orm";
import { ClipboardList, Dumbbell } from "lucide-react";

import type { workoutSets } from "@/db/schema";
import { formatDurationSeconds } from "@/lib/format-duration";
import {
  formatDistanceAmount,
  parseDistanceUnit,
} from "@/lib/distance-units";
import {
  formatLoadNumber,
  resolveTemplateItemWeightUnit,
} from "@/lib/weight-units";

type Item = {
  order: number;
  weightUnit: string | null;
  exercise: {
    id: string;
    name: string;
    logKind?: string | null;
    distanceUnit?: string | null;
    weightUnit: string | null;
  };
  targetSets: number;
  targetReps: number | null;
  targetDurationSec: number | null;
  targetDistance: number | null;
};

type SetRow = InferSelectModel<typeof workoutSets>;

export function SessionSetList({
  items,
  sets,
}: {
  items: Item[];
  sets: SetRow[];
}) {
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const byExercise = new Map<string, SetRow[]>();
  for (const s of sets) {
    const list = byExercise.get(s.exerciseId) ?? [];
    list.push(s);
    byExercise.set(s.exerciseId, list);
  }
  for (const list of byExercise.values()) {
    list.sort((a, b) => a.setIndex - b.setIndex);
  }

  if (ordered.length === 0 && sets.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No sets recorded.</p>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-foreground flex items-center gap-2 text-lg font-semibold">
        <ClipboardList className="text-primary size-5" aria-hidden />
        Summary
      </h2>
      {ordered.map((item) => {
        const exSets = byExercise.get(item.exercise.id) ?? [];
        const wUnit = resolveTemplateItemWeightUnit({
          weightUnit: item.weightUnit,
          exercise: { weightUnit: item.exercise.weightUnit },
        });
        const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
        return (
          <div
            key={item.exercise.id}
            className="border-primary/10 rounded-xl border bg-card/60 px-3 py-3"
          >
            <p className="flex items-center gap-2 font-medium">
              <Dumbbell className="text-muted-foreground size-4 shrink-0" aria-hidden />
              {item.exercise.name}
            </p>
            {exSets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sets</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {exSets.map((s) => (
                  <li key={s.id} className="text-sm">
                    Set {s.setIndex}:{" "}
                    {s.durationSec != null
                      ? `${formatDurationSeconds(s.durationSec)}${
                          s.weight
                            ? ` · ${formatLoadNumber(s.weight)} ${wUnit}`
                            : ""
                        }`
                      : s.distance != null
                        ? `${formatDistanceAmount(s.distance, dUnit)}${
                            s.weight
                              ? ` · ${formatLoadNumber(s.weight)} ${wUnit}`
                              : ""
                          }`
                        : `${formatLoadNumber(s.weight)} ${wUnit} × ${s.reps ?? "—"}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
