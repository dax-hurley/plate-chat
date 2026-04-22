import Link from "next/link";
import { CalendarRange } from "lucide-react";

import { requireUserId } from "@/lib/auth-user";
import { formatDayKey, mondayOfWeekContaining } from "@/lib/date-key";
import { jsonMealPlanBase } from "@/lib/meal-planning-api";
import { listLibraryItems } from "@/lib/services/meal-library";
import { getOrCreatePlanForWeek } from "@/lib/services/meal-plan";
import { cn } from "@/lib/utils";
import type { MealPlanLibraryOption } from "@/types/meal-plan";

import { MealPlanBoard } from "./meal-plan-board";
import { MealPlanShoppingListSection } from "./meal-plan-shopping-list";

export default async function MealPlanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const rawWeek =
    typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)
      ? sp.week
      : mondayOfWeekContaining(formatDayKey(new Date()));
  const weekStart = mondayOfWeekContaining(rawWeek);
  const thisWeek = mondayOfWeekContaining(formatDayKey(new Date()));

  const [plan, libraryItems] = await Promise.all([
    getOrCreatePlanForWeek(userId, weekStart),
    listLibraryItems(userId),
  ]);
  if (!plan) {
    throw new Error("Could not load meal plan");
  }

  const planView = jsonMealPlanBase(plan);
  const libraryOptions: MealPlanLibraryOption[] = libraryItems.map((i) => ({
    id: i.id,
    name: i.name,
  }));

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 md:max-w-5xl">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <CalendarRange className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          Meal plan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Plan the week, tap a meal for details, or use Edit plan to add slots
          and assign recipes.
        </p>
        {weekStart !== thisWeek ? (
          <p className="mt-2 text-sm">
            <Link
              href="/app/nutrition/plan"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Jump to this week
            </Link>
          </p>
        ) : null}
      </div>

      {libraryOptions.length === 0 ? (
        <div
          className={cn(
            "border-primary/15 bg-card text-muted-foreground rounded-xl border p-4 text-sm shadow-sm"
          )}
        >
          Your meal library is empty. Add meals in{" "}
          <Link
            href="/app/nutrition/library"
            className="text-primary font-medium underline"
          >
            Meal library
          </Link>{" "}
          first, then you can assign them here.
        </div>
      ) : null}

      <MealPlanBoard
        weekStartDayKey={weekStart}
        plan={planView}
        libraryOptions={libraryOptions}
      />

      <MealPlanShoppingListSection plan={plan} />
    </div>
  );
}
