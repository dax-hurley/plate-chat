"use client";

import { cn } from "@/lib/utils";

/** Outer shell for Workouts-style segmented navigation (full width of parent). */
export function AppSubNav({
  className,
  "aria-label": ariaLabel = "Section navigation",
  children,
}: {
  className?: string;
  "aria-label"?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-border flex w-full gap-1 rounded-xl border bg-muted/40 p-1",
        className
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

/** Shared styles for each segment (use with `button` or `Link`). */
export function appSubNavTriggerClassName(active: boolean) {
  return cn(
    "inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors touch-manipulation",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground"
  );
}
