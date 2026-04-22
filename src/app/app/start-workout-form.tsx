import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { actionStartWorkout } from "./workouts/actions";

export function StartWorkoutForm({
  templateId,
  name,
  formClassName,
  buttonClassName,
}: {
  templateId: string;
  name: string;
  formClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <form
      action={actionStartWorkout.bind(null, templateId)}
      className={cn("min-w-0", formClassName)}
    >
      <Button
        type="submit"
        className={cn(
          "min-h-12 w-full justify-between gap-3 text-base shadow-sm",
          buttonClassName
        )}
      >
        <span className="truncate font-medium">{name}</span>
        <span className="text-primary-foreground/90 inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
          <Play className="size-4 fill-current opacity-90" aria-hidden />
          Start
        </span>
      </Button>
    </form>
  );
}
