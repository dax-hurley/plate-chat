import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { formatDurationSeconds } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

export function WorkoutElapsedTimer({
  startedAtMs,
  initialElapsedSec,
  className,
  variant = "default",
}: {
  startedAtMs: number;
  /** Server-computed elapsed seconds to avoid a 0s flash before hydration. */
  initialElapsedSec: number;
  className?: string;
  /** Single-line, smaller — for headers and toolbars. */
  variant?: "default" | "compact";
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

  const label = `Elapsed time ${formatDurationSeconds(elapsedSec)}`;

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "text-foreground inline-flex items-center gap-1 tabular-nums",
          "text-sm font-semibold tracking-tight",
          className
        )}
        aria-label={label}
        aria-live="polite"
        aria-atomic="true"
      >
        <Timer className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
        {formatDurationSeconds(elapsedSec)}
      </span>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-end gap-0.5", className)}
      aria-label={label}
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
