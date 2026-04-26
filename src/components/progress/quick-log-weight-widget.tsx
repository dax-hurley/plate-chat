import { useState } from "react";
import { Minus, Plus, Scale } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProgressMutations } from "@/lib/stores";
import { formatDayKey } from "@/lib/date-key";
import { cn } from "@/lib/utils";

const MIN_LB = 35;
const MAX_LB = 900;
const STEP_LB = 1;

function formatLb(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}

function parseLb(raw: string) {
  const n = Number(String(raw).replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
}

export function QuickLogWeightWidget({
  initialLatestLb,
  onSaved,
  className,
}: {
  /** Most recent logged weight — used as the default field value */
  initialLatestLb: number | null;
  onSaved?: () => void;
  className?: string;
}) {
  const { setVital } = useProgressMutations();
  const [value, setValue] = useState(() =>
    initialLatestLb != null && Number.isFinite(initialLatestLb)
      ? formatLb(initialLatestLb)
      : ""
  );
  const [pending, setPending] = useState(false);

  function baselineLb() {
    const parsed = parseLb(value);
    if (Number.isFinite(parsed)) return parsed;
    if (initialLatestLb != null && Number.isFinite(initialLatestLb)) {
      return initialLatestLb;
    }
    return MIN_LB;
  }

  function adjust(delta: number) {
    const next = Math.min(
      MAX_LB,
      Math.max(MIN_LB, Math.round((baselineLb() + delta) * 10) / 10)
    );
    setValue(formatLb(next));
  }

  async function submit() {
    const n = parseLb(value);
    if (!Number.isFinite(n)) {
      toast.error("Enter your weight in pounds.");
      return;
    }
    if (n < MIN_LB || n > MAX_LB) {
      toast.error(`Weight must be between ${MIN_LB} and ${MAX_LB} lb.`);
      return;
    }
    setPending(true);
    try {
      await setVital("body_weight_lb", formatDayKey(), n);
      setValue(formatLb(n));
      toast.success("Weight saved for today.");
      onSaved?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save weight. Try again."
      );
    } finally {
      setPending(false);
    }
  }

  const baseLb = baselineLb();
  const canDecrease = baseLb > MIN_LB + 1e-9;
  const canIncrease = baseLb < MAX_LB - 1e-9;

  return (
    <Card
      className={cn(
        "border-primary/15 from-primary/[0.06] bg-gradient-to-br to-transparent shadow-sm shadow-primary/5",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-9 items-center justify-center rounded-xl ring-1">
            <Scale className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          Log today&apos;s weight
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="quick-log-weight-lb">Weight</Label>
            <div className="flex items-stretch gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending || !canDecrease}
                onClick={() => adjust(-STEP_LB)}
                className="min-h-12 min-w-12 shrink-0 touch-manipulation px-0 sm:min-w-14"
                aria-label="Decrease weight by one pound"
              >
                <Minus className="size-5" aria-hidden />
              </Button>
              <div className="relative min-h-12 min-w-0 max-w-[13rem] flex-1">
                <Input
                  id="quick-log-weight-lb"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={MIN_LB}
                  max={MAX_LB}
                  autoComplete="off"
                  value={value}
                  disabled={pending}
                  aria-describedby="quick-log-weight-lb-unit"
                  className="h-full min-h-12 w-full px-10 text-center text-base font-semibold tabular-nums touch-manipulation"
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                />
                <span
                  id="quick-log-weight-lb-unit"
                  className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium tabular-nums"
                >
                  lb
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={pending || !canIncrease}
                onClick={() => adjust(STEP_LB)}
                className="min-h-12 min-w-12 shrink-0 touch-manipulation px-0 sm:min-w-14"
                aria-label="Increase weight by one pound"
              >
                <Plus className="size-5" aria-hidden />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            className="min-h-12 w-full touch-manipulation sm:w-auto sm:min-w-[9rem]"
            disabled={pending}
            onClick={() => void submit()}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
