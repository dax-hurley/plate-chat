import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Salad } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth-user";
import { addDaysKey, formatDayKey, mondayOfWeekContaining } from "@/lib/date-key";
import { getDailyTotals, listMealsForDay } from "@/lib/services/nutrition";
import { getPlanForWeek } from "@/lib/services/meal-plan";
import { cn } from "@/lib/utils";
import type { PlannedSlotQuickAdd } from "@/types/meal-log-plan";

import { FoodLogList } from "./food-log-list";
import { LogFoodForm } from "./log-food-form";

function formatDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map((n) => Number(n));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function dayIndexFromDayKey(weekStart: string, dayKey: string): number {
  const ms = new Date(dayKey).getTime() - new Date(weekStart).getTime();
  return Math.max(0, Math.min(6, Math.round(ms / 86400000)));
}

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const rawDay = typeof sp.day === "string" ? sp.day : formatDayKey(new Date());
  const dayKey = /^\d{4}-\d{2}-\d{2}$/.test(rawDay)
    ? rawDay
    : formatDayKey(new Date());

  const weekStart = mondayOfWeekContaining(dayKey);
  const [meals, totals, plan] = await Promise.all([
    listMealsForDay(userId, dayKey),
    getDailyTotals(userId, dayKey),
    getPlanForWeek(userId, weekStart),
  ]);

  const dayIdx = dayIndexFromDayKey(weekStart, dayKey);
  const plannedSlotsForDay: PlannedSlotQuickAdd[] = (plan?.slots ?? [])
    .filter((s) => s.dayIndex === dayIdx && s.libraryItem != null)
    .map((s) => ({
      slotId: s.id,
      label: s.label,
      slotIndex: s.slotIndex,
      libraryItem: {
        id: s.libraryItem!.id,
        name: s.libraryItem!.name,
        calories: s.libraryItem!.calories,
        proteinG: s.libraryItem!.proteinG,
        carbsG: s.libraryItem!.carbsG,
        fatG: s.libraryItem!.fatG,
      },
    }));

  const hasPlannedLibraryMealsThisWeek = (plan?.slots ?? []).some(
    (s) => s.libraryItem != null
  );

  const loggedLibraryItemIds = meals
    .map((m) => m.sourceLibraryItemId)
    .filter((v): v is string => typeof v === "string");

  const prevDay = addDaysKey(dayKey, -1);
  const nextDay = addDaysKey(dayKey, 1);
  const today = formatDayKey(new Date());

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
        <Link
          href={`/app/nutrition?day=${encodeURIComponent(prevDay)}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-primary/20 min-h-11 gap-1.5"
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">{formatDayLabel(dayKey)}</p>
          {dayKey !== today ? (
            <Link
              href="/app/nutrition"
              className="text-primary text-xs font-medium underline-offset-4 hover:underline"
            >
              Jump to today
            </Link>
          ) : null}
        </div>
        <Link
          href={`/app/nutrition?day=${encodeURIComponent(nextDay)}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-primary/20 min-h-11 gap-1.5"
          )}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      <section className="border-primary/15 bg-card rounded-xl border p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Flame className="text-chart-2 size-5" aria-hidden />
          <h2 className="text-lg font-semibold">Day totals</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Calories
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {Math.round(totals.calories)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Protein
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {Math.round(totals.proteinG)}
              <span className="text-muted-foreground ml-0.5 text-sm">g</span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Carbs
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {Math.round(totals.carbsG)}
              <span className="text-muted-foreground ml-0.5 text-sm">g</span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Fat
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {Math.round(totals.fatG)}
              <span className="text-muted-foreground ml-0.5 text-sm">g</span>
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,22rem)] md:items-start">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Today&apos;s log</h2>
          <FoodLogList meals={meals} />
        </section>
        <LogFoodForm
          dayKey={dayKey}
          defaultTab={hasPlannedLibraryMealsThisWeek ? "plan" : "manual"}
          hasPlannedLibraryMealsThisWeek={hasPlannedLibraryMealsThisWeek}
          plannedSlotsForDay={plannedSlotsForDay}
          mealPlanWeekStart={weekStart}
          loggedLibraryItemIds={loggedLibraryItemIds}
        />
      </div>
    </div>
  );
}
