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
import { Label } from "@/components/ui/label";

import { actionSetTemplateRoutineGroup } from "@/app/app/workouts/actions";

const NONE = "__none__";

export function AssignWorkoutToRoutineSelect({
  templateId,
  currentRoutineGroupId,
  routineOptions,
}: {
  templateId: string;
  currentRoutineGroupId: string | null;
  routineOptions: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const value = currentRoutineGroupId ?? NONE;

  function onValueChange(next: string | null) {
    if (next == null) return;
    const nextGroup = next === NONE ? null : next;
    if (nextGroup === currentRoutineGroupId) return;
    start(async () => {
      try {
        await actionSetTemplateRoutineGroup({
          templateId,
          routineGroupId: nextGroup,
        });
        toast.success("Routine updated");
      } catch {
        toast.error("Could not update routine");
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={`routine-${templateId}`}
        className="text-muted-foreground text-xs"
      >
        Routine
      </Label>
      <Select
        disabled={pending}
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger
          id={`routine-${templateId}`}
          className="min-h-11 w-full text-base"
        >
          <SelectValue placeholder="Not in a routine" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Not in a routine</SelectItem>
          {routineOptions.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
