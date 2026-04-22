import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CirclePlus, ListTree } from "lucide-react";

import { AssignWorkoutToRoutineSelect } from "@/components/app/assign-workout-to-routine-select";
import { CreateWorkoutRoutineForm } from "@/components/app/create-workout-routine-form";
import { WorkoutRoutineOrderButtons } from "@/components/app/workout-routine-order-buttons";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserId } from "@/lib/auth-user";
import * as workouts from "@/lib/services/workouts";
import { cn } from "@/lib/utils";

import { TemplateEditor } from "./template-editor";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const [template, exerciseList, library] = await Promise.all([
    workouts.getTemplate(userId, id),
    workouts.listUserExercises(userId),
    workouts.listWorkoutRoutinesLibrary(userId),
  ]);
  if (!template) notFound();

  const routineOptions = library.groups.map((g) => ({
    id: g.id,
    name: g.name,
  }));

  let orderInRoutine: { index: number; total: number } | null = null;
  const routineGid = template.routineGroupId;
  if (routineGid) {
    const g = library.groups.find((x) => x.id === routineGid);
    if (g) {
      const idx = g.templates.findIndex((t) => t.id === template.id);
      if (idx >= 0) {
        orderInRoutine = { index: idx, total: g.templates.length };
      }
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Link
        href="/app/workouts"
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
        {template.notes ? (
          <p className="text-muted-foreground mt-1 text-sm">{template.notes}</p>
        ) : null}
      </div>

      <Card className="border-primary/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Routine</CardTitle>
          <CardDescription>
            Create a routine group, then add this workout to it—or leave it not
            in a routine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <CreateWorkoutRoutineForm revalidateTemplateId={template.id} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <AssignWorkoutToRoutineSelect
                templateId={template.id}
                currentRoutineGroupId={template.routineGroupId ?? null}
                routineOptions={routineOptions}
              />
            </div>
            {orderInRoutine ? (
              <WorkoutRoutineOrderButtons
                templateId={template.id}
                canMoveUp={orderInRoutine.index > 0}
                canMoveDown={
                  orderInRoutine.index < orderInRoutine.total - 1
                }
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Link
        href={`/app/workouts/${template.id}/quick-add`}
        className={cn(
          buttonVariants({ variant: "default" }),
          "inline-flex min-h-12 w-full items-center justify-center gap-2 text-base shadow-sm"
        )}
      >
        <CirclePlus className="size-5" aria-hidden />
        Quick add exercise
      </Link>
      <p className="text-muted-foreground -mt-4 text-sm">
        Opens a dedicated screen to add a custom exercise (reps, time, or
        distance) to this workout.
      </p>

      <TemplateEditor
        templateId={template.id}
        items={template.items}
        exercises={exerciseList.map((e) => ({
          id: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup,
          isPreset: e.userId == null,
          weightUnit: e.weightUnit,
        }))}
      />
    </div>
  );
}
