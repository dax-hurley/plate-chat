import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Dumbbell } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth-user";
import { getSession } from "@/lib/services/workouts";
import { cn } from "@/lib/utils";

import { WorkoutElapsedTimer } from "./workout-elapsed-timer";
import { WorkoutSessionBoard } from "./workout-session-board";
import { WorkoutSessionFooter } from "./workout-session-footer";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const userId = await requireUserId();
  const session = await getSession(userId, sessionId);
  if (!session || !session.template) notFound();

  if (session.status !== "active") {
    redirect("/app/workouts");
  }

  const startedAtMs =
    session.startedAt != null
      ? new Date(session.startedAt as Date).getTime()
      : Date.now();
  const initialElapsedSec = Math.max(
    0,
    Math.floor((Date.now() - startedAtMs) / 1000)
  );

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-48 md:pb-32">
      <div className="flex items-start justify-between gap-3">
        <Link
          href="/app/workouts"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "min-h-11 -ml-2 gap-2"
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Exit
        </Link>
        <WorkoutElapsedTimer
          startedAtMs={startedAtMs}
          initialElapsedSec={initialElapsedSec}
        />
      </div>

      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <Dumbbell className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          {session.template.name}
        </h1>
      </div>

      <WorkoutSessionBoard
        sessionId={session.id}
        items={session.template.items.map((it) => ({
          order: it.order,
          targetSets: it.targetSets,
          targetReps: it.targetReps,
          targetDurationSec: it.targetDurationSec,
          targetDistance: it.targetDistance,
          logTimeForDistanceSets: it.logTimeForDistanceSets,
          defaultWeight: it.defaultWeight,
          weightUnit: it.weightUnit,
          trackWeight: it.trackWeight,
          exercise: {
            id: it.exercise.id,
            name: it.exercise.name,
            logKind: it.exercise.logKind,
            defaultDurationSec: it.exercise.defaultDurationSec,
            defaultDistance: it.exercise.defaultDistance,
            distanceUnit: it.exercise.distanceUnit,
            weightUnit: it.exercise.weightUnit,
          },
        }))}
        sets={session.sets.map((s) => ({
          exerciseId: s.exerciseId,
          setIndex: s.setIndex,
          reps: s.reps,
          durationSec: s.durationSec,
          distance: s.distance,
          weight: s.weight,
        }))}
        exercisePrefs={(session.exercisePrefs ?? []).map((p) => ({
          exerciseId: p.exerciseId,
          workingWeight: p.workingWeight,
          workingDurationSec: p.workingDurationSec,
          workingDistance: p.workingDistance,
        }))}
      />

      <WorkoutSessionFooter sessionId={session.id} />
    </div>
  );
}
