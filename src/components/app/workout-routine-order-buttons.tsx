import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useWorkoutMutations } from "@/lib/stores";

export function WorkoutRoutineOrderButtons({
  templateId,
  prevTemplateId,
  nextTemplateId,
  templateOrder,
  prevOrder,
  nextOrder,
}: {
  templateId: string;
  prevTemplateId: string | null;
  nextTemplateId: string | null;
  templateOrder: number | null;
  prevOrder: number | null;
  nextOrder: number | null;
}) {
  const { updateTemplate } = useWorkoutMutations();
  const [pending, setPending] = useState(false);

  async function move(direction: "up" | "down") {
    setPending(true);
    try {
      if (direction === "up" && prevTemplateId && templateOrder != null) {
        await updateTemplate(templateId, {
          routineOrder: prevOrder ?? templateOrder - 1,
        });
        await updateTemplate(prevTemplateId, {
          routineOrder: templateOrder,
        });
      } else if (
        direction === "down" &&
        nextTemplateId &&
        templateOrder != null
      ) {
        await updateTemplate(templateId, {
          routineOrder: nextOrder ?? templateOrder + 1,
        });
        await updateTemplate(nextTemplateId, {
          routineOrder: templateOrder,
        });
      }
    } catch {
      toast.error("Could not reorder");
    } finally {
      setPending(false);
    }
  }

  const canMoveUp = prevTemplateId !== null;
  const canMoveDown = nextTemplateId !== null;

  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-primary/20 size-11 touch-manipulation p-0"
        disabled={!canMoveUp || pending}
        aria-label="Move workout up in this routine"
        onClick={() => void move("up")}
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
        onClick={() => void move("down")}
      >
        <ChevronDown className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
