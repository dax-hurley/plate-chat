import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Trash2,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useScheduledItems,
  useScheduleMutations,
} from "@/lib/stores";
import { useWorkoutTemplates } from "@/lib/stores";
import {
  calendarMonthGrid,
  formatDayKey,
  formatMonthKey,
  monthDayKeyRange,
  nextMonthKey,
  parseMonthKey,
  prevMonthKey,
} from "@/lib/date-key";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/workouts/calendar")({
  component: WorkoutCalendar,
});

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthDisplayLabel(monthKey: string): string {
  const p = parseMonthKey(monthKey);
  if (!p) return monthKey;
  return new Date(p.year, p.month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function WorkoutCalendar() {
  const [monthKey, setMonthKey] = useState(() => formatMonthKey());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const weeks = useMemo(() => calendarMonthGrid(monthKey), [monthKey]);
  const range = useMemo(() => monthDayKeyRange(monthKey), [monthKey]);

  const { data: scheduled } = useScheduledItems(
    range?.first ?? formatDayKey(),
    range?.last ?? formatDayKey()
  );
  const { data: templates } = useWorkoutTemplates();
  const { scheduleTemplate, unschedule } = useScheduleMutations();

  const templateMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of templates) m.set(t.id, t.name);
    return m;
  }, [templates]);

  const byDay = useMemo(() => {
    const m = new Map<string, typeof scheduled>();
    for (const s of scheduled) {
      const arr = m.get(s.dayKey) ?? [];
      arr.push(s);
      m.set(s.dayKey, arr);
    }
    return m;
  }, [scheduled]);

  const today = formatDayKey();
  const effectiveDay = selectedDay ?? today;

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 sm:max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
              <CalendarDays
                className="size-5"
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
            Calendar
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Schedule workouts and review what you&apos;ve planned this month.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-primary/20 min-h-11 gap-1.5"
          onClick={() => setMonthKey(prevMonthKey(monthKey))}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </Button>
        <p className="text-sm font-medium">{monthDisplayLabel(monthKey)}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-primary/20 min-h-11 gap-1.5"
          onClick={() => setMonthKey(nextMonthKey(monthKey))}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs font-medium tracking-wide uppercase text-muted-foreground">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1 text-center">
            {d}
          </div>
        ))}
      </div>

      {weeks ? (
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((cell) => {
            const isToday = cell.dayKey === today;
            const isSelected = cell.dayKey === selectedDay;
            const items = byDay.get(cell.dayKey) ?? [];
            return (
              <button
                key={cell.dayKey}
                type="button"
                onClick={() => setSelectedDay(cell.dayKey)}
                className={cn(
                  "min-h-20 rounded-lg border p-1.5 text-left text-xs shadow-sm transition-colors",
                  "bg-card hover:border-primary/40",
                  !cell.inMonth && "opacity-40",
                  isToday && "border-primary ring-1 ring-primary/30",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    isToday && "text-primary"
                  )}
                >
                  {Number(cell.dayKey.slice(-2))}
                </div>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="bg-primary/12 text-primary truncate rounded px-1 py-0.5"
                      title={templateMap.get(s.templateId) ?? "Workout"}
                    >
                      {templateMap.get(s.templateId) ?? "Workout"}
                    </div>
                  ))}
                  {items.length > 3 ? (
                    <div className="text-muted-foreground text-[0.65rem]">
                      +{items.length - 3} more
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <Card className="border-primary/15">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="text-primary size-4" aria-hidden />
                {effectiveDay}
              </CardTitle>
              <CardDescription>Manage this day&apos;s plan.</CardDescription>
            </div>
            {selectedDay && selectedDay !== today ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDay(null)}
              >
                Jump to today
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <ul className="space-y-2">
            {(byDay.get(effectiveDay) ?? []).map((s) => (
              <li
                key={s.id}
                className="border-primary/15 bg-card flex items-center justify-between gap-2 rounded-lg border p-2"
              >
                <Link
                  to="/app/workouts/$id"
                  params={{ id: s.templateId }}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                >
                  {templateMap.get(s.templateId) ?? "Workout"}
                </Link>
                <button
                  type="button"
                  onClick={() => void unschedule(s.id)}
                  className="text-destructive inline-flex items-center gap-1 text-xs hover:underline"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </button>
              </li>
            ))}
            {(byDay.get(effectiveDay) ?? []).length === 0 ? (
              <li className="text-muted-foreground text-sm">
                Nothing scheduled for this day.
              </li>
            ) : null}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const tid = String(fd.get("templateId") ?? "");
              if (!tid) return;
              void scheduleTemplate(tid, effectiveDay);
              e.currentTarget.reset();
            }}
            className="flex gap-2"
          >
            <select
              name="templateId"
              className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
              disabled={templates.length === 0}
            >
              <option value="">
                {templates.length === 0
                  ? "No workouts yet"
                  : "Schedule a workout…"}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
          {templates.length === 0 ? (
            <Link
              to="/app/workouts/new"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full gap-2 text-sm"
              )}
            >
              Create your first workout
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
