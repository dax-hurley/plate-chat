import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useMealLibrary,
  useNutritionMutations,
  useMealLibraryIngredients,
} from "@/lib/stores/nutrition";

export const Route = createFileRoute("/app/nutrition/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { data: items } = useMealLibrary();
  const { saveLibraryItem, deleteLibraryItem } = useNutritionMutations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {items.length} saved meals
        </h2>
        <button
          onClick={() => {
            setShowNew(true);
            setEditingId(null);
          }}
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm"
        >
          New meal
        </button>
      </div>
      {showNew ? (
        <LibraryEditor
          onSave={async (input) => {
            await saveLibraryItem(input);
            setShowNew(false);
          }}
          onCancel={() => setShowNew(false)}
        />
      ) : null}
      {items.length === 0 && !showNew ? (
        <p className="text-sm text-muted-foreground">
          No meals saved. Tap &ldquo;New meal&rdquo; to add one.
        </p>
      ) : null}
      <ul className="space-y-2">
        {items.map((m) =>
          editingId === m.id ? (
            <li key={m.id}>
              <LibraryEditor
                initial={m}
                onSave={async (input) => {
                  await saveLibraryItem({ ...input, id: m.id });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={m.id}
              className="rounded-xl border bg-card p-3 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {m.calories} kcal · P{m.proteinG} C{m.carbsG} F{m.fatG}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(m.id);
                    setShowNew(false);
                  }}
                  className="text-xs rounded-md border px-2 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${m.name}?`))
                      void deleteLibraryItem(m.id);
                  }}
                  className="text-xs rounded-md border px-2 py-1 text-destructive"
                >
                  Remove
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

interface LibraryItemEdit {
  name: string;
  instructions: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients?: Array<{ line: string; sortOrder: number }>;
}

function LibraryEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { id: string; name: string; instructions: string; calories: number; proteinG: number; carbsG: number; fatG: number };
  onSave: (input: LibraryItemEdit) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [calories, setCalories] = useState(String(initial?.calories ?? 0));
  const [proteinG, setProteinG] = useState(String(initial?.proteinG ?? 0));
  const [carbsG, setCarbsG] = useState(String(initial?.carbsG ?? 0));
  const [fatG, setFatG] = useState(String(initial?.fatG ?? 0));
  const { data: existingIngs } = useMealLibraryIngredients(initial?.id ?? null);
  const [ings, setIngs] = useState<string>(
    existingIngs.map((e) => e.line).join("\n")
  );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const lines = ings
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        await onSave({
          name,
          instructions,
          calories: Number(calories) || 0,
          proteinG: Number(proteinG) || 0,
          carbsG: Number(carbsG) || 0,
          fatG: Number(fatG) || 0,
          ingredients: lines.map((line, i) => ({ line, sortOrder: i })),
        });
      }}
      className="rounded-xl border bg-card p-3 space-y-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-4 gap-2">
        <input
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="kcal"
          inputMode="numeric"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
        <input
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          placeholder="P"
          inputMode="decimal"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
        <input
          value={carbsG}
          onChange={(e) => setCarbsG(e.target.value)}
          placeholder="C"
          inputMode="decimal"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
        <input
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
          placeholder="F"
          inputMode="decimal"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
      </div>
      <textarea
        value={ings}
        onChange={(e) => setIngs(e.target.value)}
        placeholder="Ingredients (one per line)"
        rows={4}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Instructions"
        rows={3}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button className="flex-1 rounded-md bg-primary text-primary-foreground py-2 text-sm">
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
