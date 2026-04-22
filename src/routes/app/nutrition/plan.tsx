import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  usePlanForWeek,
  usePlanSlots,
  useMealPlanMutations,
} from "@/lib/stores/meal-plan";
import { useMealLibrary } from "@/lib/stores/nutrition";
import { useOnline } from "@/lib/client/use-online";
import { authFetch } from "@/lib/client/auth-fetch";

export const Route = createFileRoute("/app/nutrition/plan")({
  component: PlanPage,
});

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function toKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function weekStart(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_SLOTS = [
  { slotIndex: 0, slotKind: "meal" as const, label: "Breakfast" },
  { slotIndex: 1, slotKind: "meal" as const, label: "Lunch" },
  { slotIndex: 2, slotKind: "meal" as const, label: "Dinner" },
  { slotIndex: 3, slotKind: "snack" as const, label: "Snack" },
];

function PlanPage() {
  const online = useOnline();
  const [anchor, setAnchor] = useState(() => weekStart(new Date()));
  const weekKey = toKey(anchor);
  const { data: plan } = usePlanForWeek(weekKey);
  const { data: slots } = usePlanSlots(plan?.id ?? null);
  const { data: library } = useMealLibrary();
  const { ensurePlan, setSlotMeal, clearSlot } = useMealPlanMutations();

  useEffect(() => {
    if (!plan) void ensurePlan(weekKey);
  }, [plan, weekKey, ensurePlan]);

  const libMap = useMemo(
    () => new Map(library.map((l) => [l.id, l.name])),
    [library]
  );

  const slotIndex = useMemo(() => {
    const m = new Map<string, (typeof slots)[number]>();
    for (const s of slots) m.set(`${s.dayIndex}:${s.slotIndex}`, s);
    return m;
  }, [slots]);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const shoppingList = useMemo(() => {
    if (!plan?.aiShoppingListJson) return [] as string[];
    try {
      const raw = JSON.parse(plan.aiShoppingListJson) as unknown;
      if (!Array.isArray(raw)) return [];
      return raw.map(String);
    } catch {
      return [];
    }
  }, [plan?.aiShoppingListJson]);

  const onGenerate = async () => {
    if (!plan) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await authFetch("/api/nutrition/meal-plan/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      if (!res.ok) {
        setGenError(`Failed (${res.status})`);
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(anchor);
              d.setDate(d.getDate() - 7);
              setAnchor(d);
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            ←
          </button>
          <div className="text-sm font-medium">Week of {weekKey}</div>
          <button
            onClick={() => {
              const d = new Date(anchor);
              d.setDate(d.getDate() + 7);
              setAnchor(d);
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {DAY_LABELS.map((label, dayIndex) => (
          <div key={dayIndex} className="rounded-xl border bg-card p-2 space-y-2">
            <div className="text-sm font-medium">{label}</div>
            {DEFAULT_SLOTS.map((ds) => {
              const existing = slotIndex.get(`${dayIndex}:${ds.slotIndex}`);
              return (
                <div key={ds.slotIndex} className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {ds.label}
                  </div>
                  <div className="flex gap-1">
                    <select
                      value={existing?.libraryItemId ?? ""}
                      onChange={(e) => {
                        if (!plan) return;
                        const libId = e.target.value || null;
                        const libName = libId ? libMap.get(libId) : null;
                        void setSlotMeal(plan.id, dayIndex, ds.slotIndex, {
                          slotKind: ds.slotKind,
                          label: libName ?? ds.label,
                          libraryItemId: libId,
                        });
                      }}
                      className="flex-1 min-w-0 rounded-md border bg-background px-2 py-1 text-xs"
                    >
                      <option value="">—</option>
                      {library.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    {existing ? (
                      <button
                        onClick={() =>
                          plan &&
                          clearSlot(plan.id, dayIndex, ds.slotIndex)
                        }
                        className="rounded-md border px-2 text-xs text-destructive"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Shopping list</h3>
          <button
            onClick={onGenerate}
            disabled={!online || generating || !plan}
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm disabled:opacity-60"
            title={online ? "" : "Offline — reconnect to generate"}
          >
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
        {!online ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Offline — last generated list is still readable below.
          </p>
        ) : null}
        {genError ? <p className="text-xs text-destructive">{genError}</p> : null}
        {shoppingList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No shopping list yet. Fill the plan then generate.
          </p>
        ) : (
          <ul className="text-sm space-y-1 list-disc pl-5">
            {shoppingList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
