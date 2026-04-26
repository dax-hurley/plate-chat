import { Flag, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWorkoutSessionActions } from "@/components/app/workout-session/workout-session-actions-context";
import { Button } from "@/components/ui/button";
import { formatDurationSeconds } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

type RunAction = (fn: () => Promise<void>) => void;

export function TimeSetCountdown({
  sessionId,
  exerciseId,
  setIndex,
  targetSec,
  pending,
  runAction,
}: {
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  targetSec: number;
  pending: boolean;
  runAction: RunAction;
}) {
  const actions = useWorkoutSessionActions();
  const [remainingSec, setRemainingSec] = useState(targetSec);
  const [running, setRunning] = useState(false);

  const logDuration = useCallback(
    (seconds: number) => {
      runAction(() =>
        actions.logTimedSet(sessionId, exerciseId, setIndex, seconds)
      );
    },
    [actions, exerciseId, runAction, sessionId, setIndex]
  );

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemainingSec((r) => {
        if (r <= 1) {
          queueMicrotask(() => {
            setRunning(false);
            logDuration(targetSec);
          });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, logDuration, targetSec]);

  const elapsedSec = Math.max(0, targetSec - remainingSec);
  const hasStarted = elapsedSec > 0;
  const progress =
    targetSec > 0 ? Math.min(100, (remainingSec / targetSec) * 100) : 0;

  function onStartOrResume() {
    if (pending) return;
    setRunning(true);
  }

  function onPause() {
    if (pending) return;
    setRunning(false);
  }

  function onStopAndLog() {
    if (pending) return;
    setRunning(false);
    const elapsed = Math.max(1, targetSec - remainingSec);
    logDuration(Math.min(elapsed, targetSec));
  }

  return (
    <div
      className={cn(
        "border-primary/25 from-primary/[0.12] shadow-primary/10 w-full min-w-0 rounded-2xl border bg-gradient-to-br via-background to-muted/30 p-4 shadow-md ring-1 ring-black/5 dark:ring-white/10",
        "basis-full"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wider">
            Set {setIndex} · hold
          </p>
          <p
            className="text-foreground text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
            aria-live="polite"
          >
            {formatDurationSeconds(remainingSec)}
          </p>
          <p className="text-muted-foreground text-xs">
            Target {formatDurationSeconds(targetSec)}
            {hasStarted ? (
              <span className="text-foreground/90">
                {" "}
                · held {formatDurationSeconds(elapsedSec)}
              </span>
            ) : null}
          </p>
          <div className="bg-muted h-2.5 overflow-hidden rounded-full">
            <div
              className="from-primary h-full rounded-full bg-gradient-to-r to-primary/80 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-col sm:justify-center">
          {!running ? (
            <Button
              type="button"
              size="lg"
              className="min-h-12 min-w-[7.5rem] touch-manipulation gap-2 shadow-sm"
              disabled={pending || remainingSec <= 0}
              onClick={onStartOrResume}
            >
              <Play className="size-5" aria-hidden />
              {hasStarted ? "Resume" : "Start"}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="min-h-12 min-w-[7.5rem] touch-manipulation gap-2 shadow-sm"
              disabled={pending}
              onClick={onPause}
            >
              <Pause className="size-5" aria-hidden />
              Pause
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="min-h-12 min-w-[7.5rem] touch-manipulation gap-2 border-dashed"
            disabled={pending || !hasStarted || remainingSec >= targetSec}
            onClick={onStopAndLog}
          >
            <Square className="size-4" aria-hidden />
            Stop &amp; log
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DistanceStopwatch({
  sessionId,
  exerciseId,
  setIndex,
  targetLabel,
  logTimeInsteadOfDistance,
  pending,
  runAction,
}: {
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  /** Distance goal (e.g. "5 km") when logging distance; time goal when logging time. */
  targetLabel: string;
  /** When true, the primary button logs stopwatch seconds as the set result. */
  logTimeInsteadOfDistance: boolean;
  pending: boolean;
  runAction: RunAction;
}) {
  const actions = useWorkoutSessionActions();
  const [elapsedSec, setElapsedSec] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startedAtRef.current = Date.now();
    const id = setInterval(() => {
      if (startedAtRef.current == null) return;
      const now = Date.now();
      setElapsedSec(offsetRef.current + (now - startedAtRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  function onStartResume() {
    if (pending) return;
    if (!running) {
      setRunning(true);
    }
  }

  function onPause() {
    if (pending) return;
    if (running && startedAtRef.current != null) {
      offsetRef.current += (Date.now() - startedAtRef.current) / 1000;
      setElapsedSec(offsetRef.current);
    }
    startedAtRef.current = null;
    setRunning(false);
  }

  function onReset() {
    if (pending) return;
    startedAtRef.current = null;
    offsetRef.current = 0;
    setElapsedSec(0);
    setRunning(false);
  }

  function onLogSet() {
    if (pending) return;
    onPause();
    if (logTimeInsteadOfDistance) {
      const sec = Math.max(1, Math.floor(elapsedSec));
      runAction(() =>
        actions.logDistanceTimeFromStopwatch(
          sessionId,
          exerciseId,
          setIndex,
          sec
        )
      );
    } else {
      runAction(() => actions.fillSetSlot(sessionId, exerciseId, setIndex));
    }
  }

  const displaySec = Math.floor(elapsedSec);
  const centi = Math.floor((elapsedSec - displaySec) * 100);

  return (
    <div
      className={cn(
        "border-emerald-500/25 from-emerald-500/[0.08] shadow-emerald-950/10 w-full min-w-0 rounded-2xl border bg-gradient-to-br via-background to-teal-950/20 p-4 shadow-md ring-1 ring-black/5 dark:ring-white/10 dark:to-teal-950/30",
        "basis-full"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wider">
            Set {setIndex} · stopwatch
          </p>
          <p
            className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-4xl font-bold tabular-nums tracking-tight text-transparent dark:from-emerald-400 dark:to-teal-300 sm:text-5xl"
            aria-live="polite"
          >
            {formatDurationSeconds(displaySec)}
            <span className="text-emerald-600 dark:text-emerald-300/90 text-2xl sm:text-3xl">
              .{centi.toString().padStart(2, "0")}
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            {logTimeInsteadOfDistance ? (
              <>
                Goal{" "}
                <span className="text-foreground font-medium">
                  {targetLabel}
                </span>
                . Tap Log time to save your stopwatch reading (capped to the
                goal).
              </>
            ) : (
              <>
                Log{" "}
                <span className="text-foreground font-medium">{targetLabel}</span>{" "}
                when you are done — the stopwatch is for your pace only.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:min-w-[10rem]">
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            {!running ? (
              <Button
                type="button"
                size="lg"
                className="min-h-11 min-w-[6.5rem] touch-manipulation gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                disabled={pending}
                onClick={onStartResume}
              >
                <Play className="size-5" aria-hidden />
                {displaySec > 0 ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="min-h-11 min-w-[6.5rem] touch-manipulation gap-2"
                disabled={pending}
                onClick={onPause}
              >
                <Pause className="size-5" aria-hidden />
                Pause
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-11 min-w-[6.5rem] touch-manipulation gap-2"
              disabled={pending || (elapsedSec === 0 && !running)}
              onClick={onReset}
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </Button>
          </div>
          <Button
            type="button"
            size="lg"
            className="min-h-12 w-full touch-manipulation gap-2 shadow-md"
            disabled={pending}
            onClick={onLogSet}
          >
            <Flag className="size-5" aria-hidden />
            {logTimeInsteadOfDistance ? "Log time" : "Log distance"}
          </Button>
        </div>
      </div>
    </div>
  );
}
