"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Activity } from "lucide-react";

import {
  actionFetchExerciseProgressSeries,
  actionFetchMacroSeries,
  actionFetchVitals,
  actionFetchWeightBmiSeries,
  actionGetLatestVitals,
  actionSaveVitals,
} from "@/app/app/progress/actions";
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
import { formatDistanceAmount, parseDistanceUnit } from "@/lib/distance-units";
import { formatDayKey } from "@/lib/date-key";
import { formatDurationSeconds } from "@/lib/format-duration";
import type { ExerciseProgressMetric } from "@/lib/services/progress";
import { VITAL_KEYS, type VitalKey, vitalKeyLabel } from "@/lib/vitals-keys";
import { cn } from "@/lib/utils";

type ExerciseOption = {
  id: string;
  name: string;
  logKind: string;
  distanceUnit: string | null;
};

type VitalLogRow = Awaited<ReturnType<typeof actionFetchVitals>>[number];

type ProgressSection = "charts" | "vitals";

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
        <div
          className="absolute inset-y-0 left-0 w-[18%] bg-sky-500/40"
          title="Underweight"
        />
        <div
          className="absolute inset-y-0 bg-emerald-500/35"
          style={{ left: "18%", width: "25%" }}
          title="Normal"
        />
        <div
          className="absolute inset-y-0 bg-amber-500/35"
          style={{ left: "43%", width: "20%" }}
          title="Overweight"
        />
        <div
          className="absolute inset-y-0 rounded-r-full bg-rose-500/35"
          style={{ left: "63%", width: "37%" }}
          title="Obese"
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

