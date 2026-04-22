import Link from "next/link";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth-user";
import {
  addDaysKey,
  formatDayKey,
  mondayOfWeekContaining,
  parseDayKey,
} from "@/lib/date-key";
import { listLibraryItems } from "@/lib/services/meal-library";
import { getOrCreatePlanForWeek } from "@/lib/services/meal-plan";
import { cn } from "@/lib/utils";

import { AddSlotButton } from "./add-slot-button";
import { PlanSlotSelect } from "./plan-slot-select";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function weekLabel(weekStart: string): string {
  const start = parseDayKey(weekStart);
  const endKey = addDaysKey(weekStart, 6);
  const end = parseDayKey(endKey);
  if (!start || !end) return weekStart;
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

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

  const [plan, libraryItems] = await Promise.all([
    getOrCreatePlanForWeek(userId, weekStart),
    listLibraryItems(userId),
  ]);
  if (!plan) {
    throw new Error("Could not load meal plan");
  }

  const prevWeek = addDaysKey(weekStart, -7);
  const nextWeek = addDaysKey(weekStart, 7);
  const thisWeek = mondayOfWeekContaining(formatDayKey(new Date()));

  const libraryOptions = libraryItems.map((i) => ({ id: i.id, name: i.name }));

  const slotsByDay = new Map<
    number,
    (typeof plan.slots)[number][]
  >();
  for (const slot of plan.slots) {
    const list = slotsByDay.get(slot.dayIndex) ?? [];
    list.push(slot);
    slotsByDay.set(slot.dayIndex, list);
  }
  for (const list of slotsByDay.values()) {
    list.sort((a, b) => a.slotIndex - b.slotIndex);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 md:max-w-7xl">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <CalendarRange className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          Meal plan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Assign meals from your library to each day this week.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/app/nutrition/plan?week=${encodeURIComponent(prevWeek)}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-primary/20 min-h-11 gap-1.5"
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous week
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">{weekLabel(weekStart)}</p>
          {weekStart !== thisWeek ? (
            <Link
              href="/app/nutrition/plan"
              className="text-primary text-xs font-medium underline-offset-4 hover:underline"
            >
              Jump to this week
            </Link>
          ) : null}
        </div>
        <Link
          href={`/app/nutrition/plan?week=${encodeURIComponent(nextWeek)}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-primary/20 min-h-11 gap-1.5"
          )}
        >
          Next week
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      {libraryOptions.length === 0 ? (
        <div className="border-primary/15 bg-card rounded-xl border p-4 text-sm shadow-sm">
          <p className="text-muted-foreground">
            Your meal library is empty. Add meals in{" "}
            <Link
              href="/app/nutrition/library"
              className="text-primary font-medium underline"
            >
              Meal library
            </Link>{" "}
            to assign them here.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAYS_OF_WEEK.map((label, dayIndex) => {
          const slots = slotsByDay.get(dayIndex) ?? [];
          return (
            <section
              key={dayIndex}
              className="border-primary/15 bg-card rounded-xl border p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">{label}</h2>
              <ul className="mt-3 space-y-3">
                {slots.map((slot) => (
                  <li key={slot.id} className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-medium">
                      {slot.label}
                    </p>
                    <PlanSlotSelect
                      slotId={slot.id}
                      currentLibraryItemId={slot.libraryItemId ?? null}
                      libraryOptions={libraryOptions}
                      canRemove={slot.slotKind === "snack"}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <AddSlotButton
                  weekStartDayKey={weekStart}
                  dayIndex={dayIndex}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
