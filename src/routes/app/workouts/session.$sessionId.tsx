import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useSession,
  useTemplateItems,
  useExercises,
  useSessionSets,
  useWorkoutMutations,
} from "@/lib/stores/workouts";

export const Route = createFileRoute("/app/workouts/session/$sessionId")({
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession(sessionId);
  const { data: plan } = useTemplateItems(session?.templateId ?? null);
  const { data: sets } = useSessionSets(sessionId);
  const { data: exercises } = useExercises();
  const { logSet, deleteSet, finishSession } = useWorkoutMutations();

  const exerciseMap = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    for (const e of exercises) m.set(e.id, { id: e.id, name: e.name });
    return m;
  }, [exercises]);

  const setsByExercise = useMemo(() => {
    const m = new Map<string, typeof sets>();
    for (const s of sets) {
      const arr = m.get(s.exerciseId) ?? [];
      arr.push(s);
      m.set(s.exerciseId, arr);
    }
    return m;
  }, [sets]);

  if (!session) return <p className="text-muted-foreground">Loading…</p>;

  const exerciseOrder =
    plan.length > 0
      ? plan.map((p) => p.exerciseId)
      : Array.from(setsByExercise.keys());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/app/workouts" className="text-sm text-muted-foreground">
          ← Back
        </Link>
        {session.status === "active" ? (
          <button
            onClick={async () => {
              await finishSession(session.id);
              await navigate({ to: "/app/workouts" });
            }}
            className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
          >
            Finish workout
          </button>
        ) : (
          <span className="text-sm text-muted-foreground capitalize">
            {session.status}
          </span>
        )}
      </div>

      <div>
        <div className="text-sm text-muted-foreground">Started</div>
        <div className="font-medium">
          {new Date(session.startedAt).toLocaleString()}
        </div>
      </div>

      {exerciseOrder.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No exercises yet. Use the form below to log sets.
        </p>
      ) : (
        <div className="space-y-4">
          {exerciseOrder.map((exId) => {
            const ex = exerciseMap.get(exId);
            const planItem = plan.find((p) => p.exerciseId === exId);
            const exSets = setsByExercise.get(exId) ?? [];
            return (
              <ExerciseBlock
                key={exId}
                name={ex?.name ?? "Exercise"}
                exerciseId={exId}
                target={planItem?.targetSets ?? null}
                sets={exSets}
                disabled={session.status !== "active"}
                onLog={async (reps, weight) => {
                  await logSet({
                    sessionId: session.id,
                    exerciseId: exId,
                    setIndex: exSets.length,
                    reps,
                    durationSec: null,
                    distance: null,
                    weight,
                    rpe: null,
                  });
                }}
                onDelete={(sid) => deleteSet(sid)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SetRow {
  id: string;
  reps: number | null;
  weight: number;
  setIndex: number;
}

function ExerciseBlock({
  name,
  target,
  sets,
  onLog,
  onDelete,
  disabled,
}: {
  name: string;
  exerciseId: string;
  target: number | null;
  sets: SetRow[];
  onLog: (reps: number, weight: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled: boolean;
}) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  return (
    <section className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{name}</h3>
        {target ? (
          <div className="text-xs text-muted-foreground">
            {sets.length} / {target} sets
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {sets.length} sets
          </div>
        )}
      </div>

      {sets.length > 0 ? (
        <ul className="space-y-1">
          {sets.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between text-sm"
            >
              <span>
                Set {i + 1}: {s.reps ?? "–"} reps @ {s.weight}
              </span>
              <button
                onClick={() => onDelete(s.id)}
                disabled={disabled}
                className="text-xs text-destructive disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {disabled ? null : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const r = Number(reps);
            const w = Number(weight);
            if (!Number.isFinite(r) || !Number.isFinite(w)) return;
            await onLog(r, w);
            setReps("");
            setWeight("");
          }}
          className="flex gap-2 pt-2"
        >
          <input
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            inputMode="numeric"
            placeholder="Reps"
            className="w-24 rounded-md border bg-background px-2 py-1 text-sm"
          />
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="decimal"
            placeholder="Weight"
            className="w-24 rounded-md border bg-background px-2 py-1 text-sm"
          />
          <button className="rounded-md bg-primary text-primary-foreground px-3 py-1 text-sm">
            Log
          </button>
        </form>
      )}
    </section>
  );
}
