import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Trash2,
} from "lucide-react";

import { StartWorkoutForm } from "@/app/app/start-workout-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserId } from "@/lib/auth-user";
import {
  addDaysKey,
  calendarMonthGrid,
  formatDayKey,
  formatMonthKey,
  monthDayKeyRange,
  nextMonthKey,
  parseDayKey,
  parseMonthKey,
  prevMonthKey,
} from "@/lib/date-key";
import type { PlannedWorkoutEntry } from "@/lib/services/workouts";
import * as workouts from "@/lib/services/workouts";
import { cn } from "@/lib/utils";

import { CalendarPlanForms } from "./calendar-plan-forms";
import {
  actionDeleteRecurringRule,
  actionDeleteSchedule,
  actionSkipRecurring,
} from "./actions";

function calHref(opts: {
  calView: "month" | "day";
  month?: string;
  day?: string | null;
}) {
  const p = new URLSearchParams();
  p.set("calView", opts.calView);
  if (opts.month) p.set("month", opts.month);
  if (opts.day) p.set("day", opts.day);
  return `/app/workouts/calendar?${p.toString()}`;
}

function plannedByDayMap(planned: PlannedWorkoutEntry[]) {
  const m = new Map<string, PlannedWorkoutEntry[]>();
  for (const p of planned) {
    const list = m.get(p.dayKey) ?? [];
    list.push(p);
    m.set(p.dayKey, list);
  }
  return m;
}

