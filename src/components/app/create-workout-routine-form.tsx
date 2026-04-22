import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { actionCreateWorkoutRoutineGroup } from "@/app/app/workouts/actions";

export function CreateWorkoutRoutineForm({
  revalidateTemplateId,
}: {
  /** When set (e.g. on the workout editor), refreshes that page so new routines appear in the dropdown. */
  revalidateTemplateId?: string;
} = {}) {
  return (
    <form
      action={actionCreateWorkoutRoutineGroup}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      {revalidateTemplateId ? (
        <input
          type="hidden"
          name="revalidateTemplateId"
          value={revalidateTemplateId}
        />
      ) : null}
      <div className="min-w-0 flex-1 space-y-1.5">
        <label htmlFor="new-routine-name" className="text-sm font-medium">
          New routine
        </label>
        <Input
          id="new-routine-name"
          name="name"
          placeholder="e.g. Push / pull / legs"
          required
          className="min-h-11"
          autoComplete="off"
        />
      </div>
      <Button type="submit" className="min-h-11 shrink-0">
        Create routine
      </Button>
    </form>
  );
}
