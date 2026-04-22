import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useScheduledItems,
} from "@/lib/stores/schedule";
import { useWorkoutTemplates } from "@/lib/stores/workouts";

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function CalendarPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const { startKey, endKey, days } = useMemo(() => {
    const start = new Date(anchor);
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    const cur = new Date(start);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return {
      startKey: dayKey(days[0]),
      endKey: dayKey(days[days.length - 1]),
      days,
    };
  }, [anchor]);

  const { data: items } = useScheduledItems(startKey, endKey);
  const { data: templates } = useWorkoutTemplates();
  const tmap = useMemo(
    () => new Map(templates.map((t) => [t.id, t.name])),
    [templates]
  );
  const byDay = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) {
      const arr = m.get(it.dayKey) ?? [];
      arr.push(it);
      m.set(it.dayKey, arr);
    }
    return m;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {anchor.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(anchor);
              d.setMonth(d.getMonth() - 1);
              setAnchor(d);
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            ←
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-md border px-2 py-1 text-sm"
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date(anchor);
              d.setMonth(d.getMonth() + 1);
              setAnchor(d);
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = dayKey(d);
          const scheduled = byDay.get(key) ?? [];
          const inMonth = d.getMonth() === anchor.getMonth();
          const today = key === dayKey(new Date());
          return (
            <div
              key={key}
              className={
                "rounded-md border min-h-24 p-1 text-xs " +
                (inMonth ? "" : "opacity-40 ") +
                (today ? "border-primary" : "")
              }
            >
              <div className="font-medium">{d.getDate()}</div>
              <ul className="space-y-0.5">
                {scheduled.map((s) => (
                  <li
                    key={s.id}
                    className="rounded bg-primary/10 px-1 py-0.5 truncate"
                  >
                    {tmap.get(s.templateId) ?? "Workout"}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Schedule workouts from{" "}
        <Link
          to="/app/workouts/calendar"
          className="text-primary hover:underline"
        >
          the workouts calendar
        </Link>
        .
      </p>
    </div>
  );
}
