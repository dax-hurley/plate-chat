import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  type ComboboxOption,
  AutocompleteCombobox,
} from "@/components/ui/autocomplete-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkoutMutations } from "@/lib/stores";

const ADD_ROUTINE = "__add_routine__";

export function AssignWorkoutToRoutineSelect({
  templateId,
  currentRoutineGroupId,
  routineOptions,
}: {
  templateId: string;
  currentRoutineGroupId: string | null;
  routineOptions: { id: string; name: string }[];
}) {
  const { updateTemplate, createRoutineGroup } = useWorkoutMutations();
  const [pending, setPending] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");

  const comboboxOptions = useMemo((): ComboboxOption[] => {
    const routineRows: ComboboxOption[] = routineOptions.map((g) => ({
      value: g.id,
      label: g.name,
      group: "Routines",
    }));
    return [
      ...routineRows,
      {
        value: ADD_ROUTINE,
        label: "Add new routine…",
        group: "New",
      },
    ];
  }, [routineOptions]);

  async function onRoutinePick(next: string | null) {
    if (next === ADD_ROUTINE) {
      setNewRoutineName("");
      setAddOpen(true);
      return;
    }
    const nextGroup = next;
    if (nextGroup === currentRoutineGroupId) return;
    setPending(true);
    try {
      await updateTemplate(templateId, { routineGroupId: nextGroup });
      toast.success("Routine updated");
    } catch {
      toast.error("Could not update routine");
    } finally {
      setPending(false);
    }
  }

  async function onCreateRoutine(e: FormEvent) {
    e.preventDefault();
    const name = newRoutineName.trim();
    if (!name) return;
    setPending(true);
    try {
      const id = await createRoutineGroup(name);
      await updateTemplate(templateId, { routineGroupId: id });
      setAddOpen(false);
      setNewRoutineName("");
      toast.success("Routine created and workout assigned");
    } catch {
      toast.error("Could not create routine");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`routine-combo-${templateId}`} className="sr-only">
          Assign this workout to a routine
        </Label>
        <AutocompleteCombobox
          id={`routine-combo-${templateId}`}
          aria-label="Assign to routine"
          options={comboboxOptions}
          value={currentRoutineGroupId}
          onValueChange={onRoutinePick}
          allowNone
          noneLabel="Not in a routine"
          disabled={pending}
          placeholder={
            currentRoutineGroupId == null
              ? "Not in a routine — search to change"
              : "Search routines…"
          }
          emptyText="No routines match."
          inputClassName="min-h-12 text-base"
        />
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onCreateRoutine}>
            <DialogHeader>
              <DialogTitle>New routine</DialogTitle>
              <DialogDescription>
                Create a routine group and assign this workout to it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor={`new-routine-${templateId}`}>Name</Label>
              <Input
                id={`new-routine-${templateId}`}
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                placeholder="e.g. Push / pull / legs"
                className="min-h-11 text-base"
                autoComplete="off"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !newRoutineName.trim()}>
                {pending ? "Creating…" : "Create and assign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
