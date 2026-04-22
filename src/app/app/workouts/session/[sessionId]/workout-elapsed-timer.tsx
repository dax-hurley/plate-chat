"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { formatDurationSeconds } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

export function WorkoutElapsedTimer({
  startedAtMs,
  initialElapsedSec,
  className,
}: {
  startedAtMs: number;
  /** Server-computed elapsed seconds to avoid a 0s flash before hydration. */
  initialElapsedSec: number;
  className?: string;
}) {
  const [elapsedSec, setElapsedSec] = useState(initialElapsedSec);

  useEffect(() => {
    const tick = () => {
      setElapsedSec(
        Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAtMs]);

  return (
    <div
      className={cn("flex flex-col items-end gap-0.5", className)}
      aria-label={`Elapsed time ${formatDurationSeconds(elapsedSec)}`}
    >
      <span className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wide">
        Elapsed
      </span>
      <span
        className="text-foreground flex items-center gap-1.5 text-xl font-semibold tabular-nums tracking-tight"
        aria-live="polite"
        aria-atomic="true"
      >
        <Timer className="text-muted-foreground size-5 shrink-0" aria-hidden />
        {formatDurationSeconds(elapsedSec)}
      </span>
    </div>
  );
}
