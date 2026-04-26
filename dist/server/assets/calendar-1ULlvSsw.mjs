import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, Trash2 } from "lucide-react";
import { B as Button, b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-C4819yjg.mjs";
import "@capacitor/core";
import { a as useWorkoutTemplates } from "./workouts-DSVvumuN.mjs";
import "dexie";
import { a as formatMonthKey, c as calendarMonthGrid, m as monthDayKeyRange, f as formatDayKey, p as prevMonthKey, n as nextMonthKey, b as parseMonthKey } from "./router-CUOzYYmk.mjs";
import "dexie-react-hooks";
import { u as useScheduledItems, a as useScheduleMutations } from "./schedule-CDtsSZTH.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "@base-ui/react/button";
import "class-variance-authority";
import "./writes-C61wFNCm.mjs";
import "./ids-zMPBJmub.mjs";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "sonner";
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
import "clsx";
import "tailwind-merge";
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function monthDisplayLabel(monthKey) {
  const p = parseMonthKey(monthKey);
  if (!p) return monthKey;
  return new Date(p.year, p.month - 1, 1).toLocaleDateString(void 0, {
    month: "long",
    year: "numeric"
  });
}
function WorkoutCalendar() {
  const [monthKey, setMonthKey] = useState(() => formatMonthKey());
  const [selectedDay, setSelectedDay] = useState(null);
  const weeks = useMemo(() => calendarMonthGrid(monthKey), [monthKey]);
  const range = useMemo(() => monthDayKeyRange(monthKey), [monthKey]);
  const {
    data: scheduled
  } = useScheduledItems(range?.first ?? formatDayKey(), range?.last ?? formatDayKey());
  const {
    data: templates
  } = useWorkoutTemplates();
  const {
    scheduleTemplate,
    unschedule
  } = useScheduleMutations();
  const templateMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const t of templates) m.set(t.id, t.name);
    return m;
  }, [templates]);
  const byDay = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of scheduled) {
      const arr = m.get(s.dayKey) ?? [];
      arr.push(s);
      m.set(s.dayKey, arr);
    }
    return m;
  }, [scheduled]);
  const today = formatDayKey();
  const effectiveDay = selectedDay ?? today;
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-6 sm:max-w-5xl", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(CalendarDays, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
        "Calendar"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Schedule workouts and review what you've planned this month." })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "border-primary/20 min-h-11 gap-1.5", onClick: () => setMonthKey(prevMonthKey(monthKey)), children: [
        /* @__PURE__ */ jsx(ChevronLeft, { className: "size-4", "aria-hidden": true }),
        "Prev"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: monthDisplayLabel(monthKey) }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "border-primary/20 min-h-11 gap-1.5", onClick: () => setMonthKey(nextMonthKey(monthKey)), children: [
        "Next",
        /* @__PURE__ */ jsx(ChevronRight, { className: "size-4", "aria-hidden": true })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 text-xs font-medium tracking-wide uppercase text-muted-foreground", children: WEEKDAY_LABELS.map((d) => /* @__PURE__ */ jsx("div", { className: "py-1 text-center", children: d }, d)) }),
    weeks ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1", children: weeks.flat().map((cell) => {
      const isToday = cell.dayKey === today;
      const isSelected = cell.dayKey === selectedDay;
      const items = byDay.get(cell.dayKey) ?? [];
      return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setSelectedDay(cell.dayKey), className: cn("min-h-20 rounded-lg border p-1.5 text-left text-xs shadow-sm transition-colors", "bg-card hover:border-primary/40", !cell.inMonth && "opacity-40", isToday && "border-primary ring-1 ring-primary/30", isSelected && "ring-2 ring-primary"), children: [
        /* @__PURE__ */ jsx("div", { className: cn("text-sm font-semibold tabular-nums", isToday && "text-primary"), children: Number(cell.dayKey.slice(-2)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 space-y-0.5", children: [
          items.slice(0, 3).map((s) => /* @__PURE__ */ jsx("div", { className: "bg-primary/12 text-primary truncate rounded px-1 py-0.5", title: templateMap.get(s.templateId) ?? "Workout", children: templateMap.get(s.templateId) ?? "Workout" }, s.id)),
          items.length > 3 ? /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground text-[0.65rem]", children: [
            "+",
            items.length - 3,
            " more"
          ] }) : null
        ] })
      ] }, cell.dayKey);
    }) }) : null,
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
            /* @__PURE__ */ jsx(Dumbbell, { className: "text-primary size-4", "aria-hidden": true }),
            effectiveDay
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Manage this day's plan." })
        ] }),
        selectedDay && selectedDay !== today ? /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setSelectedDay(null), children: "Jump to today" }) : null
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3 pt-0", children: [
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2", children: [
          (byDay.get(effectiveDay) ?? []).map((s) => /* @__PURE__ */ jsxs("li", { className: "border-primary/15 bg-card flex items-center justify-between gap-2 rounded-lg border p-2", children: [
            /* @__PURE__ */ jsx(Link, { to: "/app/workouts/$id", params: {
              id: s.templateId
            }, className: "min-w-0 flex-1 truncate text-sm font-medium hover:underline", children: templateMap.get(s.templateId) ?? "Workout" }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => void unschedule(s.id), className: "text-destructive inline-flex items-center gap-1 text-xs hover:underline", children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-3.5", "aria-hidden": true }),
              "Remove"
            ] })
          ] }, s.id)),
          (byDay.get(effectiveDay) ?? []).length === 0 ? /* @__PURE__ */ jsx("li", { className: "text-muted-foreground text-sm", children: "Nothing scheduled for this day." }) : null
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const tid = String(fd.get("templateId") ?? "");
          if (!tid) return;
          void scheduleTemplate(tid, effectiveDay);
          e.currentTarget.reset();
        }, className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("select", { name: "templateId", className: "border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm", disabled: templates.length === 0, children: [
            /* @__PURE__ */ jsx("option", { value: "", children: templates.length === 0 ? "No workouts yet" : "Schedule a workout…" }),
            templates.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.name }, t.id))
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", variant: "secondary", children: "Add" })
        ] }),
        templates.length === 0 ? /* @__PURE__ */ jsx(Link, { to: "/app/workouts/new", className: cn(buttonVariants({
          variant: "outline"
        }), "w-full gap-2 text-sm"), children: "Create your first workout" }) : null
      ] })
    ] })
  ] });
}
export {
  WorkoutCalendar as component
};
