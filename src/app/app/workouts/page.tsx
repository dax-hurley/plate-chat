import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

import { CreateWorkoutRoutineForm } from "@/components/app/create-workout-routine-form";
import { WorkoutRoutineGroupHeader } from "@/components/app/workout-routine-group-header";
import { WorkoutTemplateLibraryCard } from "@/components/app/workout-template-library-card";
import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth-user";
import { listWorkoutRoutinesLibrary } from "@/lib/services/workouts";
import { cn } from "@/lib/utils";

export default async function WorkoutsPage() {
  const userId = await requireUserId();
  const { groups, ungrouped } = await listWorkoutRoutinesLibrary(userId);

  const totalTemplates =
    groups.reduce((acc, g) => acc + g.templates.length, 0) + ungrouped.length;

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 sm:max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
              <ClipboardList className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            Workouts
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your saved workouts, organized into routines.
          </p>
        </div>
        <Link
          href="/app/workouts/new"
          className={cn(
            buttonVariants(),
            "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
          )}
        >
          <Plus className="size-4" aria-hidden />
          New workout
        </Link>
      </div>

      {totalTemplates === 0 ? (
        <div className="border-primary/15 bg-card rounded-xl border p-8 text-center shadow-sm">
          <p className="text-muted-foreground text-sm">
            You don&apos;t have any workouts yet. Create one to get started.
          </p>
        </div>
      ) : null}

      {groups.map((group) => (
        <section key={group.id} className="space-y-4">
          <WorkoutRoutineGroupHeader
            routineGroupId={group.id}
            name={group.name}
          />
          {group.templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No workouts in this routine yet.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.templates.map((t) => (
                <WorkoutTemplateLibraryCard
                  key={t.id}
                  template={{
                    id: t.id,
                    name: t.name,
                    createdAt: new Date(t.createdAt as Date),
                    items: t.items,
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      ))}

      {ungrouped.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {groups.length > 0 ? "Not in a routine" : "Your workouts"}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ungrouped.map((t) => (
              <WorkoutTemplateLibraryCard
                key={t.id}
                template={{
                  id: t.id,
                  name: t.name,
                  createdAt: new Date(t.createdAt as Date),
                  items: t.items,
                }}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
