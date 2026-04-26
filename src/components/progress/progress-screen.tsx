import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";

import {
  AppSubNav,
  appSubNavTriggerClassName,
} from "@/components/app/app-sub-nav";
import { LineChart } from "@/components/progress/line-chart";
import { QuickLogWeightWidget } from "@/components/progress/quick-log-weight-widget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutocompleteCombobox } from "@/components/ui/autocomplete-combobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bmiCategory, bmiFromLbIn } from "@/lib/bmi";
import { formatDayKey, addDaysKey } from "@/lib/date-key";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import {
  useExercises,
  useLocalSession,
  useProfile,
  useProgressMutations,
} from "@/lib/stores";
import { VITAL_KEYS, type VitalKey, vitalKeyLabel } from "@/lib/vitals-keys";
import { cn } from "@/lib/utils";

type ProgressSection = "charts" | "vitals";

type VitalRow = {
  id: string;
  userId: string;
  vitalKey: string;
  dayKey: string;
  value: number;
  recordedAt: number;
  deletedAt: number | null;
};

type WorkoutSetRow = {
  id: string;
  sessionId: string;
  exerciseId: string;
  reps: number | null;
  weight: number;
  durationSec: number | null;
  distance: number | null;
  completedAt: number;
  deletedAt: number | null;
};

type MealRow = { id: string; dayKey: string; deletedAt: number | null };
type MealEntryRow = {
  id: string;
  mealId: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  deletedAt: number | null;
};

function dayKeyFromDateInput(v: string): string {
  return v.trim() || formatDayKey();
}

function BmiScale({ bmi }: { bmi: number }) {
  const min = 16;
  const max = 40;
  const pct = Math.min(100, Math.max(0, ((bmi - min) / (max - min)) * 100));
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex justify-between text-[0.65rem] font-medium uppercase tracking-wide">
        <span>16</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>40</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 w-[18%] bg-sky-500/40" />
        <div
          className="absolute inset-y-0 bg-emerald-500/35"
          style={{ left: "18%", width: "25%" }}
        />
        <div
          className="absolute inset-y-0 bg-amber-500/35"
          style={{ left: "43%", width: "20%" }}
        />
        <div
          className="absolute inset-y-0 rounded-r-full bg-rose-500/35"
          style={{ left: "63%", width: "37%" }}
        />
        <div
          className="border-background absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-primary shadow-md"
          style={{ left: `${pct}%` }}
          aria-label={`BMI ${bmi.toFixed(1)} on scale`}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Bands are approximate WHO-style cutoffs (16–40 scale for display).
      </p>
    </div>
  );
}

function useVitalsInRange(fromDayKey: string, toDayKey: string) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<VitalRow>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.userVitalEntries
        .where("[userId+dayKey]")
        .between([userId, fromDayKey], [userId, toDayKey])
        .toArray()) as unknown as VitalRow[];
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId, fromDayKey, toDayKey]
  );
}

function useMealsAndEntriesInRange(fromDayKey: string, toDayKey: string) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<{ meal: MealRow; entries: MealEntryRow[] }>(
    async () => {
      if (!db || !userId) return [];
      const meals = (await db.meals
        .where("[userId+dayKey+loggedAt]")
        .between(
          [userId, fromDayKey, 0],
          [userId, toDayKey, Number.MAX_SAFE_INTEGER]
        )
        .toArray()) as unknown as MealRow[];
      const alive = meals.filter((m) => m.deletedAt === null);
      const out: { meal: MealRow; entries: MealEntryRow[] }[] = [];
      for (const m of alive) {
        const entries = (await db.mealEntries
          .where("mealId")
          .equals(m.id)
          .toArray()) as unknown as MealEntryRow[];
        out.push({
          meal: m,
          entries: entries.filter((e) => e.deletedAt === null),
        });
      }
      return out;
    },
    [db, userId, fromDayKey, toDayKey]
  );
}

