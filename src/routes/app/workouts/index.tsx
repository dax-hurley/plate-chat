import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ClipboardList, Plus, Sparkles } from "lucide-react";

import { COACH_CREATE_WORKOUT_OR_ROUTINE_PROMPT } from "@/lib/coach-create-workout-prompt";

import { WorkoutRoutineGroupHeader } from "@/components/app/workout-routine-group-header";
import { WorkoutRoutineOrderButtons } from "@/components/app/workout-routine-order-buttons";
import { WorkoutTemplateLibraryCard } from "@/components/app/workout-template-library-card";
import { buttonVariants } from "@/components/ui/button";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import {
  useRoutineGroups,
  useWorkoutTemplates,
  type WorkoutTemplate,
  useLocalSession,
} from "@/lib/stores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/workouts/")({
  component: WorkoutsPage,
});

function useTemplateItemCounts() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<{ templateId: string; count: number }>(
    async () => {
      if (!db || !userId) return [];
      const items = (await db.workoutTemplateItems
        .filter((r) => r.deletedAt === null)
        .toArray()) as unknown as Array<{ templateId: string }>;
      const byT = new Map<string, number>();
      for (const it of items) {
        byT.set(it.templateId, (byT.get(it.templateId) ?? 0) + 1);
      }
      return [...byT.entries()].map(([templateId, count]) => ({
        templateId,
        count,
      }));
    },
    [db, userId]
  );
}

function templateSortKey(t: WorkoutTemplate): number {
  return t.routineOrder ?? Number.MAX_SAFE_INTEGER;
}

function groupedTemplates(
  templates: WorkoutTemplate[],
  groupId: string
): WorkoutTemplate[] {
  return templates
    .filter((t) => t.routineGroupId === groupId)
    .sort((a, b) => templateSortKey(a) - templateSortKey(b) || a.createdAt - b.createdAt);
}

function WorkoutsPage() {
  const { data: groups } = useRoutineGroups();
  const { data: templates } = useWorkoutTemplates();
  const { data: counts } = useTemplateItemCounts();

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of counts) m.set(c.templateId, c.count);
    return m;
  }, [counts]);

  const ungrouped = useMemo(
    () =>
      templates
        .filter((t) => !t.routineGroupId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [templates]
  );

  const totalTemplates = templates.length;

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl space-y-8 sm:max-w-5xl">
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2">
          <Link
            to="/app/coach"
            search={{ prompt: COACH_CREATE_WORKOUT_OR_ROUTINE_PROMPT }}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            Create with AI
          </Link>
          <Link
            to="/app/workouts/new"
            className={cn(
              buttonVariants(),
              "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
            )}
          >
            <Plus className="size-4" aria-hidden />
            New workout
          </Link>
        </div>
      </div>

      {totalTemplates === 0 ? (
        <div className="border-primary/15 bg-card rounded-xl border p-8 text-center shadow-sm">
          <p className="text-muted-foreground text-sm">
            You don&apos;t have any workouts yet. Create one to get started.
          </p>
        </div>
      ) : null}

      {groups.map((group) => {
        const groupTemplates = groupedTemplates(templates, group.id);
        return (
          <section key={group.id} className="space-y-4">
            <WorkoutRoutineGroupHeader
              routineGroupId={group.id}
              name={group.name}
            />
            {groupTemplates.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No workouts in this routine yet.
              </p>
            ) : (
              <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupTemplates.map((t, idx) => {
                  const prev = groupTemplates[idx - 1] ?? null;
                  const next = groupTemplates[idx + 1] ?? null;
                  return (
                    <div
                      key={t.id}
                      className="flex min-w-0 flex-col gap-2 sm:items-stretch"
                    >
                      <WorkoutTemplateLibraryCard
                        template={{
                          id: t.id,
                          name: t.name,
                          createdAt: t.createdAt,
                          itemCount: countMap.get(t.id) ?? 0,
                        }}
                      />
                      {groupTemplates.length > 1 ? (
                        <div className="flex justify-end">
                          <WorkoutRoutineOrderButtons
                            templateId={t.id}
                            templateOrder={t.routineOrder}
                            prevTemplateId={prev?.id ?? null}
                            prevOrder={prev?.routineOrder ?? null}
                            nextTemplateId={next?.id ?? null}
                            nextOrder={next?.routineOrder ?? null}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {ungrouped.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {groups.length > 0 ? "Not in a routine" : "Your workouts"}
          </h2>
          <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ungrouped.map((t) => (
              <WorkoutTemplateLibraryCard
                key={t.id}
                template={{
                  id: t.id,
                  name: t.name,
                  createdAt: t.createdAt,
                  itemCount: countMap.get(t.id) ?? 0,
                }}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
