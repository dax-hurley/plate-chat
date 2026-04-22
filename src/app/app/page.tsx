import Link from "next/link";
import { Activity, CalendarDays, Dumbbell, Salad, UserRound } from "lucide-react";

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
import { formatDayKey } from "@/lib/date-key";
import { getDailyTotals } from "@/lib/services/nutrition";
import {
  getActiveSession,
  listRecentSessions,
  listTemplates,
} from "@/lib/services/workouts";
import { cn } from "@/lib/utils";

function formatStartedLabel(when: Date | string): string {
  const d = typeof when === "string" ? new Date(when) : when;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  const today = formatDayKey(new Date());

  const [activeSession, templates, recent, todayTotals] = await Promise.all([
    getActiveSession(userId),
    listTemplates(userId),
    listRecentSessions(userId, 5),
    getDailyTotals(userId, today),
  ]);

  const completedRecent = recent.filter((s) => s.status === "completed");

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
              {activeSession.template?.name ?? "Workout"} · started{" "}
              {formatStartedLabel(activeSession.startedAt as Date)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href={`/app/workouts/session/${activeSession.id}`}
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
          href="/app/nutrition"
          className="border-primary/15 bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-2">
            <Salad className="text-primary size-5" aria-hidden />
            <span className="text-sm font-medium">Nutrition</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {Math.round(todayTotals.calories)}
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              kcal
            </span>
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            P {Math.round(todayTotals.proteinG)}g · C{" "}
            {Math.round(todayTotals.carbsG)}g · F {Math.round(todayTotals.fatG)}g
          </p>
        </Link>
        <Link
          href="/app/progress"
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
          href="/app/workouts/calendar"
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
              href="/app/workouts"
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
            href="/app/workouts/new"
            className={cn(
              buttonVariants(),
              "mt-4 inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 text-base"
            )}
          >
            Create your first workout
          </Link>
        </section>
      )}

      {completedRecent.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent workouts
          </h2>
          <ul className="space-y-2">
            {completedRecent.map((s) => (
              <li
                key={s.id}
                className="border-primary/15 bg-card flex items-center justify-between gap-3 rounded-xl border p-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-snug">
                    {s.template?.name ?? "Workout"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatStartedLabel(s.startedAt as Date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex items-center justify-between gap-3 pt-2">
        <Link
          href="/app/profile"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <UserRound className="size-4" aria-hidden />
          Profile &amp; settings
        </Link>
      </section>
    </div>
  );
}
