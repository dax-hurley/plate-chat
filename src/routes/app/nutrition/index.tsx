import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Beef,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flame,
  Salad,
  Wheat,
} from "lucide-react";

import { FoodLogList } from "@/components/nutrition/food-log-list";
import { LogFoodForm } from "@/components/nutrition/log-food-form";
import { buttonVariants } from "@/components/ui/button";
import { addDaysKey, formatDayKey } from "@/lib/date-key";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import { useMealsOnDay } from "@/lib/stores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/nutrition/")({
  component: NutritionLogPage,
});

function formatDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map((n) => Number(n));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function NutritionLogPage() {
  const [dayKey, setDayKey] = useState(() => formatDayKey());
  const { data: meals } = useMealsOnDay(dayKey);
  const { db } = useDb();

  const mealIds = meals.map((m) => m.id).join(",");
  const { data: totalsArr } = useLiveArray<{
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>(
    async () => {
      if (!db || meals.length === 0)
        return [{ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }];
      let calories = 0;
      let proteinG = 0;
      let carbsG = 0;
      let fatG = 0;
      for (const m of meals) {
        const entries = (await db.mealEntries
          .where("mealId")
          .equals(m.id)
          .toArray()) as unknown as Array<{
          calories: number;
          proteinG: number;
          carbsG: number;
          fatG: number;
          deletedAt: number | null;
        }>;
        for (const e of entries) {
          if (e.deletedAt !== null) continue;
          calories += e.calories;
          proteinG += e.proteinG;
          carbsG += e.carbsG;
          fatG += e.fatG;
        }
      }
      return [{ calories, proteinG, carbsG, fatG }];
    },
    [db, mealIds]
  );

  const totals = totalsArr[0] ?? {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };

  const prevDay = useMemo(() => addDaysKey(dayKey, -1), [dayKey]);
  const nextDay = useMemo(() => addDaysKey(dayKey, 1), [dayKey]);
  const today = formatDayKey();

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 md:max-w-7xl">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <Salad className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          Nutrition
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Log meals and track daily macros.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setDayKey(prevDay)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-primary/20 min-h-11 gap-1.5"
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </button>
        <div className="text-center">
          <p className="text-sm font-medium">{formatDayLabel(dayKey)}</p>
          {dayKey !== today ? (
            <button
              type="button"
              onClick={() => setDayKey(today)}
              className="text-primary text-xs font-medium underline-offset-4 hover:underline"
            >
              Jump to today
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setDayKey(nextDay)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-primary/20 min-h-11 gap-1.5"
          )}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <section className="border-primary/15 bg-card rounded-xl border p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Day totals</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border-chart-2/25 bg-chart-2/5 rounded-lg border p-3">
            <p className="text-chart-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Flame className="size-3.5 shrink-0" aria-hidden />
              Calories
            </p>
            <p className="text-chart-2 mt-1 text-2xl font-semibold tabular-nums">
              {Math.round(totals.calories)}
            </p>
            <p className="text-chart-2/80 mt-0.5 text-xs">kcal</p>
          </div>
          <div className="border-chart-1/25 bg-chart-1/5 rounded-lg border p-3">
            <p className="text-chart-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Beef className="size-3.5 shrink-0" aria-hidden />
              Protein
            </p>
            <p className="text-chart-1 mt-1 text-2xl font-semibold tabular-nums">
              {Math.round(totals.proteinG)}
              <span className="text-chart-1/80 ml-0.5 text-sm">g</span>
            </p>
          </div>
          <div className="border-chart-4/25 bg-chart-4/5 rounded-lg border p-3">
            <p className="text-chart-4 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Wheat className="size-3.5 shrink-0" aria-hidden />
              Carbs
            </p>
            <p className="text-chart-4 mt-1 text-2xl font-semibold tabular-nums">
              {Math.round(totals.carbsG)}
              <span className="text-chart-4/80 ml-0.5 text-sm">g</span>
            </p>
          </div>
          <div className="border-chart-3/25 bg-chart-3/5 rounded-lg border p-3">
            <p className="text-chart-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Droplets className="size-3.5 shrink-0" aria-hidden />
              Fat
            </p>
            <p className="text-chart-3 mt-1 text-2xl font-semibold tabular-nums">
              {Math.round(totals.fatG)}
              <span className="text-chart-3/80 ml-0.5 text-sm">g</span>
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,22rem)] md:items-start">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {dayKey === today ? "Today's log" : "Logged"}
          </h2>
          <FoodLogList meals={meals} />
        </section>
        <LogFoodForm dayKey={dayKey} />
      </div>

      <div className="flex justify-end pt-2">
        <Link
          to="/app/nutrition/library"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Manage recipe library →
        </Link>
      </div>
    </div>
  );
}
