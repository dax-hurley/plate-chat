"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NumericStepperInput({
  id,
  name,
  min,
  max,
  defaultValue = min,
  disabled,
  className,
  inputClassName,
}: {
  id: string;
  name: string;
  min: number;
  max: number;
  defaultValue?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const [value, setValue] = useState(() =>
    Math.min(max, Math.max(min, Math.round(Number(defaultValue) || min)))
  );

  const clamp = useCallback(
    (n: number) => Math.min(max, Math.max(min, Math.round(n))),
    [min, max]
  );

  const dec = () => setValue((v) => clamp(v - 1));
  const inc = () => setValue((v) => clamp(v + 1));

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || value <= min}
        onClick={dec}
        className="min-h-12 w-12 shrink-0 touch-manipulation px-0"
        aria-label="Decrease"
      >
        <Minus className="size-5" aria-hidden />
      </Button>
      <Input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return;
          const n = Number(raw);
          if (!Number.isFinite(n)) return;
          setValue(clamp(n));
        }}
        className={cn(
          "min-h-12 flex-1 text-center text-base font-semibold tabular-nums touch-manipulation",
          inputClassName
        )}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || value >= max}
        onClick={inc}
        className="min-h-12 w-12 shrink-0 touch-manipulation px-0"
        aria-label="Increase"
      >
        <Plus className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
