import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  useWorkoutTemplates,
  useRoutineGroups,
  useActiveSession,
  useWorkoutMutations,
} from "@/lib/stores/workouts";

export const Route = createFileRoute("/app/workouts/")({
  component: WorkoutsIndex,
});

function WorkoutsIndex() {
  const navigate = useNavigate();
  const { data: templates, loading } = useWorkoutTemplates();
  const { data: groups } = useRoutineGroups();
  const { data: active } = useActiveSession();
  const { createRoutineGroup, createTemplate, startSession, deleteTemplate } =
    useWorkoutMutations();
  const [groupName, setGroupName] = useState("");
  const [newName, setNewName] = useState("");

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  const grouped = new Map<string | null, typeof templates>();
  for (const t of templates) {
    const key = t.routineGroupId ?? null;
    const arr = grouped.get(key) ?? [];
    arr.push(t);
    grouped.set(key, arr);
  }

  return (
    <div className="space-y-6">
      {active ? (
        <div className="rounded-xl border bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Workout in progress</div>
            <div className="font-medium">Resume to continue logging sets.</div>
          </div>
          <Link
            to="/app/workouts/session/$sessionId"
            params={{ sessionId: active.id }}
            className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
          >
            Resume
          </Link>
        </div>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">New routine</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!groupName.trim()) return;
            await createRoutineGroup(groupName.trim());
            setGroupName("");
          }}
          className="flex gap-2"
        >
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Routine name (e.g. Push/Pull/Legs)"
            className="flex-1 rounded-md border bg-background px-3 py-2"
          />
          <button className="rounded-md bg-secondary px-3 py-2 text-sm">Add</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">New workout</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            const id = await createTemplate({
              name: newName.trim(),
              notes: null,
              routineGroupId: null,
              routineOrder: null,
            });
            setNewName("");
            await navigate({ to: "/app/workouts/$id", params: { id } });
          }}
          className="flex gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Workout name (e.g. Push Day)"
            className="flex-1 rounded-md border bg-background px-3 py-2"
          />
          <button className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm">
            Create
          </button>
        </form>
      </section>

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.id} className="space-y-2">
              <h3 className="font-medium">{g.name}</h3>
              <TemplateList
                items={grouped.get(g.id) ?? []}
                onDelete={deleteTemplate}
                onStart={async (tid) => {
                  const sid = await startSession(tid);
                  await navigate({
                    to: "/app/workouts/session/$sessionId",
                    params: { sessionId: sid },
                  });
                }}
              />
            </section>
          ))}
        </div>
      ) : null}

      <section className="space-y-2">
        <h3 className="font-medium">Unassigned</h3>
        <TemplateList
          items={grouped.get(null) ?? []}
          onDelete={deleteTemplate}
          onStart={async (tid) => {
            const sid = await startSession(tid);
            await navigate({
              to: "/app/workouts/session/$sessionId",
              params: { sessionId: sid },
            });
          }}
        />
      </section>
    </div>
  );
}

interface Template {
  id: string;
  name: string;
  notes: string | null;
}

function TemplateList({
  items,
  onDelete,
  onStart,
}: {
  items: Template[];
  onDelete: (id: string) => Promise<void>;
  onStart: (id: string) => Promise<void>;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No workouts yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li
          key={t.id}
          className="rounded-xl border bg-card p-3 flex items-center justify-between gap-2"
        >
          <Link
            to="/app/workouts/$id"
            params={{ id: t.id }}
            className="flex-1 min-w-0"
          >
            <div className="font-medium truncate">{t.name}</div>
            {t.notes ? (
              <div className="text-xs text-muted-foreground truncate">
                {t.notes}
              </div>
            ) : null}
          </Link>
          <button
            onClick={() => onStart(t.id)}
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm"
          >
            Start
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete ${t.name}?`)) void onDelete(t.id);
            }}
            className="rounded-md border px-3 py-1.5 text-sm text-destructive"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
