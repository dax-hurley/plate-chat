import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useScheduledItems,
  useScheduleMutations,
} from "@/lib/stores/schedule";
import { useWorkoutTemplates } from "@/lib/stores/workouts";

export const Route = createFileRoute("/app/workouts/calendar")({
  component: WorkoutCalendar,
});

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function WorkoutCalendar() {
  const [anchor, setAnchor] = useState(() => new Date());
  const { startKey, endKey, days } = useMemo(() => {
    const start = new Date(anchor);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 27);
    const days: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return { startKey: dayKey(start), endKey: dayKey(end), days };
  }, [anchor]);

  const { data: items } = useScheduledItems(startKey, endKey);
  const { data: templates } = useWorkoutTemplates();
  const { scheduleTemplate, unschedule } = useScheduleMutations();

  const templateMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of templates) m.set(t.id, t.name);
    return m;
  }, [templates]);

  const byDay = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) {
      const arr = m.get(it.dayKey) ?? [];
      arr.push(it);
      m.set(it.dayKey, arr);
    }
    return m;
  }, [items]);

  const [pickerDay, setPickerDay] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/app/workouts" className="text-sm text-muted-foreground">
          ← Back to routines
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(anchor);
              d.setDate(d.getDate() - 28);
              setAnchor(d);
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            ←
          </button>
          <div className="text-sm">
            {days[0].toLocaleDateString()} – {days[days.length - 1].toLocaleDateString()}
          </div>
          <button
            onClick={() => {
              const d = new Date(anchor);
              d.setDate(d.getDate() + 28);
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
          const today = key === dayKey(new Date());
          return (
            <button
              key={key}
              onClick={() => setPickerDay(key)}
              className={
                "rounded-md border min-h-20 p-1 text-left text-xs hover:bg-muted " +
                (today ? "border-primary" : "")
              }
            >
              <div className="font-medium">{d.getDate()}</div>
              <div className="space-y-0.5">
                {scheduled.map((s) => (
                  <div
                    key={s.id}
                    className="rounded bg-primary/10 px-1 py-0.5 truncate"
                  >
                    {templateMap.get(s.templateId) ?? "Workout"}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {pickerDay ? (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{pickerDay}</h3>
            <button
              onClick={() => setPickerDay(null)}
              className="text-xs text-muted-foreground"
            >
              Close
            </button>
          </div>
          <ul className="space-y-1">
            {(byDay.get(pickerDay) ?? []).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{templateMap.get(s.templateId) ?? "Workout"}</span>
                <button
                  onClick={() => unschedule(s.id)}
                  className="text-xs text-destructive"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const tid = fd.get("templateId") as string;
              if (!tid) return;
              void scheduleTemplate(tid, pickerDay);
              e.currentTarget.reset();
            }}
            className="flex gap-2"
          >
            <select
              name="templateId"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Schedule a workout…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-secondary px-3 py-2 text-sm">
              Add
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
