"use client";

import type { InferSelectModel } from "drizzle-orm";
import {
  Beef,
  Droplets,
  Flame,
  type LucideIcon,
  Trash2,
  Wheat,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { mealEntries, meals } from "@/db/schema";
import { DAILY_FOOD_LOG_MEAL_NAME } from "@/lib/nutrition-constants";
import { cn } from "@/lib/utils";

import { actionDeleteMealEntry } from "./actions";

type Meal = InferSelectModel<typeof meals> & {
  entries: InferSelectModel<typeof mealEntries>[];
};

type EntryRow = {
  meal: Meal;
  entry: InferSelectModel<typeof mealEntries>;
};

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
  compact,
}: {
  kind: "p" | "c" | "f";
  value: string;
  compact?: boolean;
}) {
  const letter = kind === "p" ? "P" : kind === "c" ? "C" : "F";
  const Icon = MACRO_ICON[kind];
  return (
    <Badge
      variant="outline"
      className={cn("h-5 tabular-nums gap-0.5 px-1.5 font-medium", MACRO_BADGE[kind])}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {compact ? (
        <>
          {letter}
          {value}
        </>
      ) : (
        <>
          {letter} {value}
        </>
      )}
    </Badge>
  );
}

function flattenDayEntries(meals: Meal[]): EntryRow[] {
  const rows: EntryRow[] = [];
  for (const meal of meals) {
    for (const entry of meal.entries) {
      rows.push({ meal, entry });
    }
  }
  return rows;
}

function MealSourceLabel({ meal }: { meal: Meal }) {
  const isAdHocBucket =
    meal.name === DAILY_FOOD_LOG_MEAL_NAME && meal.sourceLibraryItemId == null;
  if (isAdHocBucket) return null;
  return (
    <p className="text-muted-foreground text-xs font-medium">{meal.name}</p>
  );
}

export function FoodLogList({ meals }: { meals: Meal[] }) {
  const rows = flattenDayEntries(meals);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing logged for this day yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map(({ meal, entry }) => (
        <li
          key={entry.id}
          className="bg-card border-primary/10 flex items-start justify-between gap-3 rounded-xl border px-3 py-3 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <MealSourceLabel meal={meal} />
            <p className="font-medium leading-snug">
              {entry.description.trim() || "Food"}{" "}
              <span className="text-muted-foreground inline-flex items-center gap-0.5 text-sm font-normal tabular-nums">
                <Flame className="text-chart-2 size-3.5 shrink-0" aria-hidden />
                {entry.calories} kcal
              </span>
            </p>
            <span className="mt-1 inline-flex flex-wrap items-center gap-1">
              <MacroBadge kind="p" value={entry.proteinG.toFixed(0)} compact />
              <MacroBadge kind="c" value={entry.carbsG.toFixed(0)} compact />
              <MacroBadge kind="f" value={entry.fatG.toFixed(0)} compact />
            </span>
          </div>
          <form action={actionDeleteMealEntry.bind(null, entry.id)}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive min-h-11 shrink-0 touch-manipulation gap-1.5"
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="hidden md:inline">Remove</span>
              <span className="sr-only md:hidden">Remove entry</span>
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
