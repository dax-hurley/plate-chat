"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  actionDeleteWorkoutRoutineGroup,
  actionRenameWorkoutRoutineGroup,
} from "@/app/app/workouts/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function WorkoutRoutineGroupHeader({
  routineGroupId,
  name,
}: {
  routineGroupId: string;
  name: string;
}) {
  const [pending, start] = useTransition();

  function onDelete() {
    if (
      !confirm(
        `Delete routine “${name}”? Workouts stay in your library as “not in a routine.”`
      )
    ) {
      return;
    }
    start(async () => {
      try {
        await actionDeleteWorkoutRoutineGroup(routineGroupId);
        toast.success("Routine removed");
      } catch {
        toast.error("Could not delete routine");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
      <div className="flex shrink-0 gap-1">
        <Dialog>
          <DialogTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-primary/20 min-h-9 gap-1.5"
            )}
          >
            <Pencil className="size-3.5" aria-hidden />
            Rename
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rename routine</DialogTitle>
              <DialogDescription>
                This only changes the group name; your workouts are unchanged.
              </DialogDescription>
            </DialogHeader>
            <form action={actionRenameWorkoutRoutineGroup}>
              <input type="hidden" name="routineGroupId" value={routineGroupId} />
              <div className="space-y-2 py-2">
                <Label htmlFor={`rename-${routineGroupId}`}>Name</Label>
                <Input
                  id={`rename-${routineGroupId}`}
                  name="name"
                  defaultValue={name}
                  required
                  className="min-h-11"
                  autoComplete="off"
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-end">
                <DialogClose
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={pending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive min-h-9 gap-1.5"
          disabled={pending}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </Button>
      </div>
    </div>
  );
}
