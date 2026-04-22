import { ClipboardCopy, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function SkeletonRows({ count, offset }: { count: number; offset: number }) {
  return (
    <ul className="space-y-1.5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 border-b border-dotted border-border/60 pb-1.5 last:border-0"
        >
          <div
            className="bg-muted h-4 max-w-full animate-pulse rounded-md"
            style={{ width: `${52 + ((i + offset) * 11) % 38}%` }}
          />
          <div className="bg-muted h-4 w-14 shrink-0 animate-pulse rounded-md" />
        </li>
      ))}
    </ul>
  );
}

export function ShoppingListSkeletonCard() {
  return (
    <Card className="border-primary/15 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <ClipboardCopy className="text-chart-2 size-5 shrink-0" aria-hidden />
          Shopping list
          <span
            className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5"
            aria-hidden
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
              AI
            </span>
          </span>
        </CardTitle>
        <CardDescription>
          <span className="text-muted-foreground inline-block">
            Organizing by aisle and estimating prices…
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4" aria-busy="true" aria-label="Loading shopping list">
          <div className="space-y-2">
            <div className="bg-muted h-3 w-24 animate-pulse rounded-md" />
            <SkeletonRows count={4} offset={0} />
          </div>
          <Separator className="bg-border/80" />
          <div className="space-y-2">
            <div className="bg-muted h-3 w-32 animate-pulse rounded-md" />
            <SkeletonRows count={5} offset={2} />
          </div>
        </div>
        <div className="border-border flex justify-between border-t pt-3">
          <div className="bg-muted h-4 w-28 animate-pulse rounded-md" />
          <div className="bg-muted h-5 w-20 animate-pulse rounded-md" />
        </div>
        <div className="bg-muted h-10 w-full max-w-xs animate-pulse rounded-lg" />
      </CardContent>
    </Card>
  );
}
