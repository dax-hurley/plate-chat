"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { actionAddMealPlanSlot } from "@/app/app/nutrition/meal-planning-actions";

export function AddSlotButton({
  weekStartDayKey,
  dayIndex,
}: {
  weekStartDayKey: string;
  dayIndex: number;
}) {
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      try {
        await actionAddMealPlanSlot(weekStartDayKey, dayIndex, "snack");
      } catch {
        toast.error("Could not add slot");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-primary/20 min-h-10 w-full gap-1.5 text-xs"
      disabled={pending}
      onClick={onClick}
    >
      <Plus className="size-3.5" aria-hidden />
      Add snack
    </Button>
  );
}