export default async function WorkoutsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    day?: string;
    calView?: string;
  }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const calView = sp.calView === "day" ? "day" : "month";
  const monthRaw = sp.month?.trim();
  const monthKey =
    monthRaw && parseMonthKey(monthRaw)
      ? monthRaw
      : formatMonthKey(new Date());
  const range = monthDayKeyRange(monthKey)!;
  const dayRaw = sp.day?.trim();
  const todayKey = formatDayKey(new Date());
  const parsedDay = dayRaw && parseDayKey(dayRaw) ? dayRaw : null;

  const selectedDay = calView === "month" ? parsedDay : null;
  const dayViewKey = calView === "day" ? (parsedDay ?? todayKey) : null;

  let rangeFrom = range.first;
  let rangeTo = range.last;
  const anchorDay = dayViewKey ?? selectedDay;
  if (anchorDay) {
    if (anchorDay < rangeFrom) rangeFrom = anchorDay;
    if (anchorDay > rangeTo) rangeTo = anchorDay;
  }

  const grid = calendarMonthGrid(monthKey);
  if (!grid) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground text-sm">Invalid month.</p>
      </div>
    );
  }

  const [planned, sessions, templates] = await Promise.all([
    workouts.listPlannedWorkoutsInRange(userId, rangeFrom, rangeTo),
    workouts.listSessionsStartedInDayRange(userId, rangeFrom, rangeTo),
    workouts.listTemplates(userId),
  ]);

  const plannedByDay = plannedByDayMap(planned);
  const sessionsByDay = new Map<string, (typeof sessions)[number][]>();
  for (const s of sessions) {
    const list = sessionsByDay.get(s.dayKey) ?? [];
    list.push(s);
    sessionsByDay.set(s.dayKey, list);
  }

  const monthParts = parseMonthKey(monthKey);
  const monthLabel = monthParts
    ? new Date(monthParts.year, monthParts.month - 1, 1).toLocaleDateString(
        undefined,
        { month: "long", year: "numeric" }
      )
    : monthKey;

  const prev = prevMonthKey(monthKey);
  const next = nextMonthKey(monthKey);

  const detailDay = calView === "day" ? dayViewKey : selectedDay;
  const detailPlanned = detailDay ? (plannedByDay.get(detailDay) ?? []) : [];
  const detailSessions = detailDay ? (sessionsByDay.get(detailDay) ?? []) : [];

  const detailLabel =
    detailDay &&
    parseDayKey(detailDay)?.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const dowForForm =
    detailDay && parseDayKey(detailDay) ? parseDayKey(detailDay)!.getDay() : 1;

  const jumpDay = parsedDay ?? todayKey;
  const jumpMonth = jumpDay.slice(0, 7);

  const dayPrev = detailDay ? addDaysKey(detailDay, -1) : todayKey;
  const dayNext = detailDay ? addDaysKey(detailDay, 1) : todayKey;
  const monthForDayLink = detailDay ? detailDay.slice(0, 7) : monthKey;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span className="bg-secondary text-secondary-foreground ring-secondary/30 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
              <CalendarDays className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            Calendar
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Plan one-off or repeating workouts; switch month or day layout
          </p>
        </div>
        <div className="border-border flex w-full shrink-0 gap-1 rounded-xl border bg-muted/40 p-1 sm:w-auto sm:min-w-[220px]">
          <Link
            href={calHref({
              calView: "month",
              month: monthKey,
              day: selectedDay ?? undefined,
            })}
            className={cn(
              "inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
              calView === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Month
          </Link>
          <Link
            href={calHref({
              calView: "day",
              month: jumpMonth,
              day: jumpDay,
            })}
            className={cn(
              "inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
              calView === "day"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Day
          </Link>
        </div>
      </div>

      {calView === "month" ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <Link
              href={calHref({
                calView: "month",
                month: prev,
                day: selectedDay ?? undefined,
              })}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-primary/20 inline-flex min-h-12 flex-1 items-center justify-center gap-2"
              )}
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              Prev
            </Link>
            <p className="text-foreground flex min-w-0 flex-1 items-center justify-center px-1 text-center text-sm font-semibold">
              <span className="truncate">{monthLabel}</span>
            </p>
            <Link
              href={calHref({
                calView: "month",
                month: next,
                day: selectedDay ?? undefined,
              })}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-primary/20 inline-flex min-h-12 flex-1 items-center justify-center gap-2"
              )}
            >
              Next
              <ChevronRight className="size-4 shrink-0" aria-hidden />
            </Link>
          </div>

          <Card className="border-primary/15 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Month</CardTitle>
              <CardDescription>
                Tap a day to plan workouts or open it in the day layout
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4 sm:px-4">
              <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-0.5 text-center text-[0.65rem] font-medium uppercase sm:text-xs">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-0.5 sm:gap-1">
                {grid.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {week.map((cell) => {
                      const dayPlanned = plannedByDay.get(cell.dayKey) ?? [];
                      const daySess = sessionsByDay.get(cell.dayKey) ?? [];
                      const isToday = cell.dayKey === todayKey;
                      const isSelected = selectedDay === cell.dayKey;
                      const cellMonth = cell.dayKey.slice(0, 7);
                      const href = calHref({
                        calView: "month",
                        month: cellMonth,
                        day: cell.dayKey,
                      });
                      return (
                        <Link
                          key={cell.dayKey}
                          href={href}
                          scroll={false}
                          className={cn(
                            "border-border/80 flex min-h-[4.25rem] flex-col rounded-lg border px-1 py-1.5 transition-colors sm:min-h-[5.5rem] sm:px-2 sm:py-2",
                            cell.inMonth
                              ? "bg-card hover:bg-muted/60"
                              : "bg-muted/25 text-muted-foreground hover:bg-muted/40",
                            isToday &&
                              "ring-primary/40 ring-2 ring-offset-1 ring-offset-background",
                            isSelected && "bg-primary/8 border-primary/35"
                          )}
                        >
                          <span
                            className={cn(
                              "text-[0.7rem] font-semibold tabular-nums sm:text-sm",
                              !cell.inMonth && "opacity-70"
                            )}
                          >
                            {parseDayKey(cell.dayKey)?.getDate()}
                          </span>
                          <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                            {dayPlanned.slice(0, 2).map((p) => (
                              <span
                                key={
                                  p.source === "once"
                                    ? p.scheduleId
                                    : p.instanceKey
                                }
                                className={cn(
                                  "line-clamp-1 rounded px-0.5 text-[0.55rem] font-medium sm:text-[0.65rem]",
                                  p.source === "recurring"
                                    ? "bg-chart-2/15 text-chart-2"
                                    : "bg-primary/12 text-primary"
                                )}
                                title={p.templateName}
                              >
                                {p.templateName}
                              </span>
                            ))}
                            {dayPlanned.length > 2 ? (
                              <span className="text-muted-foreground text-[0.55rem] sm:text-[0.65rem]">
                                +{dayPlanned.length - 2} more
                              </span>
                            ) : null}
                            {daySess.length > 0 ? (
                              <span className="text-muted-foreground flex items-center gap-0.5 text-[0.55rem] sm:text-[0.65rem]">
                                <Dumbbell
                                  className="size-2.5 shrink-0 opacity-70"
                                  aria-hidden
                                />
                                {daySess.length} log{daySess.length === 1 ? "" : "s"}
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <Link
            href={calHref({
              calView: "day",
              month: monthForDayLink,
              day: dayPrev,
            })}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-primary/20 inline-flex min-h-12 flex-1 items-center justify-center gap-2"
            )}
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            Previous day
          </Link>
          <Link
            href={calHref({
              calView: "month",
              month: monthForDayLink,
              day: detailDay ?? undefined,
            })}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-muted-foreground hidden min-h-10 sm:inline-flex"
            )}
          >
            Month
          </Link>
          <Link
            href={calHref({
              calView: "day",
              month: monthForDayLink,
              day: dayNext,
            })}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-primary/20 inline-flex min-h-12 flex-1 items-center justify-center gap-2"
            )}
          >
            Next day
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>
        </div>
      )}

      {calView === "month" && !selectedDay ? (
        <p className="text-muted-foreground text-center text-sm">
          Select a day on the grid to plan workouts, or switch to{" "}
          <Link
            href={calHref({ calView: "day", day: todayKey })}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Day
          </Link>{" "}
          for today&apos;s agenda.
        </p>
      ) : null}

      {detailDay ? (
        <div
          className={cn(
            "grid gap-6",
            calView === "month" ? "lg:grid-cols-2" : "mx-auto max-w-2xl"
          )}
        >
          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-lg">{detailLabel}</CardTitle>
              <CardDescription>Planned workouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailPlanned.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nothing planned.</p>
              ) : (
                <ul className="space-y-3">
                  {detailPlanned.map((p) => (
                    <li
                      key={p.source === "once" ? p.scheduleId : p.instanceKey}
                      className="border-border flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.templateName}</p>
                        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          {p.source === "recurring" ? (
                            <span>
                              Repeats every {p.intervalWeeks === 1 ? "week" : `${p.intervalWeeks} weeks`}
                            </span>
                          ) : null}
                          {p.notes ? <span>{p.notes}</span> : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                        <StartWorkoutForm
                          templateId={p.templateId}
                          name={p.templateName}
                        />
                        {p.source === "once" ? (
                          <form action={actionDeleteSchedule.bind(null, p.scheduleId)}>
                            <button
                              type="submit"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "text-destructive hover:bg-destructive/10 w-full gap-1.5 sm:w-auto"
                              )}
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              Remove
                            </button>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <form
                              action={actionSkipRecurring.bind(
                                null,
                                p.ruleId,
                                p.dayKey
                              )}
                            >
                              <button
                                type="submit"
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "w-full sm:w-auto"
                                )}
                              >
                                Skip this day
                              </button>
                            </form>
                            <form
                              action={actionDeleteRecurringRule.bind(null, p.ruleId)}
                            >
                              <button
                                type="submit"
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                                )}
                              >
                                Stop series
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {templates.length === 0 ? (
                <p className="text-muted-foreground border-t pt-4 text-sm">
                  Create a workout template first from the Workouts tab.
                </p>
              ) : (
                <CalendarPlanForms
                  dayKey={detailDay}
                  dowForForm={dowForForm}
                  templates={templates.map((t) => ({
                    id: t.id,
                    name: t.name,
                  }))}
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-lg">Sessions</CardTitle>
              <CardDescription>Workouts started on this day</CardDescription>
            </CardHeader>
            <CardContent>
              {detailSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sessions logged.</p>
              ) : (
                <ul className="space-y-2">
                  {detailSessions.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/app/workouts/session/${s.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "h-auto min-h-11 w-full justify-between gap-2 px-3 py-2 text-left font-normal"
                        )}
                      >
                        <span className="min-w-0 truncate">
                          <span className="font-medium">
                            {s.template?.name ?? "Custom"}
                          </span>
                          <span className="text-muted-foreground ml-2 text-xs capitalize">
                            {s.status}
                          </span>
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {new Date(s.startedAt).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
