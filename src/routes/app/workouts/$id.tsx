import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useWorkoutTemplate,
  useTemplateItems,
  useExercises,
  useWorkoutMutations,
} from "@/lib/stores/workouts";

export const Route = createFileRoute("/app/workouts/$id")({
  component: TemplatePage,
});

function TemplatePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: template } = useWorkoutTemplate(id);
  const { data: items } = useTemplateItems(id);
  const { data: exercises } = useExercises();
  const {
    updateTemplate,
    addTemplateItem,
    updateTemplateItem,
    deleteTemplateItem,
    startSession,
  } = useWorkoutMutations();

  const [name, setName] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  const displayedName = name ?? template?.name ?? "";
  const displayedNotes = notes ?? template?.notes ?? "";

  const exerciseMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of exercises) m.set(e.id, e.name);
    return m;
  }, [exercises]);

  if (!template) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/app/workouts" className="text-sm text-muted-foreground">
          ← Back
        </Link>
        <button
          onClick={async () => {
            const sid = await startSession(id);
            await navigate({
              to: "/app/workouts/session/$sessionId",
              params: { sessionId: sid },
            });
          }}
          className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
        >
          Start workout
        </button>
      </div>

      <section className="space-y-2">
        <input
          className="w-full text-2xl font-semibold bg-transparent border-b py-1"
          value={displayedName}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== null && name !== template.name) {
              void updateTemplate(id, { name });
            }
          }}
        />
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Notes"
          value={displayedNotes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== null && notes !== (template.notes ?? "")) {
              void updateTemplate(id, { notes: notes || null });
            }
          }}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Exercises</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exercises yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, idx) => (
              <li
                key={it.id}
                className="rounded-xl border bg-card p-3 flex items-center gap-3"
              >
                <span className="text-xs text-muted-foreground w-6">
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {exerciseMap.get(it.exerciseId) ?? "Exercise"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {it.targetSets} sets
                    {it.targetReps ? ` × ${it.targetReps} reps` : ""}
                    {it.defaultWeight
                      ? ` @ ${it.defaultWeight}${it.weightUnit ?? ""}`
                      : ""}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = prompt("Target sets", String(it.targetSets));
                    if (!next) return;
                    const n = Number(next);
                    if (!Number.isFinite(n) || n < 1) return;
                    void updateTemplateItem(it.id, { targetSets: n });
                  }}
                  className="rounded-md border px-2 py-1 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Remove exercise?"))
                      void deleteTemplateItem(it.id);
                  }}
                  className="rounded-md border px-2 py-1 text-xs text-destructive"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <AddExerciseForm
          onAdd={async (exerciseId) => {
            const order = items.length;
            await addTemplateItem({
              templateId: id,
              exerciseId,
              order,
              targetSets: 3,
              targetReps: 8,
              targetDurationSec: null,
              targetDistance: null,
              defaultWeight: null,
              weightUnit: "lb",
              progressiveOverloadEnabled: false,
              progressiveOverloadIncrement: null,
              progressiveOverloadRequireFullCompletion: false,
              trackWeight: true,
              logTimeForDistanceSets: false,
            });
          }}
          exercises={exercises}
        />
      </section>
    </div>
  );
}

function AddExerciseForm({
  onAdd,
  exercises,
}: {
  onAdd: (exerciseId: string) => Promise<void>;
  exercises: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<string>("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!selected) return;
        await onAdd(selected);
        setSelected("");
      }}
      className="flex gap-2"
    >
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 rounded-md border bg-background px-3 py-2"
      >
        <option value="">Add exercise…</option>
        {exercises.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!selected}
        className="rounded-md bg-secondary px-3 py-2 text-sm disabled:opacity-60"
      >
        Add
      </button>
    </form>
  );
}
