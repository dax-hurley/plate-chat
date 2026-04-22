import { Activity } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary/15 text-primary ring-primary/20 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
        className
      )}
    >
      <Activity
        className="size-[1.35rem]"
        strokeWidth={2.25}
        strokeLinecap="round"
        aria-hidden
      />
    </span>
  );
}
