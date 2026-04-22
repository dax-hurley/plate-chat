import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useMealsOnDay,
  useNutritionMutations,
  useMealLibrary,
  useMealEntries,
} from "@/lib/stores/nutrition";

export const Route = createFileRoute("/app/nutrition/")({
  component: NutritionLogPage,
});

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function NutritionLogPage() {
  const [dayKey, setDayKey] = useState(todayKey);
  const { data: meals } = useMealsOnDay(dayKey);
  const { data: library } = useMealLibrary();
  const { logMeal, deleteMeal } = useNutritionMutations();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="date"
          value={dayKey}
          onChange={(e) => setDayKey(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <LogMealForm
        library={library}
        onLog={async (args) => {
          await logMeal({
            dayKey,
            name: args.name,
            sourceLibraryItemId: args.sourceLibraryItemId,
            entries:
              args.calories > 0
                ? [
                    {
                      description: args.name,
                      calories: args.calories,
                      proteinG: args.proteinG,
                      carbsG: args.carbsG,
                      fatG: args.fatG,
                    },
                  ]
                : [],
          });
        }}
      />

      <MealsList
        meals={meals}
        onDelete={deleteMeal}
        onToggle={(id) => setExpanded(expanded === id ? null : id)}
        expandedId={expanded}
      />
    </div>
  );
}

function LogMealForm({
  library,
  onLog,
}: {
  library: { id: string; name: string; calories: number; proteinG: number; carbsG: number; fatG: number }[];
  onLog: (args: {
    name: string;
    sourceLibraryItemId: string | null;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [fromLib, setFromLib] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");

  const libMap = useMemo(() => new Map(library.map((l) => [l.id, l])), [library]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const base = fromLib ? libMap.get(fromLib) : null;
        await onLog({
          name: name || base?.name || "Meal",
          sourceLibraryItemId: fromLib || null,
          calories: Number(calories) || base?.calories || 0,
          proteinG: Number(proteinG) || base?.proteinG || 0,
          carbsG: Number(carbsG) || base?.carbsG || 0,
          fatG: Number(fatG) || base?.fatG || 0,
        });
        setName("");
        setFromLib("");
        setCalories("");
        setProteinG("");
        setCarbsG("");
        setFatG("");
      }}
      className="rounded-xl border bg-card p-3 space-y-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <select
          value={fromLib}
          onChange={(e) => {
            const id = e.target.value;
            setFromLib(id);
            const base = libMap.get(id);
            if (base) {
              setName(base.name);
              setCalories(String(base.calories));
              setProteinG(String(base.proteinG));
              setCarbsG(String(base.carbsG));
              setFatG(String(base.fatG));
            }
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">From library…</option>
          {library.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Meal name"
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <input
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          inputMode="numeric"
          placeholder="kcal"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
        <input
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          inputMode="decimal"
          placeholder="P (g)"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
        <input
          value={carbsG}
          onChange={(e) => setCarbsG(e.target.value)}
          inputMode="decimal"
          placeholder="C (g)"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
        <input
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
          inputMode="decimal"
          placeholder="F (g)"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
      </div>
      <button className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm">
        Log meal
      </button>
    </form>
  );
}

function MealsList({
  meals,
  onDelete,
  onToggle,
  expandedId,
}: {
  meals: { id: string; name: string; loggedAt: number }[];
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string) => void;
  expandedId: string | null;
}) {
  if (meals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No meals logged today.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {meals.map((m) => (
        <li key={m.id} className="rounded-xl border bg-card">
          <button
            onClick={() => onToggle(m.id)}
            className="w-full flex items-center justify-between p-3 text-left"
          >
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(m.loggedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete meal?")) void onDelete(m.id);
              }}
              className="text-xs text-destructive"
            >
              Remove
            </button>
          </button>
          {expandedId === m.id ? <MealDetail mealId={m.id} /> : null}
        </li>
      ))}
    </ul>
  );
}

function MealDetail({ mealId }: { mealId: string }) {
  const { data: entries } = useMealEntries(mealId);
  if (entries.length === 0)
    return (
      <div className="px-3 pb-3 text-xs text-muted-foreground">
        No entries.
      </div>
    );
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
  return (
    <div className="px-3 pb-3 space-y-1">
      <ul className="text-sm space-y-1">
        {entries.map((e) => (
          <li key={e.id} className="flex justify-between">
            <span>{e.description}</span>
            <span className="text-muted-foreground">
              {e.calories} kcal · P{e.proteinG} C{e.carbsG} F{e.fatG}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t pt-1 text-xs text-muted-foreground flex justify-between">
        <span>Total</span>
        <span>
          {totals.calories} kcal · P{totals.proteinG} C{totals.carbsG} F
          {totals.fatG}
        </span>
      </div>
    </div>
  );
}
