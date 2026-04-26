import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Dumbbell } from "lucide-react";

import { WorkoutSessionActionsProvider } from "@/components/app/workout-session/workout-session-actions-context";
import { WorkoutElapsedTimer } from "@/components/app/workout-session/workout-elapsed-timer";
import { WorkoutRestCountdown } from "@/components/app/workout-session/workout-rest-countdown";
import {
  WorkoutSessionBoard,
  type WorkoutSessionBoardTab,
} from "@/components/app/workout-session/workout-session-board";
import { WorkoutSessionFooter } from "@/components/app/workout-session/workout-session-footer";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getWorkoutLiveUi,
  patchWorkoutLiveUi,
  useWorkoutLiveUi,
} from "@/lib/client/workout-live-ui";
import { useDb } from "@/lib/client/db/provider";
import {
  pullSyncCollectionFromScratch,
  pullSyncCollections,
  triggerSync,
} from "@/lib/client/db/sync";
import {
  useExercises,
  useSession,
  useSessionExercisePrefs,
  useSessionSets,
  useTemplateItems,
  useWorkoutTemplate,
  type Exercise,
} from "@/lib/stores";
import { useLocalSession } from "@/lib/stores/session";
import { getNextOpenSetIndex } from "@/lib/workout-session-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/workouts/session/$sessionId")({
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { ready } = useDb();
  const { userId, loading: tokenLoading } = useLocalSession();
  const { data: session, loading: sessionLoading } = useSession(sessionId);
  const { data: template } = useWorkoutTemplate(session?.templateId ?? null);
  const { data: plan, loading: planLoading } = useTemplateItems(
    session?.templateId ?? null
  );
  const { data: sets } = useSessionSets(sessionId);
  const { data: exercisePrefs } = useSessionExercisePrefs(sessionId);
  const { data: exercises, loading: exercisesLoading } = useExercises();
  const liveUi = useWorkoutLiveUi();

  const [boardTab, setBoardTab] = useState<WorkoutSessionBoardTab>("workout");

  const bumpRestTimer = useCallback((restAfterLogSec: number) => {
    const s = Math.max(0, restAfterLogSec);
    patchWorkoutLiveUi({
      restDeadlineMs: s > 0 ? Date.now() + s * 1000 : null,
    });
  }, []);

  const exerciseMap = useMemo(() => {
    const m = new Map<string, Exercise>();
    for (const e of exercises) m.set(e.id, e);
    return m;
  }, [exercises]);

  const boardItems = useMemo(() => {
    return plan
      .map((it) => {
        const ex = exerciseMap.get(it.exerciseId);
        if (!ex) return null;
        return {
          id: it.id,
          order: it.order,
          targetSets: it.targetSets,
          targetReps: it.targetReps,
          targetDurationSec: it.targetDurationSec,
          targetDistance: it.targetDistance,
          logTimeForDistanceSets: it.logTimeForDistanceSets,
          defaultWeight: it.defaultWeight,
          weightUnit: it.weightUnit,
          trackWeight: it.trackWeight,
          isWarmup: Boolean(it.isWarmup),
          restBetweenSetsSec: it.restBetweenSetsSec ?? null,
          exercise: {
            id: ex.id,
            name: ex.name,
            logKind: ex.logKind as string | null,
            defaultDurationSec: ex.defaultDurationSec,
            defaultDistance: ex.defaultDistance,
            distanceUnit: ex.distanceUnit,
            weightUnit: ex.weightUnit,
          },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [plan, exerciseMap]);

  const setRows = useMemo(
    () =>
      sets.map((s) => ({
        exerciseId: s.exerciseId,
        setIndex: s.setIndex,
        reps: s.reps,
        durationSec: s.durationSec,
        distance: s.distance,
        weight: s.weight,
      })),
    [sets]
  );

  const prefRows = useMemo(
    () =>
      exercisePrefs.map((p) => ({
        exerciseId: p.exerciseId,
        workingWeight: p.workingWeight,
        workingDurationSec: p.workingDurationSec,
        workingDistance: p.workingDistance,
      })),
    [exercisePrefs]
  );

  const currentExerciseName = useMemo(() => {
    const ordered = [...boardItems].sort((a, b) => a.order - b.order);
    const list =
      boardTab === "warmup"
        ? ordered.filter((i) => i.isWarmup === true)
        : ordered.filter((i) => i.isWarmup !== true);
    const sorted = [...list].sort((a, b) => a.order - b.order);
    const byExercise = new Map<string, typeof setRows>();
    for (const s of setRows) {
      const arr = byExercise.get(s.exerciseId) ?? [];
      arr.push(s);
      byExercise.set(s.exerciseId, arr);
    }
    for (const arr of byExercise.values()) {
      arr.sort((a, b) => a.setIndex - b.setIndex);
    }
    for (const item of sorted) {
      const exSets = byExercise.get(item.exercise.id) ?? [];
      const next = getNextOpenSetIndex(
        item.targetSets,
        exSets.map((s) => s.setIndex)
      );
      if (next != null) return item.exercise.name;
    }
    return null;
  }, [boardItems, setRows, boardTab]);

  useEffect(() => {
    if (!session || session.status !== "active") return;
    const store = getWorkoutLiveUi();
    if (store.sessionId != null && store.sessionId !== session.id) {
      patchWorkoutLiveUi({
        sessionId: session.id,
        restDeadlineMs: null,
        currentExerciseName: null,
      });
    } else {
      patchWorkoutLiveUi({ sessionId: session.id });
    }
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (!session || session.status !== "active") return;
    patchWorkoutLiveUi({ currentExerciseName });
  }, [session?.id, session?.status, currentExerciseName]);

  useEffect(() => {
    if (session && session.status !== "active" && !sessionLoading) {
      void navigate({ to: "/app/workouts" });
    }
  }, [session, sessionLoading, navigate]);

  const catalogGap =
    Boolean(session?.templateId && userId) &&
    plan.length > 0 &&
    boardItems.length === 0;

  const [catalogSyncPhase, setCatalogSyncPhase] = useState<
    "idle" | "syncing" | "done"
  >("idle");

  const runCatalogPull = useCallback(async () => {
    await pullSyncCollectionFromScratch("exercises");
    await pullSyncCollections(["workoutTemplateItems"]);
    triggerSync();
  }, []);

  useEffect(() => {
    if (!catalogGap) {
      setCatalogSyncPhase("idle");
      return;
    }
    if (!ready) return;
    let cancelled = false;
    setCatalogSyncPhase("syncing");
    void (async () => {
      try {
        await runCatalogPull();
      } finally {
        if (!cancelled) setCatalogSyncPhase("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogGap, ready, runCatalogPull, session?.templateId]);

  const retryCatalogSync = useCallback(() => {
    setCatalogSyncPhase("syncing");
    void (async () => {
      try {
        await runCatalogPull();
      } finally {
        setCatalogSyncPhase("done");
      }
    })();
  }, [runCatalogPull]);

  const boardDataLoading =
    Boolean(session?.templateId) && (planLoading || exercisesLoading);

  const catalogStillLoading = catalogGap && catalogSyncPhase !== "done";

  if (!ready || sessionLoading || tokenLoading || boardDataLoading || catalogStillLoading) {
    return (
      <p className="text-muted-foreground text-center py-10">
        {catalogStillLoading
          ? "Fetching exercise library…"
          : "Loading…"}
      </p>
    );
  }

  if (!session || !session.templateId) {
    return (
      <p className="text-muted-foreground text-center py-10">
        Session not found.
      </p>
    );
  }

  if (session.status !== "active") {
    return (
      <p className="text-muted-foreground text-center py-10">Redirecting…</p>
    );
  }

  const startedAtMs = session.startedAt;
  const initialElapsedSec = Math.max(
    0,
    Math.floor((Date.now() - startedAtMs) / 1000)
  );

  const restDeadlineMs =
    liveUi.sessionId === session.id ? liveUi.restDeadlineMs : null;

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-48 md:pb-32">
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/app/workouts"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "min-h-11 -ml-2 gap-2"
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Exit
        </Link>
        <div className="flex flex-row flex-wrap items-end justify-end gap-x-4 gap-y-1">
          <WorkoutElapsedTimer
            startedAtMs={startedAtMs}
            initialElapsedSec={initialElapsedSec}
          />
          {restDeadlineMs != null ? (
            <WorkoutRestCountdown deadlineMs={restDeadlineMs} />
          ) : null}
        </div>
      </div>

      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <Dumbbell className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          {template?.name ?? "Workout"}
        </h1>
      </div>

      {!userId ? (
        <p className="text-muted-foreground text-center text-sm">
          Sign in to log sets.
        </p>
      ) : (
        <WorkoutSessionActionsProvider>
          {catalogGap ? (
            <div className="space-y-3 rounded-xl border border-border bg-card/80 px-4 py-5 text-center shadow-sm">
              <p className="text-foreground text-sm">
                This workout uses exercises that are not in this browser yet
                (usually the preset library). We tried refreshing from the
                server—if it still fails, check that you are signed in and tap
                retry.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="touch-manipulation"
                disabled={catalogSyncPhase === "syncing"}
                onClick={() => retryCatalogSync()}
              >
                {catalogSyncPhase === "syncing" ? "Syncing…" : "Retry sync"}
              </Button>
            </div>
          ) : (
            <WorkoutSessionBoard
              sessionId={session.id}
              items={boardItems}
              sets={setRows}
              exercisePrefs={prefRows}
              tab={boardTab}
              onTabChange={setBoardTab}
              onSetLogged={bumpRestTimer}
            />
          )}
          <WorkoutSessionFooter sessionId={session.id} />
        </WorkoutSessionActionsProvider>
      )}
    </div>
  );
}
