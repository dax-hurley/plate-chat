import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useState, useEffect, useMemo } from "react";
import { Scale, Minus, Plus, Activity } from "lucide-react";
import { toast } from "sonner";
import { A as AppSubNav, a as appSubNavTriggerClassName } from "./app-sub-nav--2r0057W.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent, c as CardDescription } from "./card-C4819yjg.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import "@capacitor/core";
import { u as useDb, f as formatDayKey, I as addDaysKey, K as bmiFromLbIn, V as VITAL_KEYS, L as bmiCategory, N as vitalKeyLabel } from "./router-CUOzYYmk.mjs";
import "dexie-react-hooks";
import "dexie";
import { a as useLocalSession, c as updateLocal, i as insertLocal, s as softDeleteLocal, u as useLiveArray } from "./writes-C61wFNCm.mjs";
import { n as newId, a as nowMs } from "./ids-zMPBJmub.mjs";
import { A as AutocompleteCombobox } from "./autocomplete-combobox-Bz_SOWqH.mjs";
import { S as ScrollArea } from "./scroll-area-BUy2INq0.mjs";
import { e as useExercises } from "./workouts-DSVvumuN.mjs";
import { a as useProfile } from "./profile-Wj5woFTV.mjs";
import "clsx";
import "tailwind-merge";
import "@base-ui/react/button";
import "class-variance-authority";
import "@base-ui/react/input";
import "@tanstack/react-router";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "zod";
import "@libsql/client";
import "drizzle-orm/libsql";
import "jose";
import "@ai-sdk/anthropic";
import "ai";
import "node:crypto";
import "@better-auth/core/db";
import "@better-auth/core/env";
import "@better-auth/core/error";
import "@better-auth/kysely-adapter";
import "@better-auth/core/db/adapter";
import "kysely";
import "@better-auth/utils/password";
import "@noble/hashes/hkdf.js";
import "@noble/hashes/sha2.js";
import "@better-auth/core/utils/db";
import "@better-auth/core/utils/json";
import "@better-auth/utils/base64";
import "@better-auth/utils/binary";
import "@better-auth/utils/hmac";
import "@better-auth/core/utils/ip";
import "@better-auth/utils/hash";
import "@better-auth/core/context";
import "@better-auth/core/instrumentation";
import "@better-auth/core/utils/id";
import "defu";
import "@better-auth/core/utils/host";
import "@better-auth/core/utils/is-api-error";
import "@better-auth/core/utils/url";
import "@better-auth/core/api";
import "@better-auth/core/utils/deprecate";
import "@better-auth/utils/random";
import "@better-auth/utils";
import "@noble/ciphers/chacha.js";
import "@noble/ciphers/utils.js";
import "@better-auth/core/social-providers";
import "jose/errors";
import "better-call";
import "@better-auth/telemetry";
import "@better-auth/drizzle-adapter";
import "react-dom";
import "@base-ui/react/scroll-area";
function useProgressMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const setVital = useCallback(
    async (vitalKey, dayKey, value) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = await db.userVitalEntries.where("[userId+vitalKey+dayKey]").equals([userId, vitalKey, dayKey]).toArray();
      const existing = matches[0];
      if (existing) {
        await updateLocal(db.userVitalEntries, existing.id, {
          value,
          recordedAt: nowMs(),
          deletedAt: null
        });
        return;
      }
      await insertLocal(db.userVitalEntries, {
        id: newId(),
        userId,
        vitalKey,
        dayKey,
        value,
        recordedAt: nowMs()
      });
    },
    [db, ready, userId]
  );
  const clearVital = useCallback(
    async (vitalKey, dayKey) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = await db.userVitalEntries.where("[userId+vitalKey+dayKey]").equals([userId, vitalKey, dayKey]).toArray();
      const existing = matches.find((r) => r.deletedAt === null);
      if (!existing) return;
      await softDeleteLocal(db.userVitalEntries, existing.id);
    },
    [db, ready, userId]
  );
  return { setVital, clearVital };
}
function collectSortedX(series) {
  const xs = /* @__PURE__ */ new Set();
  for (const s of series) {
    for (const p of s.points) xs.add(p.x);
  }
  return [...xs].sort((a, b) => a.localeCompare(b));
}
function bounds(series) {
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    for (const p of s.points) {
      if (Number.isFinite(p.y)) {
        min = Math.min(min, p.y);
        max = Math.max(max, p.y);
      }
    }
  }
  if (!Number.isFinite(min) || min === max) {
    return { min: 0, max: 1 };
  }
  const pad = (max - min) * 0.08 || 0.5;
  return { min: min - pad, max: max + pad };
}
function LineChart({
  series,
  height = 200,
  className,
  valueFormat = (n) => String(Math.round(n * 10) / 10),
  xAxisLabel = "Calendar day",
  yAxisLabel = "Value"
}) {
  const xs = collectSortedX(series);
  if (xs.length === 0 || series.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground py-8 text-center text-sm", children: "No data in this range." });
  }
  const { min: y0, max: y1 } = bounds(series);
  const w = 100;
  const h = 100;
  const n = xs.length;
  const xAt = (i) => n <= 1 ? 50 : i / (n - 1) * w;
  const yAt = (y) => h - (y - y0) / (y1 - y0 || 1) * (h - 8) - 4;
  const legendAbove = series.length > 1;
  const lines = [];
  for (const s of series) {
    const map = new Map(s.points.map((p) => [p.x, p.y]));
    const parts = [];
    for (let i = 0; i < n; i++) {
      const yv = map.get(xs[i]);
      if (yv == null || !Number.isFinite(yv)) continue;
      const x = xAt(i);
      const y = yAt(yv);
      parts.push(parts.length === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    if (parts.length) {
      lines.push({ d: parts.join(" "), color: s.color, name: s.name });
    }
  }
  const legend = /* @__PURE__ */ jsx(
    "ul",
    {
      role: "list",
      className: "text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs",
      children: series.map((s, i) => /* @__PURE__ */ jsxs(
        "li",
        {
          className: "inline-flex items-center gap-1.5",
          children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "inline-block size-2 shrink-0 rounded-full",
                style: { backgroundColor: s.color },
                "aria-hidden": true
              }
            ),
            /* @__PURE__ */ jsx("span", { children: s.name })
          ]
        },
        `${i}-${s.name}`
      ))
    }
  );
  const yTickFractions = [1, 0.75, 0.5, 0.25, 0];
  const yTickValues = yTickFractions.map((t) => y0 + t * (y1 - y0));
  const xTickLabels = n <= 1 ? [xs[0]] : n === 2 ? [xs[0], xs[1]] : [xs[0], xs[Math.floor((n - 1) / 2)], xs[n - 1]];
  const plotSvg = /* @__PURE__ */ jsxs(
    "svg",
    {
      viewBox: `0 0 ${w} ${h}`,
      preserveAspectRatio: "none",
      className: "text-foreground w-full",
      style: { height },
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: 0,
            y1: h,
            x2: w,
            y2: h,
            stroke: "currentColor",
            strokeOpacity: 0.22,
            strokeWidth: 0.45,
            vectorEffect: "non-scaling-stroke"
          }
        ),
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: h,
            stroke: "currentColor",
            strokeOpacity: 0.22,
            strokeWidth: 0.45,
            vectorEffect: "non-scaling-stroke"
          }
        ),
        yTickFractions.map((t) => {
          const yv = y0 + t * (y1 - y0);
          const y = yAt(yv);
          return /* @__PURE__ */ jsx(
            "line",
            {
              x1: 0,
              x2: w,
              y1: y,
              y2: y,
              stroke: "currentColor",
              strokeOpacity: 0.08,
              strokeWidth: 0.35
            },
            `grid-${t}`
          );
        }),
        lines.map((ln, i) => /* @__PURE__ */ jsx(
          "path",
          {
            d: ln.d,
            fill: "none",
            stroke: ln.color,
            strokeWidth: 1.2,
            vectorEffect: "non-scaling-stroke"
          },
          `${i}-${ln.name}`
        ))
      ]
    }
  );
  const yTickColumn = /* @__PURE__ */ jsx(
    "div",
    {
      className: "text-muted-foreground flex w-[2.75rem] shrink-0 flex-col justify-between py-px text-[0.65rem] leading-none tabular-nums",
      style: { height, minHeight: height },
      "aria-hidden": true,
      children: yTickValues.map((yv, i) => /* @__PURE__ */ jsx("span", { className: "block text-right", children: valueFormat(yv) }, i))
    }
  );
  const plotColumn = /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
      yTickColumn,
      /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1", children: plotSvg })
    ] }),
    !legendAbove ? /* @__PURE__ */ jsx("div", { className: "mt-2", role: "region", "aria-label": "Chart legend", children: legend }) : null,
    /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground mt-2 flex gap-1.5 text-[0.65rem] tabular-nums", children: [
      /* @__PURE__ */ jsx("div", { className: "w-[2.75rem] shrink-0", "aria-hidden": true }),
      /* @__PURE__ */ jsx("div", { className: "flex min-w-0 flex-1 justify-between gap-1", children: xTickLabels.map((lab, i) => /* @__PURE__ */ jsx("span", { className: "min-w-0 truncate", children: lab }, `${lab}-${i}`)) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1.5 text-center text-xs font-semibold tracking-wide", children: xAxisLabel })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: cn("w-full", className), children: [
    legendAbove ? /* @__PURE__ */ jsx("div", { className: "mb-2", role: "region", "aria-label": "Chart legend", children: legend }) : null,
    /* @__PURE__ */ jsxs("div", { className: "flex items-stretch gap-2", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "text-muted-foreground flex w-9 shrink-0 items-center justify-center text-xs font-semibold leading-snug",
          style: {
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            minHeight: height
          },
          children: yAxisLabel
        }
      ),
      plotColumn
    ] })
  ] });
}
const MIN_LB = 35;
const MAX_LB = 900;
const STEP_LB = 1;
function formatLb(n) {
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}
function parseLb(raw) {
  const n = Number(String(raw).replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
}
function QuickLogWeightWidget({
  initialLatestLb,
  onSaved,
  className
}) {
  const { setVital } = useProgressMutations();
  const [value, setValue] = useState(
    () => initialLatestLb != null && Number.isFinite(initialLatestLb) ? formatLb(initialLatestLb) : ""
  );
  const [pending, setPending] = useState(false);
  function baselineLb() {
    const parsed = parseLb(value);
    if (Number.isFinite(parsed)) return parsed;
    if (initialLatestLb != null && Number.isFinite(initialLatestLb)) {
      return initialLatestLb;
    }
    return MIN_LB;
  }
  function adjust(delta) {
    const next = Math.min(
      MAX_LB,
      Math.max(MIN_LB, Math.round((baselineLb() + delta) * 10) / 10)
    );
    setValue(formatLb(next));
  }
  async function submit() {
    const n = parseLb(value);
    if (!Number.isFinite(n)) {
      toast.error("Enter your weight in pounds.");
      return;
    }
    if (n < MIN_LB || n > MAX_LB) {
      toast.error(`Weight must be between ${MIN_LB} and ${MAX_LB} lb.`);
      return;
    }
    setPending(true);
    try {
      await setVital("body_weight_lb", formatDayKey(), n);
      setValue(formatLb(n));
      toast.success("Weight saved for today.");
      onSaved?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save weight. Try again."
      );
    } finally {
      setPending(false);
    }
  }
  const baseLb = baselineLb();
  const canDecrease = baseLb > MIN_LB + 1e-9;
  const canIncrease = baseLb < MAX_LB - 1e-9;
  return /* @__PURE__ */ jsxs(
    Card,
    {
      className: cn(
        "border-primary/15 from-primary/[0.06] bg-gradient-to-br to-transparent shadow-sm shadow-primary/5",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-9 items-center justify-center rounded-xl ring-1", children: /* @__PURE__ */ jsx(Scale, { className: "size-4", strokeWidth: 2.25, "aria-hidden": true }) }),
          "Log today's weight"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "quick-log-weight-lb", children: "Weight" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-stretch gap-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  disabled: pending || !canDecrease,
                  onClick: () => adjust(-STEP_LB),
                  className: "min-h-12 min-w-12 shrink-0 touch-manipulation px-0 sm:min-w-14",
                  "aria-label": "Decrease weight by one pound",
                  children: /* @__PURE__ */ jsx(Minus, { className: "size-5", "aria-hidden": true })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative min-h-12 min-w-0 max-w-[13rem] flex-1", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "quick-log-weight-lb",
                    type: "number",
                    inputMode: "decimal",
                    step: "any",
                    min: MIN_LB,
                    max: MAX_LB,
                    autoComplete: "off",
                    value,
                    disabled: pending,
                    "aria-describedby": "quick-log-weight-lb-unit",
                    className: "h-full min-h-12 w-full px-10 text-center text-base font-semibold tabular-nums touch-manipulation",
                    onChange: (e) => setValue(e.target.value),
                    onKeyDown: (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submit();
                      }
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    id: "quick-log-weight-lb-unit",
                    className: "text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium tabular-nums",
                    children: "lb"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  disabled: pending || !canIncrease,
                  onClick: () => adjust(STEP_LB),
                  className: "min-h-12 min-w-12 shrink-0 touch-manipulation px-0 sm:min-w-14",
                  "aria-label": "Increase weight by one pound",
                  children: /* @__PURE__ */ jsx(Plus, { className: "size-5", "aria-hidden": true })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              className: "min-h-12 w-full touch-manipulation sm:w-auto sm:min-w-[9rem]",
              disabled: pending,
              onClick: () => void submit(),
              children: pending ? "Saving…" : "Save"
            }
          )
        ] }) })
      ]
    }
  );
}
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsx(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  );
}
function dayKeyFromDateInput(v) {
  return v.trim() || formatDayKey();
}
function BmiScale({ bmi }) {
  const min = 16;
  const max = 40;
  const pct = Math.min(100, Math.max(0, (bmi - min) / (max - min) * 100));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground flex justify-between text-[0.65rem] font-medium uppercase tracking-wide", children: [
      /* @__PURE__ */ jsx("span", { children: "16" }),
      /* @__PURE__ */ jsx("span", { children: "18.5" }),
      /* @__PURE__ */ jsx("span", { children: "25" }),
      /* @__PURE__ */ jsx("span", { children: "30" }),
      /* @__PURE__ */ jsx("span", { children: "40" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative h-3 w-full overflow-hidden rounded-full bg-muted", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 w-[18%] bg-sky-500/40" }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-y-0 bg-emerald-500/35",
          style: { left: "18%", width: "25%" }
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-y-0 bg-amber-500/35",
          style: { left: "43%", width: "20%" }
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-y-0 rounded-r-full bg-rose-500/35",
          style: { left: "63%", width: "37%" }
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "border-background absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-primary shadow-md",
          style: { left: `${pct}%` },
          "aria-label": `BMI ${bmi.toFixed(1)} on scale`
        }
      )
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Bands are approximate WHO-style cutoffs (16–40 scale for display)." })
  ] });
}
function useVitalsInRange(fromDayKey, toDayKey) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const rows = await db.userVitalEntries.where("[userId+dayKey]").between([userId, fromDayKey], [userId, toDayKey]).toArray();
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId, fromDayKey, toDayKey]
  );
}
function useMealsAndEntriesInRange(fromDayKey, toDayKey) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const meals = await db.meals.where("[userId+dayKey+loggedAt]").between(
        [userId, fromDayKey, 0],
        [userId, toDayKey, Number.MAX_SAFE_INTEGER]
      ).toArray();
      const alive = meals.filter((m) => m.deletedAt === null);
      const out = [];
      for (const m of alive) {
        const entries = await db.mealEntries.where("mealId").equals(m.id).toArray();
        out.push({
          meal: m,
          entries: entries.filter((e) => e.deletedAt === null)
        });
      }
      return out;
    },
    [db, userId, fromDayKey, toDayKey]
  );
}
function useSetsForExercise(exerciseId, fromDayKey, toDayKey) {
  const { db } = useDb();
  return useLiveArray(
    async () => {
      if (!db || !exerciseId) return [];
      const sets = await db.workoutSets.filter(
        (r) => r.exerciseId === exerciseId && r.deletedAt === null
      ).toArray();
      return sets.filter((s) => {
        const d = new Date(s.completedAt);
        const dk = formatDayKey(d);
        return dk >= fromDayKey && dk <= toDayKey;
      });
    },
    [db, exerciseId, fromDayKey, toDayKey]
  );
}
function ProgressScreen({
  defaultFrom,
  defaultTo,
  loseWeightQuickLog = false,
  quickLogInitialWeightLb = null
}) {
  const { data: exercises } = useExercises();
  const { data: profile } = useProfile();
  const { setVital } = useProgressMutations();
  const [section, setSection] = useState("charts");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [exerciseId, setExerciseId] = useState("");
  useEffect(() => {
    if (exercises.length === 0) return;
    if (!exerciseId || !exercises.some((e) => e.id === exerciseId)) {
      setExerciseId(exercises[0].id);
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
  const latest = useMemo(() => {
    const out = {};
    for (const r of vitalRows) {
      const cur = out[r.vitalKey];
      if (!cur || r.dayKey > cur.dayKey) {
        out[r.vitalKey] = { value: r.value, dayKey: r.dayKey };
      }
    }
    return out;
  }, [vitalRows]);
  const weightSeries = useMemo(() => {
    const byDay = /* @__PURE__ */ new Map();
    for (const r of vitalRows) {
      if (r.vitalKey !== "body_weight_lb") continue;
      byDay.set(r.dayKey, r.value);
    }
    return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dayKey, value]) => ({ dayKey, value }));
  }, [vitalRows]);
  const bmiSeries = useMemo(() => {
    const h = profile?.heightIn;
    if (!h || !Number.isFinite(h)) return [];
    return weightSeries.map((p) => ({
      dayKey: p.dayKey,
      value: bmiFromLbIn(p.value, h)
    }));
  }, [weightSeries, profile]);
  const currentBmi = useMemo(() => {
    const w = latest.body_weight_lb?.value;
    const h = profile?.heightIn;
    if (w == null || h == null) return null;
    return bmiFromLbIn(w, h);
  }, [latest, profile]);
  const macroSeries = useMemo(() => {
    const byDay = /* @__PURE__ */ new Map();
    for (const { meal, entries } of mealBundles) {
      const cur = byDay.get(meal.dayKey) ?? {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0
      };
      for (const e of entries) {
        cur.calories += e.calories;
        cur.proteinG += e.proteinG;
        cur.carbsG += e.carbsG;
        cur.fatG += e.fatG;
      }
      byDay.set(meal.dayKey, cur);
    }
    return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dayKey, totals]) => ({ dayKey, ...totals }));
  }, [mealBundles]);
  const exerciseSeries = useMemo(() => {
    const byDay = /* @__PURE__ */ new Map();
    for (const s of exerciseSets) {
      const dk = formatDayKey(new Date(s.completedAt));
      const v = s.weight ?? 0;
      byDay.set(dk, Math.max(byDay.get(dk) ?? 0, v));
    }
    return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dayKey, value]) => ({ dayKey, value }));
  }, [exerciseSets]);
  async function onVitalsSubmit(e) {
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
    () => VITAL_KEYS.map(
      (k) => `${k}:${latest[k]?.dayKey ?? ""}:${latest[k]?.value ?? ""}`
    ).join("|"),
    [latest]
  );
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-6 lg:max-w-6xl", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(Activity, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
        "Progress"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Track lifts, nutrition, weight, and vitals over time." })
    ] }),
    /* @__PURE__ */ jsxs(AppSubNav, { "aria-label": "Progress sections", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": section === "charts",
          className: cn(appSubNavTriggerClassName(section === "charts")),
          onClick: () => setSection("charts"),
          children: "Progress"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": section === "vitals",
          className: cn(appSubNavTriggerClassName(section === "vitals")),
          onClick: () => setSection("vitals"),
          children: "Vitals"
        }
      )
    ] }),
    loseWeightQuickLog ? /* @__PURE__ */ jsx(
      QuickLogWeightWidget,
      {
        initialLatestLb: latest.body_weight_lb?.value ?? quickLogInitialWeightLb
      }
    ) : null,
    section === "charts" ? /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Date range" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Charts and the vitals log use this inclusive range." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col gap-3 pt-0 sm:flex-row sm:flex-wrap sm:items-end", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "from", children: "From" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "from",
                type: "date",
                value: from,
                className: "min-h-12 text-base",
                onChange: (e) => setFrom(dayKeyFromDateInput(e.target.value))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "to", children: "To" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "to",
                type: "date",
                value: to,
                className: "min-h-12 text-base",
                onChange: (e) => setTo(dayKeyFromDateInput(e.target.value))
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2 lg:items-start", children: [
        currentBmi != null && Number.isFinite(currentBmi) ? /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Current BMI" }),
            /* @__PURE__ */ jsx(CardDescription, { children: "From your latest logged weight and your saved height." })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 pt-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-baseline gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-3xl font-semibold tabular-nums", children: currentBmi.toFixed(1) }),
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-sm", children: [
                bmiCategory(currentBmi),
                " · weight day",
                " ",
                latest.body_weight_lb?.dayKey ?? "—",
                " · height",
                " ",
                profile?.heightIn != null ? `${profile.heightIn.toFixed(1)} in` : "—"
              ] })
            ] }),
            /* @__PURE__ */ jsx(BmiScale, { bmi: currentBmi })
          ] })
        ] }) : /* @__PURE__ */ jsx(Card, { className: "border-primary/15", children: /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Current BMI" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Log weight in Vitals and save your height in Profile to see BMI." })
        ] }) }),
        /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Exercise progress" }),
              /* @__PURE__ */ jsx(CardDescription, { children: "Max load logged per calendar day on completed workouts." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-2 sm:max-w-sm sm:shrink-0", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "exercise-progress-exercise", children: "Exercise" }),
              exercises.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No exercises yet." }) : /* @__PURE__ */ jsx(
                AutocompleteCombobox,
                {
                  id: "exercise-progress-exercise",
                  "aria-label": "Exercise for progress chart",
                  options: exerciseComboboxOptions,
                  value: exerciseId || null,
                  onValueChange: (v) => {
                    if (v) setExerciseId(v);
                  },
                  placeholder: "Search or choose an exercise…",
                  emptyText: "No exercises match your search.",
                  inputClassName: "min-h-12 text-base"
                }
              )
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsx(
            LineChart,
            {
              series: [
                {
                  name: `${exerciseName} — max load`,
                  color: "oklch(0.55 0.18 250)",
                  points: exerciseSeries.map((p) => ({
                    x: p.dayKey,
                    y: p.value
                  }))
                }
              ],
              height: 220,
              valueFormat: (n) => String(Math.round(n * 10) / 10),
              yAxisLabel: "Weight (lb)"
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Macros" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Daily totals from your nutrition log." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6 pt-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs font-medium tracking-wide uppercase", children: "Calories" }),
            /* @__PURE__ */ jsx(
              LineChart,
              {
                series: [
                  {
                    name: "Calories",
                    color: "oklch(0.62 0.19 35)",
                    points: macroSeries.map((p) => ({
                      x: p.dayKey,
                      y: p.calories
                    }))
                  }
                ],
                height: 200,
                valueFormat: (n) => String(Math.round(n)),
                yAxisLabel: "Calories (kcal)"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs font-medium tracking-wide uppercase", children: "Macros (g)" }),
            /* @__PURE__ */ jsx(
              LineChart,
              {
                series: [
                  {
                    name: "Protein (g)",
                    color: "oklch(0.55 0.16 145)",
                    points: macroSeries.map((p) => ({
                      x: p.dayKey,
                      y: p.proteinG
                    }))
                  },
                  {
                    name: "Carbs (g)",
                    color: "oklch(0.65 0.14 85)",
                    points: macroSeries.map((p) => ({
                      x: p.dayKey,
                      y: p.carbsG
                    }))
                  },
                  {
                    name: "Fat (g)",
                    color: "oklch(0.6 0.14 300)",
                    points: macroSeries.map((p) => ({
                      x: p.dayKey,
                      y: p.fatG
                    }))
                  }
                ],
                height: 220,
                valueFormat: (n) => String(Math.round(n * 10) / 10),
                yAxisLabel: "Macros (g)"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Weight and BMI" }),
          /* @__PURE__ */ jsxs(CardDescription, { children: [
            "Weight from vitals. BMI uses your saved height.",
            profile?.heightIn != null && /* @__PURE__ */ jsxs("span", { className: "mt-1 block", children: [
              "Height for BMI: ",
              profile.heightIn.toFixed(1),
              " in"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6 pt-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs font-medium tracking-wide uppercase", children: "Weight" }),
            /* @__PURE__ */ jsx(
              LineChart,
              {
                series: [
                  {
                    name: "Weight (lb)",
                    color: "oklch(0.5 0.12 240)",
                    points: weightSeries.map((p) => ({
                      x: p.dayKey,
                      y: p.value
                    }))
                  }
                ],
                height: 200,
                valueFormat: (n) => String(Math.round(n * 10) / 10),
                yAxisLabel: "Weight (lb)"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs font-medium tracking-wide uppercase", children: "BMI" }),
            /* @__PURE__ */ jsx(
              LineChart,
              {
                series: [
                  {
                    name: "BMI",
                    color: "oklch(0.55 0.14 195)",
                    points: bmiSeries.filter(
                      (p) => p.value != null
                    ).map((p) => ({ x: p.dayKey, y: p.value }))
                  }
                ],
                height: 200,
                valueFormat: (n) => String(Math.round(n * 10) / 10),
                yAxisLabel: "BMI"
              }
            )
          ] })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2 lg:items-start", children: [
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Log vitals" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Entries are always for today. Saving again today replaces that day's value for each metric you enter." })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxs(
          "form",
          {
            onSubmit: onVitalsSubmit,
            className: "bg-card border-primary/15 space-y-4 rounded-xl border p-4 shadow-sm",
            children: [
              /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: VITAL_KEYS.map((key) => {
                const entry = latest[key];
                const defaultValue = entry != null && Number.isFinite(entry.value) ? String(entry.value) : void 0;
                return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: key, children: vitalKeyLabel(key) }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      id: key,
                      name: key,
                      type: "number",
                      inputMode: "decimal",
                      step: "any",
                      placeholder: "—",
                      className: "min-h-12 text-base",
                      defaultValue
                    }
                  )
                ] }, key);
              }) }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "submit",
                  className: "min-h-12 w-full gap-2 text-base shadow-sm",
                  children: "Save vitals"
                }
              )
            ]
          },
          vitalsFormKey
        ) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 lg:min-h-0", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Vitals log" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Entries in the selected date range (same as Progress tab)." })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsx(ScrollArea, { className: "h-[min(24rem,50vh)] w-full rounded-xl border border-primary/15", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "Day" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Metric" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Value" }),
            /* @__PURE__ */ jsx(TableHead, { className: "hidden sm:table-cell", children: "Recorded" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: vitalRows.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(
            TableCell,
            {
              colSpan: 4,
              className: "text-muted-foreground py-10 text-center text-sm",
              children: "No vitals in this range."
            }
          ) }) : [...vitalRows].sort(
            (a, b) => b.dayKey.localeCompare(a.dayKey) || b.recordedAt - a.recordedAt
          ).map((r) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "tabular-nums", children: r.dayKey }),
            /* @__PURE__ */ jsx(TableCell, { children: vitalKeyLabel(r.vitalKey) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right tabular-nums", children: r.value }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground hidden text-xs sm:table-cell", children: new Date(r.recordedAt).toLocaleString() })
          ] }, r.id)) })
        ] }) }) })
      ] })
    ] })
  ] });
}
function defaultProgressRange() {
  const today = formatDayKey();
  return { from: addDaysKey(today, -30), to: today };
}
function ProgressPage() {
  const {
    data: profile
  } = useProfile();
  const {
    from,
    to
  } = defaultProgressRange();
  return /* @__PURE__ */ jsx(ProgressScreen, { defaultFrom: from, defaultTo: to, loseWeightQuickLog: profile?.goalPreset === "lose_weight" });
}
export {
  ProgressPage as component
};