function useSetsForExercise(
  exerciseId: string | null,
  fromDayKey: string,
  toDayKey: string
) {
  const { db } = useDb();
  return useLiveArray<WorkoutSetRow>(
    async () => {
      if (!db || !exerciseId) return [];
      const sets = (await db.workoutSets
        .filter(
          (r) =>
            (r as unknown as WorkoutSetRow).exerciseId === exerciseId &&
            r.deletedAt === null
        )
        .toArray()) as unknown as WorkoutSetRow[];
      return sets.filter((s) => {
        const d = new Date(s.completedAt);
        const dk = formatDayKey(d);
        return dk >= fromDayKey && dk <= toDayKey;
      });
    },
    [db, exerciseId, fromDayKey, toDayKey]
  );
}

export function ProgressScreen({
  defaultFrom,
  defaultTo,
  loseWeightQuickLog = false,
  quickLogInitialWeightLb = null,
}: {
  defaultFrom: string;
  defaultTo: string;
  loseWeightQuickLog?: boolean;
  quickLogInitialWeightLb?: number | null;
}) {
  const { data: exercises } = useExercises();
  const { data: profile } = useProfile();
  const { setVital } = useProgressMutations();
  const [section, setSection] = useState<ProgressSection>("charts");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [exerciseId, setExerciseId] = useState<string>("");

  useEffect(() => {
    if (exercises.length === 0) return;
    if (!exerciseId || !exercises.some((e) => e.id === exerciseId)) {
      setExerciseId(exercises[0]!.id);
    }
  }, [exercises, exerciseId]);

  const vitalRows = useVitalsInRange(from, to).data;
  const mealBundles = useMealsAndEntriesInRange(from, to).data;
  const exerciseSets = useSetsForExercise(exerciseId || null, from, to).data;

  const exerciseComboboxOptions = useMemo(
    () => exercises.map((ex) => ({ value: ex.id, label: ex.name })),
    [exercises]
  );
  const selectedExercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId),
    [exercises, exerciseId]
  );
  const exerciseName = selectedExercise?.name ?? "Exercise";

  /** latest vital per key within range (most recent dayKey wins). */
  const latest = useMemo(() => {
    const out: Record<string, { value: number; dayKey: string }> = {};
    for (const r of vitalRows) {
      const cur = out[r.vitalKey];
      if (!cur || r.dayKey > cur.dayKey) {
        out[r.vitalKey] = { value: r.value, dayKey: r.dayKey };
      }
    }
    return out;
  }, [vitalRows]);

  const weightSeries = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const r of vitalRows) {
      if (r.vitalKey !== "body_weight_lb") continue;
      byDay.set(r.dayKey, r.value);
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dayKey, value]) => ({ dayKey, value }));
  }, [vitalRows]);

  const bmiSeries = useMemo(() => {
    const h = profile?.heightIn;
    if (!h || !Number.isFinite(h)) return [];
    return weightSeries.map((p) => ({
      dayKey: p.dayKey,
      value: bmiFromLbIn(p.value, h),
    }));
  }, [weightSeries, profile]);

  const currentBmi = useMemo(() => {
    const w = latest.body_weight_lb?.value;
    const h = profile?.heightIn;
    if (w == null || h == null) return null;
    return bmiFromLbIn(w, h);
  }, [latest, profile]);

  const macroSeries = useMemo(() => {
    const byDay = new Map<
      string,
      { calories: number; proteinG: number; carbsG: number; fatG: number }
    >();
    for (const { meal, entries } of mealBundles) {
      const cur = byDay.get(meal.dayKey) ?? {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      };
      for (const e of entries) {
        cur.calories += e.calories;
        cur.proteinG += e.proteinG;
        cur.carbsG += e.carbsG;
        cur.fatG += e.fatG;
      }
      byDay.set(meal.dayKey, cur);
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dayKey, totals]) => ({ dayKey, ...totals }));
  }, [mealBundles]);

  const exerciseSeries = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const s of exerciseSets) {
      const dk = formatDayKey(new Date(s.completedAt));
      const v = s.weight ?? 0;
      byDay.set(dk, Math.max(byDay.get(dk) ?? 0, v));
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dayKey, value]) => ({ dayKey, value }));
  }, [exerciseSets]);

  async function onVitalsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const today = formatDayKey();
    try {
      for (const k of VITAL_KEYS) {
        const raw = String(fd.get(k) ?? "").trim();
        if (raw === "") continue;
        const n = Number(raw);
        if (!Number.isFinite(n)) continue;
        await setVital(k, today, n);
      }
      toast.success("Vitals saved");
    } catch {
      toast.error("Could not save vitals");
    }
  }

  const vitalsFormKey = useMemo(
    () =>
      VITAL_KEYS.map(
        (k) => `${k}:${latest[k]?.dayKey ?? ""}:${latest[k]?.value ?? ""}`
      ).join("|"),
    [latest]
  );

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 lg:max-w-6xl">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <Activity className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          Progress
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Track lifts, nutrition, weight, and vitals over time.
        </p>
      </div>

      <AppSubNav aria-label="Progress sections">
        <button
          type="button"
          role="tab"
          aria-selected={section === "charts"}
          className={cn(appSubNavTriggerClassName(section === "charts"))}
          onClick={() => setSection("charts")}
        >
          Progress
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "vitals"}
          className={cn(appSubNavTriggerClassName(section === "vitals"))}
          onClick={() => setSection("vitals")}
        >
          Vitals
        </button>
      </AppSubNav>

      {loseWeightQuickLog ? (
        <QuickLogWeightWidget
          initialLatestLb={
            latest.body_weight_lb?.value ?? quickLogInitialWeightLb
          }
        />
      ) : null}

      {section === "charts" ? (
        <div className="space-y-6">
          <Card className="border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Date range</CardTitle>
              <CardDescription>
                Charts and the vitals log use this inclusive range.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  className="min-h-12 text-base"
                  onChange={(e) =>
                    setFrom(dayKeyFromDateInput(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  className="min-h-12 text-base"
                  onChange={(e) => setTo(dayKeyFromDateInput(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {currentBmi != null && Number.isFinite(currentBmi) ? (
              <Card className="border-primary/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Current BMI</CardTitle>
                  <CardDescription>
                    From your latest logged weight and your saved height.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-semibold tabular-nums">
                      {currentBmi.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {bmiCategory(currentBmi)} · weight day{" "}
                      {latest.body_weight_lb?.dayKey ?? "—"} · height{" "}
                      {profile?.heightIn != null
                        ? `${profile.heightIn.toFixed(1)} in`
                        : "—"}
                    </span>
                  </div>
                  <BmiScale bmi={currentBmi} />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Current BMI</CardTitle>
                  <CardDescription>
                    Log weight in Vitals and save your height in Profile to see
                    BMI.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card className="border-primary/15">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg">Exercise progress</CardTitle>
                    <CardDescription>
                      Max load logged per calendar day on completed workouts.
                    </CardDescription>
                  </div>
                  <div className="min-w-0 space-y-2 sm:max-w-sm sm:shrink-0">
                    <Label htmlFor="exercise-progress-exercise">Exercise</Label>
                    {exercises.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No exercises yet.
                      </p>
                    ) : (
                      <AutocompleteCombobox
                        id="exercise-progress-exercise"
                        aria-label="Exercise for progress chart"
                        options={exerciseComboboxOptions}
                        value={exerciseId || null}
                        onValueChange={(v) => {
                          if (v) setExerciseId(v);
                        }}
                        placeholder="Search or choose an exercise…"
                        emptyText="No exercises match your search."
                        inputClassName="min-h-12 text-base"
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <LineChart
                  series={[
                    {
                      name: `${exerciseName} — max load`,
                      color: "oklch(0.55 0.18 250)",
                      points: exerciseSeries.map((p) => ({
                        x: p.dayKey,
                        y: p.value,
                      })),
                    },
                  ]}
                  height={220}
                  valueFormat={(n) => String(Math.round(n * 10) / 10)}
                  yAxisLabel="Weight (lb)"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Macros</CardTitle>
              <CardDescription>
                Daily totals from your nutrition log.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Calories
                </p>
                <LineChart
                  series={[
                    {
                      name: "Calories",
                      color: "oklch(0.62 0.19 35)",
                      points: macroSeries.map((p) => ({
                        x: p.dayKey,
                        y: p.calories,
                      })),
                    },
                  ]}
                  height={200}
                  valueFormat={(n) => String(Math.round(n))}
                  yAxisLabel="Calories (kcal)"
                />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Macros (g)
                </p>
                <LineChart
                  series={[
                    {
                      name: "Protein (g)",
                      color: "oklch(0.55 0.16 145)",
                      points: macroSeries.map((p) => ({
                        x: p.dayKey,
                        y: p.proteinG,
                      })),
                    },
                    {
                      name: "Carbs (g)",
                      color: "oklch(0.65 0.14 85)",
                      points: macroSeries.map((p) => ({
                        x: p.dayKey,
                        y: p.carbsG,
                      })),
                    },
                    {
                      name: "Fat (g)",
                      color: "oklch(0.6 0.14 300)",
                      points: macroSeries.map((p) => ({
                        x: p.dayKey,
                        y: p.fatG,
                      })),
                    },
                  ]}
                  height={220}
                  valueFormat={(n) => String(Math.round(n * 10) / 10)}
                  yAxisLabel="Macros (g)"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Weight and BMI</CardTitle>
              <CardDescription>
                Weight from vitals. BMI uses your saved height.
                {profile?.heightIn != null && (
                  <span className="mt-1 block">
                    Height for BMI: {profile.heightIn.toFixed(1)} in
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Weight
                </p>
                <LineChart
                  series={[
                    {
                      name: "Weight (lb)",
                      color: "oklch(0.5 0.12 240)",
                      points: weightSeries.map((p) => ({
                        x: p.dayKey,
                        y: p.value,
                      })),
                    },
                  ]}
                  height={200}
                  valueFormat={(n) => String(Math.round(n * 10) / 10)}
                  yAxisLabel="Weight (lb)"
                />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  BMI
                </p>
                <LineChart
                  series={[
                    {
                      name: "BMI",
                      color: "oklch(0.55 0.14 195)",
                      points: bmiSeries
                        .filter((p): p is { dayKey: string; value: number } =>
                          p.value != null
                        )
                        .map((p) => ({ x: p.dayKey, y: p.value })),
                    },
                  ]}
                  height={200}
                  valueFormat={(n) => String(Math.round(n * 10) / 10)}
                  yAxisLabel="BMI"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Card className="border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Log vitals</CardTitle>
              <CardDescription>
                Entries are always for today. Saving again today replaces that
                day&apos;s value for each metric you enter.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form
                key={vitalsFormKey}
                onSubmit={onVitalsSubmit}
                className="bg-card border-primary/15 space-y-4 rounded-xl border p-4 shadow-sm"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {VITAL_KEYS.map((key: VitalKey) => {
                    const entry = latest[key];
                    const defaultValue =
                      entry != null && Number.isFinite(entry.value)
                        ? String(entry.value)
                        : undefined;
                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{vitalKeyLabel(key)}</Label>
                        <Input
                          id={key}
                          name={key}
                          type="number"
                          inputMode="decimal"
                          step="any"
                          placeholder="—"
                          className="min-h-12 text-base"
                          defaultValue={defaultValue}
                        />
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="submit"
                  className="min-h-12 w-full gap-2 text-base shadow-sm"
                >
                  Save vitals
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-primary/15 lg:min-h-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Vitals log</CardTitle>
              <CardDescription>
                Entries in the selected date range (same as Progress tab).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[min(24rem,50vh)] w-full rounded-xl border border-primary/15">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Recorded
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vitalRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-muted-foreground py-10 text-center text-sm"
                        >
                          No vitals in this range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...vitalRows]
                        .sort(
                          (a, b) =>
                            b.dayKey.localeCompare(a.dayKey) ||
                            b.recordedAt - a.recordedAt
                        )
                        .map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="tabular-nums">
                              {r.dayKey}
                            </TableCell>
                            <TableCell>{vitalKeyLabel(r.vitalKey)}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.value}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                              {new Date(r.recordedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/** Convenience helper: default date range = last 30 days. */
export function defaultProgressRange(): { from: string; to: string } {
  const today = formatDayKey();
  return { from: addDaysKey(today, -30), to: today };
}
