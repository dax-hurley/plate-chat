import { Link } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BrandMark } from "@/components/app/brand-mark";
import { APP_BRAND_NAME } from "@/lib/brand";
import { AppHeaderProfileMenu } from "@/components/app/app-header-profile-menu";
import { WorkoutElapsedTimer } from "@/components/app/workout-session/workout-elapsed-timer";
import { WorkoutRestCountdown } from "@/components/app/workout-session/workout-rest-countdown";
import { AppHeaderThemeMenu } from "@/components/theme-appearance";
import { SimpleTooltip } from "@/components/ui/tooltip";
import {
  clearWorkoutLiveUi,
  useWorkoutLiveUi,
} from "@/lib/client/workout-live-ui";
import { useOnline } from "@/lib/client/use-online";
import { useSyncing } from "@/lib/client/use-syncing";
import { useActiveSession, useLocalSession, useWorkoutTemplate } from "@/lib/stores";
import { cn } from "@/lib/utils";

function AppHeaderWorkoutSubtitle({
  exerciseName,
  restDeadlineMs,
}: {
  exerciseName: string | null;
  restDeadlineMs: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [restDeadlineMs]);

  const remaining =
    restDeadlineMs != null
      ? Math.max(0, Math.ceil((restDeadlineMs - now) / 1000))
      : 0;
  const resting = restDeadlineMs != null && remaining > 0;
  const phase = resting ? "Rest now" : "Working set";

  return (
    <span className="text-muted-foreground block max-w-full truncate text-[0.7rem] leading-tight sm:text-xs">
      {exerciseName ? (
        <>
          <span className="text-foreground/90 font-medium">{exerciseName}</span>
          <span> · {phase}</span>
        </>
      ) : (
        phase
      )}
    </span>
  );
}

function AppHeaderWorkoutTimer({
  startedAtMs,
  initialElapsedSec,
  restDeadlineMs,
}: {
  startedAtMs: number;
  initialElapsedSec: number;
  restDeadlineMs: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (restDeadlineMs == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [restDeadlineMs]);

  const restRemaining =
    restDeadlineMs != null
      ? Math.max(0, Math.ceil((restDeadlineMs - now) / 1000))
      : 0;
  const showRest = restDeadlineMs != null && restRemaining > 0;

  if (showRest && restDeadlineMs != null) {
    return (
      <WorkoutRestCountdown
        variant="compact"
        className="shrink-0"
        deadlineMs={restDeadlineMs}
      />
    );
  }

  return (
    <WorkoutElapsedTimer
      variant="compact"
      className="shrink-0"
      startedAtMs={startedAtMs}
      initialElapsedSec={initialElapsedSec}
    />
  );
}

export function AppHeader() {
  const { tokens } = useLocalSession();
  const online = useOnline();
  const syncing = useSyncing();
  const { data: activeSession, loading: activeSessionLoading } =
    useActiveSession();
  const { data: activeTemplate } = useWorkoutTemplate(
    activeSession?.templateId ?? null
  );
  const liveUi = useWorkoutLiveUi();

  useEffect(() => {
    if (activeSessionLoading) return;
    if (!activeSession) {
      clearWorkoutLiveUi();
    }
  }, [activeSession, activeSessionLoading]);

  const showActiveBar = Boolean(activeSession) && !activeSessionLoading;
  const sessionTitle = activeSession
    ? activeSession.templateId
      ? (activeTemplate?.name ?? "Workout")
      : "Workout"
    : "";

  const { startedAtMs, initialElapsedSec } = useMemo(() => {
    if (!activeSession) {
      return { startedAtMs: 0, initialElapsedSec: 0 };
    }
    const ms = activeSession.startedAt;
    return {
      startedAtMs: ms,
      initialElapsedSec: Math.max(0, Math.floor((Date.now() - ms) / 1000)),
    };
  }, [activeSession]);

  const headerLiveMatches =
    activeSession != null && liveUi.sessionId === activeSession.id;

  const activeWorkoutLink =
    showActiveBar && activeSession ? (
      <Link
        to="/app/workouts/session/$sessionId"
        params={{ sessionId: activeSession.id }}
        className={cn(
          "bg-primary/8 hover:bg-primary/12 border-primary/20",
          "flex min-w-0 w-full max-w-lg items-center gap-2 overflow-hidden rounded-xl border",
          "px-2.5 py-1.5 text-left transition-colors",
          "touch-manipulation sm:px-3"
        )}
        title={`Open ${sessionTitle}`}
        aria-label={`Active workout: ${sessionTitle}. Open session.`}
      >
        <Dumbbell
          className="text-primary size-4 shrink-0 sm:size-[1.125rem]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium sm:text-base">
            {sessionTitle}
          </span>
          {headerLiveMatches ? (
            <AppHeaderWorkoutSubtitle
              exerciseName={liveUi.currentExerciseName}
              restDeadlineMs={liveUi.restDeadlineMs}
            />
          ) : null}
        </div>
        <AppHeaderWorkoutTimer
          startedAtMs={startedAtMs}
          initialElapsedSec={initialElapsedSec}
          restDeadlineMs={
            headerLiveMatches ? liveUi.restDeadlineMs : null
          }
        />
      </Link>
    ) : null;

  const statusTooltip = syncing
    ? "Syncing…"
    : !online
      ? "Offline; saves locally"
      : "Connected";

  const headerControls = (
    <>
      <SimpleTooltip text={statusTooltip} className="-m-0.5 shrink-0">
        <span
          className={cn(
            "size-2.5 rounded-full",
            !online && "bg-red-500",
            online &&
              "bg-emerald-600 ring-1 ring-emerald-900/30 dark:bg-green-500 dark:ring-1 dark:ring-lime-200/35",
            syncing && "animate-pulse"
          )}
        />
      </SimpleTooltip>
      <AppHeaderThemeMenu />
      <AppHeaderProfileMenu
        email={tokens?.email ?? null}
        name={tokens?.name ?? null}
      />
    </>
  );

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md md:border-l-0">
      <div
        className={cn(
          "mx-auto h-16 w-full min-w-0 max-w-xl items-center gap-2 px-5 md:max-w-none md:px-12",
          showActiveBar
            ? "grid min-w-0 grid-cols-[1fr_minmax(0,32rem)_1fr] sm:gap-3"
            : "flex justify-between md:justify-end"
        )}
      >
        {showActiveBar ? (
          <>
            <div className="flex min-w-0 items-center justify-self-start sm:gap-3">
              <Link
                to="/app"
                className="flex min-w-0 shrink-0 items-center gap-2.5 md:hidden"
              >
                <BrandMark className="size-8 shrink-0 [&_svg]:size-[1.15rem]" />
                <span className="text-lg font-semibold tracking-tight">
                  {APP_BRAND_NAME}
                </span>
              </Link>
            </div>
            <div className="flex min-w-0 items-center justify-center justify-self-center">
              {activeWorkoutLink}
            </div>
            <div className="flex min-w-0 items-center justify-end justify-self-end gap-2">
              {headerControls}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/app"
              className="flex min-w-0 shrink-0 items-center gap-2.5 md:hidden"
            >
              <BrandMark className="size-8 shrink-0 [&_svg]:size-[1.15rem]" />
              <span className="text-lg font-semibold tracking-tight">
                {APP_BRAND_NAME}
              </span>
            </Link>
            <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
              {headerControls}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