export function ProgressScreen({
  exercises,
  defaultExerciseId,
  defaultFrom,
  defaultTo,
  loseWeightQuickLog = false,
  quickLogInitialWeightLb = null,
}: {
  exercises: ExerciseOption[];
  defaultExerciseId: string;
  defaultFrom: string;
  defaultTo: string;
  loseWeightQuickLog?: boolean;
  quickLogInitialWeightLb?: number | null;
}) {
  const [section, setSection] = useState<ProgressSection>("charts");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [exerciseId, setExerciseId] = useState(defaultExerciseId);
  const [exerciseMetric, setExerciseMetric] =
    useState<ExerciseProgressMetric>("weight");
  const [exerciseSeries, setExerciseSeries] = useState<
    { dayKey: string; value: number }[]
  >([]);
  const [macroSeries, setMacroSeries] = useState<
    {
      dayKey: string;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
    }[]
  >([]);
  const [wb, setWb] = useState<{
    weight: { dayKey: string; value: number }[];
    bmi: { dayKey: string; value: number }[];
    latestHeightIn: number | null;
  }>({ weight: [], bmi: [], latestHeightIn: null });
  const [latest, setLatest] = useState<
    Record<string, { value: number; dayKey: string }>
  >({});
  const [vitalRows, setVitalRows] = useState<VitalLogRow[]>([]);
  const [pending, startTransition] = useTransition();

  const exerciseComboboxOptions = useMemo(
    () => exercises.map((ex) => ({ value: ex.id, label: ex.name })),
    [exercises]
  );

  const selectedExercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId),
    [exercises, exerciseId]
  );
  const exerciseName = selectedExercise?.name ?? "Exercise";
  const distanceUnit = parseDistanceUnit(selectedExercise?.distanceUnit);

  const reloadAll = useCallback(() => {
    startTransition(async () => {
      const [exW, macros, weightBmi, rows, latestMap] = await Promise.all([
        exerciseId
          ? actionFetchExerciseProgressSeries({
              exerciseId,
              fromDayKey: from,
              toDayKey: to,
            })
          : Promise.resolve({ metric: "weight" as const, points: [] }),
        actionFetchMacroSeries({ fromDayKey: from, toDayKey: to }),
        actionFetchWeightBmiSeries({ fromDayKey: from, toDayKey: to }),
        actionFetchVitals({ fromDayKey: from, toDayKey: to }),
        actionGetLatestVitals(),
      ]);
      setExerciseMetric(exW.metric);
      setExerciseSeries(exW.points);
      setMacroSeries(macros);
      setWb(weightBmi);
      setVitalRows(rows);
      setLatest(latestMap);
    });
  }, [exerciseId, from, to]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (exercises.length === 0) return;
    if (!exerciseId || !exercises.some((e) => e.id === exerciseId)) {
      setExerciseId(exercises[0]!.id);
    }
  }, [exercises, exerciseId]);

  const vitalsFormKey = useMemo(
    () =>
      VITAL_KEYS.map(
        (k) => `${k}:${latest[k]?.dayKey ?? ""}:${latest[k]?.value ?? ""}`
      ).join("|"),
    [latest]
  );

  const currentBmi = useMemo(() => {
    const w = latest.body_weight_lb?.value;
    const h = wb.latestHeightIn;
    if (w == null || h == null) return null;
    return bmiFromLbIn(w, h);
  }, [latest, wb.latestHeightIn]);

  const exerciseProgressLineLabel = useMemo(() => {
    if (exerciseMetric === "duration_sec") return "longest hold";
    if (exerciseMetric === "distance") return "best distance";
    return "max load";
  }, [exerciseMetric]);

  const exerciseChartYAxisLabel = useMemo(() => {
    if (exerciseMetric === "duration_sec") return "Time";
    if (exerciseMetric === "distance")
      return `Distance (${distanceUnit})`;
    return "Weight (lb)";
  }, [exerciseMetric, distanceUnit]);

  const exerciseChartValueFormat = useMemo(
    () =>
      exerciseMetric === "duration_sec"
        ? (n: number) => formatDurationSeconds(n)
        : exerciseMetric === "distance"
          ? (n: number) => formatDistanceAmount(n, distanceUnit)
          : (n: number) => String(Math.round(n * 10) / 10),
    [exerciseMetric, distanceUnit]
  );

  const exerciseProgressDescription = useMemo(() => {
    if (exerciseMetric === "duration_sec") {
      return "Longest single-set hold per calendar day from completed workouts.";
    }
    if (exerciseMetric === "distance") {
      return "Best distance logged per calendar day from completed workouts (or best time when sets use the stopwatch).";
    }
    return "Max load logged per calendar day on completed workouts.";
  }, [exerciseMetric]);

  const exChartSeries = useMemo(
    () => [
      {
        name: `${exerciseName} — ${exerciseProgressLineLabel}`,
        color: "oklch(0.55 0.18 250)",
        points: exerciseSeries.map((p) => ({ x: p.dayKey, y: p.value })),
      },
    ],
    [exerciseName, exerciseProgressLineLabel, exerciseSeries]
  );

  const macroGramsSeries = useMemo(
    () => [
      {
        name: "Protein (g)",
        color: "oklch(0.55 0.16 145)",
        points: macroSeries.map((p) => ({ x: p.dayKey, y: p.proteinG })),
      },
      {
        name: "Carbs (g)",
        color: "oklch(0.65 0.14 85)",
        points: macroSeries.map((p) => ({ x: p.dayKey, y: p.carbsG })),
      },
      {
        name: "Fat (g)",
        color: "oklch(0.6 0.14 300)",
        points: macroSeries.map((p) => ({ x: p.dayKey, y: p.fatG })),
      },
    ],
    [macroSeries]
  );

  const caloriesSeries = useMemo(
    () => [
      {
        name: "Calories",
        color: "oklch(0.62 0.19 35)",
        points: macroSeries.map((p) => ({ x: p.dayKey, y: p.calories })),
      },
    ],
    [macroSeries]
  );

  const weightSeries = useMemo(
    () => [
      {
        name: "Weight (lb)",
        color: "oklch(0.5 0.12 240)",
        points: wb.weight.map((p) => ({ x: p.dayKey, y: p.value })),
      },
    ],
    [wb.weight]
  );

  const bmiSeries = useMemo(
    () => [
      {
        name: "BMI",
        color: "oklch(0.55 0.14 195)",
        points: wb.bmi.map((p) => ({ x: p.dayKey, y: p.value })),
      },
    ],
    [wb.bmi]
  );

  async function onVitalsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await actionSaveVitals(fd);
    reloadAll();
  }

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
          onSaved={reloadAll}
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
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                className="min-h-12 w-full touch-manipulation sm:w-auto"
                onClick={() => {
                  reloadAll();
                }}
              >
                Refresh
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {currentBmi != null && Number.isFinite(currentBmi) ? (
              <Card className="border-primary/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Current BMI</CardTitle>
                  <CardDescription>
                    From your latest logged weight and your saved height (used
                    for BMI across the charts).
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
                      {wb.latestHeightIn != null
                        ? `${wb.latestHeightIn.toFixed(1)} in`
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
                    Log weight in Vitals and save your height where you edit your
                    account details to see BMI.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card className="border-primary/15">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg">Exercise progress</CardTitle>
                    <CardDescription>{exerciseProgressDescription}</CardDescription>
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
                  series={exChartSeries}
                  height={220}
                  valueFormat={exerciseChartValueFormat}
                  yAxisLabel={exerciseChartYAxisLabel}
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
                  series={caloriesSeries}
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
                  series={macroGramsSeries}
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
                {wb.latestHeightIn != null && (
                  <span className="mt-1 block">
                    Height for BMI: {wb.latestHeightIn.toFixed(1)} in
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
                  series={weightSeries}
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
                  series={bmiSeries}
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
                Entries are always for today (your local calendar day). Saving
                again today replaces that day&apos;s value for each metric you
                enter.
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
                  disabled={pending}
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
                        .sort((a, b) => {
                          const ta = new Date(a.recordedAt as Date).getTime();
                          const tb = new Date(b.recordedAt as Date).getTime();
                          return (
                            b.dayKey.localeCompare(a.dayKey) || tb - ta
                          );
                        })
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
                              {new Date(
                                r.recordedAt as Date
                              ).toLocaleString()}
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
