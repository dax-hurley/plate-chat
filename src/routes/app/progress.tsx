import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useVitals, useProgressMutations } from "@/lib/stores/progress";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

const VITALS = [
  { key: "weight", label: "Weight (lb)" },
  { key: "body_fat", label: "Body fat %" },
  { key: "waist", label: "Waist (in)" },
] as const;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ProgressPage() {
  const [vitalKey, setVitalKey] = useState<(typeof VITALS)[number]["key"]>(
    "weight"
  );
  const { data: entries } = useVitals(vitalKey);
  const { setVital, clearVital } = useProgressMutations();
  const [dayKey, setDayKey] = useState(todayKey);
  const [value, setValue] = useState("");

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.dayKey.localeCompare(a.dayKey)),
    [entries]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Progress</h1>
      <div className="flex gap-2">
        {VITALS.map((v) => (
          <button
            key={v.key}
            onClick={() => setVitalKey(v.key)}
            className={
              "rounded-md px-3 py-1.5 text-sm " +
              (vitalKey === v.key
                ? "bg-primary text-primary-foreground"
                : "border")
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const n = Number(value);
          if (!Number.isFinite(n)) return;
          await setVital(vitalKey, dayKey, n);
          setValue("");
        }}
        className="rounded-xl border bg-card p-3 flex items-end gap-2"
      >
        <label className="flex-1">
          <span className="text-xs text-muted-foreground">Date</span>
          <input
            type="date"
            value={dayKey}
            onChange={(e) => setDayKey(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex-1">
          <span className="text-xs text-muted-foreground">Value</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </label>
        <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm">
          Save
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
            >
              <span>{e.dayKey}</span>
              <span className="font-medium">{e.value}</span>
              <button
                onClick={() => clearVital(vitalKey, e.dayKey)}
                className="text-xs text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
