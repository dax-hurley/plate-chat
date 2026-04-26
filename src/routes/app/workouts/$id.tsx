import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ListTree } from "lucide-react";
import { toast } from "sonner";

import { AssignWorkoutToRoutineSelect } from "@/components/app/assign-workout-to-routine-select";
import { TemplateEditor } from "@/components/app/template-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useExercises,
  useRoutineGroups,
  useTemplateItems,
  useWorkoutMutations,
  useWorkoutTemplate,
} from "@/lib/stores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/workouts/$id")({
  component: TemplatePage,
});

function TemplatePage() {
  const { id } = Route.useParams();
  const { data: template } = useWorkoutTemplate(id);
  const { data: items } = useTemplateItems(id);
  const { data: exercises } = useExercises();
  const { data: groups } = useRoutineGroups();
  const { updateTemplate } = useWorkoutMutations();

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setNameDraft(null);
      setNotesDraft(null);
    }
  }, [template?.id]);

  const displayedName = nameDraft ?? template?.name ?? "";
  const displayedNotes = notesDraft ?? template?.notes ?? "";

  const routineOptions = useMemo(
    () => groups.map((g) => ({ id: g.id, name: g.name })),
    [groups]
  );

  if (!template)
    return (
      <p className="text-muted-foreground text-center py-10">Loading…</p>
    );

  async function saveName() {
    if (!template) return;
    const next = (nameDraft ?? template.name).trim();
    if (!next || next === template.name) {
      setNameDraft(null);
      return;
    }
    try {
      await updateTemplate(template.id, { name: next });
      setNameDraft(null);
      toast.success("Name saved", { description: "Workout updated." });
    } catch {
      toast.error("Could not save name");
    }
  }

  async function saveNotes() {
    if (!template) return;
    const raw = notesDraft ?? template.notes ?? "";
    const next = raw.trim() === "" ? null : raw.trim();
    if (next === (template.notes ?? null)) {
      setNotesDraft(null);
      return;
    }
    try {
      await updateTemplate(template.id, { notes: next });
      setNotesDraft(null);
      toast.success("Notes saved", { description: "Workout updated." });
    } catch {
      toast.error("Could not save notes");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Link
        to="/app/workouts"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "min-h-11 -ml-2 inline-flex items-center gap-2"
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Workouts
      </Link>

      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <ListTree className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          {template.name}
        </h1>
      </div>

      <Card className="border-primary/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={displayedName}
              className="min-h-12 text-base"
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
            />
          </div>
          <div className="border-border/60 space-y-2 border-t pt-4">
            <p className="text-foreground text-sm font-medium">Routine</p>
            <p className="text-muted-foreground text-sm">
              Group this workout with others in a rotation, keep it
              unassigned, or add a new routine from the field below.
            </p>
            <AssignWorkoutToRoutineSelect
              templateId={template.id}
              currentRoutineGroupId={template.routineGroupId ?? null}
              routineOptions={routineOptions}
            />
          </div>
        </CardContent>
      </Card>

      <TemplateEditor
        templateId={template.id}
        items={items}
        exercises={exercises}
      />

      <Card className="border-primary/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>
            Reminders for this workout—form cues, warm-up flow, or equipment.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Label htmlFor="template-notes" className="sr-only">
              Notes
            </Label>
            <Input
              id="template-notes"
              value={displayedNotes}
              placeholder="Warm-up tips, etc."
              className="min-h-12 text-base"
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={saveNotes}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
