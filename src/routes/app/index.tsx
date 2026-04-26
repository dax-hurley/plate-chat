import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Salad,
  UserRound,
} from "lucide-react";

import { StartWorkoutForm } from "@/components/app/start-workout-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDayKey } from "@/lib/date-key";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import {
  useActiveSession,
  useLocalSession,
  useMealsOnDay,
  useWorkoutTemplates,
  type WorkoutSession,
} from "@/lib/stores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function formatStartedLabel(when: number): string {
  const d = new Date(when);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function useRecentCompletedSessions(limit = 5) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<WorkoutSession>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.workoutSessions
        .where("[userId+status+startedAt]")
        .between(
          [userId, "completed", 0],
          [userId, "completed", Number.MAX_SAFE_INTEGER]
        )
        .reverse()
        .limit(limit)
        .toArray()) as unknown as WorkoutSession[];
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId, limit]
  );
}

function DashboardPage() {
  const today = formatDayKey();
  const { data: activeSession } = useActiveSession();
  const { data: templates } = useWorkoutTemplates();
  const { data: recent } = useRecentCompletedSessions(5);
  const { data: meals } = useMealsOnDay(today);

  const { db } = useDb();
  const { data: todayTotals } = useLiveArray<{
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
        const entries = await db.mealEntries
          .where("mealId")
          .equals(m.id)
          .toArray();
        for (const e of entries as unknown as Array<{
          calories: number;
          proteinG: number;
          carbsG: number;
          fatG: number;
          deletedAt: number | null;
        }>) {
          if (e.deletedAt !== null) continue;
          calories += e.calories;
          proteinG += e.proteinG;
          carbsG += e.carbsG;
          fatG += e.fatG;
        }
      }
      return [{ calories, proteinG, carbsG, fatG }];
    },
    [db, meals]
  );

  const totals = todayTotals[0] ?? {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };

  const templateMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of templates) m.set(t.id, t.name);
    return m;
  }, [templates]);

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 lg:max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {activeSession ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="text-primary size-5" aria-hidden />
              Workout in progress
            </CardTitle>
            <CardDescription>
              {activeSession.templateId
                ? templateMap.get(activeSession.templateId) ?? "Workout"
                : "Workout"}{" "}
              · started {formatStartedLabel(activeSession.startedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to="/app/workouts/session/$sessionId"
              params={{ sessionId: activeSession.id }}
              className={cn(
                buttonVariants(),
                "inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
              )}
            >
              Resume workout
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/app/nutrition"
          className="border-primary/15 bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-2">
            <Salad className="text-primary size-5" aria-hidden />
            <span className="text-sm font-medium">Nutrition</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {Math.round(totals.calories)}
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              kcal
            </span>
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            P {Math.round(totals.proteinG)}g · C {Math.round(totals.carbsG)}g ·
            F {Math.round(totals.fatG)}g
          </p>
        </Link>
        <Link
          to="/app/progress"
          className="border-primary/15 bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="text-primary size-5" aria-hidden />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Track lifts, weight, and vitals.
          </p>
        </Link>
        <Link
          to="/app/workouts/calendar"
          className="border-primary/15 bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="text-primary size-5" aria-hidden />
            <span className="text-sm font-medium">Calendar</span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Plan and review workout days.
          </p>
        </Link>
      </div>

      {templates.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Start a workout
            </h2>
            <Link
              to="/app/workouts"
              className="text-primary text-sm font-medium underline-offset-4 hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.slice(0, 6).map((t) => (
              <StartWorkoutForm key={t.id} templateId={t.id} name={t.name} />
            ))}
          </div>
        </section>
      ) : (
        <section className="border-primary/15 bg-card rounded-xl border p-6 text-center shadow-sm">
          <p className="text-muted-foreground text-sm">
            You don&apos;t have any saved workouts yet.
          </p>
          <Link
            to="/app/workouts/new"
            className={cn(
              buttonVariants(),
              "mt-4 inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 text-base"
            )}
          >
            Create your first workout
          </Link>
        </section>
      )}

      {recent.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent workouts
          </h2>
          <ul className="space-y-2">
            {recent.map((s) => (
              <li
                key={s.id}
                className="border-primary/15 bg-card flex items-center justify-between gap-3 rounded-xl border p-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-snug">
                    {s.templateId
                      ? templateMap.get(s.templateId) ?? "Workout"
                      : "Workout"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatStartedLabel(s.startedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex items-center justify-between gap-3 pt-2">
        <Link
          to="/app/profile"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <UserRound className="size-4" aria-hidden />
          Profile &amp; settings
        </Link>
      </section>
    </div>
  );
}
