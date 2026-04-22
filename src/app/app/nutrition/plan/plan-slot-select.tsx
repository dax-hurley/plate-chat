"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  actionRemoveMealPlanSlot,
  actionSetMealPlanSlot,
} from "@/app/app/nutrition/meal-planning-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NONE = "__none__";

type LibraryOption = {
  id: string;
  name: string;
};

export function PlanSlotSelect({
  slotId,
  currentLibraryItemId,
  libraryOptions,
  canRemove,
  compact,
}: {
  slotId: string;
  currentLibraryItemId: string | null;
  libraryOptions: LibraryOption[];
  canRemove: boolean;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const value = currentLibraryItemId ?? NONE;

  function onValueChange(next: string | null) {
    if (next == null) return;
    const nextLib = next === NONE ? null : next;
    if (nextLib === currentLibraryItemId) return;
    start(async () => {
      try {
        await actionSetMealPlanSlot(slotId, nextLib);
      } catch {
        toast.error("Could not update meal");
      }
    });
  }

  function onRemove() {
    if (!confirm("Remove this slot?")) return;
    start(async () => {
      try {
        await actionRemoveMealPlanSlot(slotId);
      } catch {
        toast.error("Could not remove slot");
      }
    });
  }

  return (
    <div className={cn("flex items-center gap-2", compact && "flex-col gap-1.5")}>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v != null) onValueChange(v);
        }}
      >
        <SelectTrigger
          className={cn(
            "min-h-10 w-full text-sm",
            pending && "opacity-60"
          )}
          aria-label="Assign meal"
        >
          <SelectValue placeholder="None">
            {(v: string | null) => {
              if (v == null || v === NONE) return "None";
              const opt = libraryOptions.find((o) => o.id === v);
              return opt?.name ?? "None";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE} label="None">
            None
          </SelectItem>
          {libraryOptions.map((o) => (
            <SelectItem key={o.id} value={o.id} label={o.name}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive min-h-10 shrink-0 px-2 text-xs"
          disabled={pending}
          onClick={onRemove}
        >
          Remove
        </Button>
      ) : null}
    </div>
  );
}
