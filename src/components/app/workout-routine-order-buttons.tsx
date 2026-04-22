"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { actionMoveTemplateWithinRoutine } from "@/app/app/workouts/actions";

export function WorkoutRoutineOrderButtons({
  templateId,
  canMoveUp,
  canMoveDown,
}: {
  templateId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [pending, start] = useTransition();

  function move(direction: "up" | "down") {
    start(async () => {
      try {
        await actionMoveTemplateWithinRoutine(templateId, direction);
      } catch {
        toast.error("Could not reorder");
      }
    });
  }

  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-primary/20 size-11 touch-manipulation p-0"
        disabled={!canMoveUp || pending}
        aria-label="Move workout up in this routine"
        onClick={() => move("up")}
      >
        <ChevronUp className="size-5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-primary/20 size-11 touch-manipulation p-0"
        disabled={!canMoveDown || pending}
        aria-label="Move workout down in this routine"
        onClick={() => move("down")}
      >
        <ChevronDown className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
