import {
  Beef,
  Droplets,
  Flame,
  type LucideIcon,
  Trash2,
  Wheat,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import { softDeleteLocal } from "@/lib/client/db/writes";
import { DAILY_FOOD_LOG_MEAL_NAME } from "@/lib/nutrition-constants";
import type { Meal, MealEntry } from "@/lib/stores";
import { cn } from "@/lib/utils";

const MACRO_BADGE: Record<"p" | "c" | "f", string> = {
  p: "border-chart-1/30 bg-chart-1/12 text-chart-1",
  c: "border-chart-4/30 bg-chart-4/12 text-chart-4",
  f: "border-chart-3/30 bg-chart-3/12 text-chart-3",
};

const MACRO_ICON: Record<"p" | "c" | "f", LucideIcon> = {
  p: Beef,
  c: Wheat,
  f: Droplets,
};

function MacroBadge({
  kind,
  value,
}: {
  kind: "p" | "c" | "f";
  value: string;
}) {
  const letter = kind === "p" ? "P" : kind === "c" ? "C" : "F";
  const Icon = MACRO_ICON[kind];
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 tabular-nums gap-0.5 px-1.5 font-medium",
        MACRO_BADGE[kind]
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {letter}
      {value}
    </Badge>
  );
}

export function FoodLogList({ meals }: { meals: Meal[] }) {
  const { db } = useDb();
  const [removeEntryId, setRemoveEntryId] = useState<string | null>(null);

  const mealIds = meals.map((m) => m.id).join(",");
  const { data: rows } = useLiveArray<{ meal: Meal; entry: MealEntry }>(
    async () => {
      if (!db) return [];
      const out: { meal: Meal; entry: MealEntry }[] = [];
      for (const meal of meals) {
        const entries = (await db.mealEntries
          .where("mealId")
          .equals(meal.id)
          .toArray()) as unknown as MealEntry[];
        for (const entry of entries) {
          if (entry.deletedAt !== null) continue;
          out.push({ meal, entry });
        }
      }
      return out;
    },
    [db, mealIds]
  );

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing logged for this day yet.
      </p>
    );
  }

  async function remove(entryId: string) {
    if (!db) return;
    try {
      await softDeleteLocal(db.mealEntries, entryId);
    } catch {
      toast.error("Could not remove entry");
    }
  }

  return (
    <>
      <ConfirmDialog
        open={removeEntryId != null}
        onOpenChange={(open) => {
          if (!open) setRemoveEntryId(null);
        }}
        title="Remove entry?"
        description="This food log line will be removed for this day."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!removeEntryId) return;
          const id = removeEntryId;
          setRemoveEntryId(null);
          await remove(id);
        }}
      />
    <ul className="space-y-2">
      {rows.map(({ meal, entry }) => {
        const isAdHocBucket =
          meal.name === DAILY_FOOD_LOG_MEAL_NAME &&
          meal.sourceLibraryItemId == null;
        return (
          <li
            key={entry.id}
            className="bg-card border-primary/10 flex items-start justify-between gap-3 rounded-xl border px-3 py-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              {!isAdHocBucket ? (
                <p className="text-muted-foreground text-xs font-medium">
                  {meal.name}
                </p>
              ) : null}
              <p className="font-medium leading-snug">
                {entry.description.trim() || "Food"}{" "}
                <span className="text-muted-foreground inline-flex items-center gap-0.5 text-sm font-normal tabular-nums">
                  <Flame
                    className="text-chart-2 size-3.5 shrink-0"
                    aria-hidden
                  />
                  {Math.round(entry.calories)} kcal
                </span>
              </p>
              <span className="mt-1 inline-flex flex-wrap items-center gap-1">
                <MacroBadge kind="p" value={entry.proteinG.toFixed(0)} />
                <MacroBadge kind="c" value={entry.carbsG.toFixed(0)} />
                <MacroBadge kind="f" value={entry.fatG.toFixed(0)} />
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRemoveEntryId(entry.id)}
              className="text-destructive hover:text-destructive min-h-11 shrink-0 touch-manipulation gap-1.5"
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="hidden md:inline">Remove</span>
              <span className="sr-only md:hidden">Remove entry</span>
            </Button>
          </li>
        );
      })}
    </ul>
    </>
  );
}
