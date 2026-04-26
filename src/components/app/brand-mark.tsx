import { MessageCircle } from "lucide-react";

import { APP_BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Temporary brand glyph until a custom mark ships. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary/15 text-primary ring-primary/20 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
        className
      )}
      aria-label={APP_BRAND_NAME}
      title={APP_BRAND_NAME}
    >
      <MessageCircle
        className="size-[1.35rem]"
        strokeWidth={2.25}
        strokeLinecap="round"
        aria-hidden
      />
    </span>
  );
}
