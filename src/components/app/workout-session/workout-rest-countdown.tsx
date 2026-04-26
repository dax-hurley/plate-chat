import { Hourglass } from "lucide-react";
import { useEffect, useState } from "react";

import { formatDurationSeconds } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

/**
 * Counts down to `deadlineMs` (wall clock). Separate from the session elapsed timer.
 */
export function WorkoutRestCountdown({
  deadlineMs,
  className,
  variant = "default",
}: {
  deadlineMs: number;
  className?: string;
  /** Single-line, smaller — matches elapsed timer compact / header. */
  variant?: "default" | "compact";
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  const remainingSec = Math.max(0, Math.ceil((deadlineMs - now) / 1000));
  const label = `Rest remaining ${formatDurationSeconds(remainingSec)}`;

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "text-foreground inline-flex items-center gap-1 tabular-nums",
          "text-sm font-semibold tracking-tight",
          remainingSec === 0 ? "text-muted-foreground" : "text-foreground",
          className
        )}
        aria-label={label}
        aria-live="polite"
        aria-atomic="true"
      >
        <Hourglass className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
        {formatDurationSeconds(remainingSec)}
      </span>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-end gap-0.5", className)}
      aria-label={label}
    >
      <span className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wide">
        Rest
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5 text-xl font-semibold tabular-nums tracking-tight",
          remainingSec === 0
            ? "text-muted-foreground"
            : "text-foreground"
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        <Hourglass className="text-muted-foreground size-5 shrink-0" aria-hidden />
        {formatDurationSeconds(remainingSec)}
      </span>
    </div>
  );
}
