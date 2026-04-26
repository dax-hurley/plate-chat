import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Dumbbell, Salad, Activity, CalendarDays, UserRound } from "lucide-react";
import { S as StartWorkoutForm } from "./start-workout-form-Bfua1BiB.mjs";
import { b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-C4819yjg.mjs";
import { f as formatDayKey, u as useDb } from "./router-CUOzYYmk.mjs";
import { u as useLiveArray, a as useLocalSession } from "./writes-C61wFNCm.mjs";
import { u as useActiveSession, a as useWorkoutTemplates } from "./workouts-DSVvumuN.mjs";
import { u as useMealsOnDay } from "./nutrition-BIi3XxN5.mjs";
import "@capacitor/core";
import "dexie";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "sonner";
import "./dialog-OkPnLnLD.mjs";
import "@base-ui/react/dialog";
import "dexie-react-hooks";
import "@base-ui/react/button";
import "class-variance-authority";
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
import "./ids-zMPBJmub.mjs";
import "clsx";
import "tailwind-merge";
function formatStartedLabel(when) {
  const d = new Date(when);
  return d.toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
function useRecentCompletedSessions(limit = 5) {
  const {
    db
  } = useDb();
  const {
    userId
  } = useLocalSession();
  return useLiveArray(async () => {
    if (!db || !userId) return [];
    const rows = await db.workoutSessions.where("[userId+status+startedAt]").between([userId, "completed", 0], [userId, "completed", Number.MAX_SAFE_INTEGER]).reverse().limit(limit).toArray();
    return rows.filter((r) => r.deletedAt === null);
  }, [db, userId, limit]);
}
function DashboardPage() {
  const today = formatDayKey();
  const {
    data: activeSession
  } = useActiveSession();
  const {
    data: templates
  } = useWorkoutTemplates();
  const {
    data: recent
  } = useRecentCompletedSessions(5);
  const {
    data: meals
  } = useMealsOnDay(today);
  const {
    db
  } = useDb();
  const {
    data: todayTotals
  } = useLiveArray(async () => {
    if (!db || meals.length === 0) return [{
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0
    }];
    let calories = 0;
    let proteinG = 0;
    let carbsG = 0;
    let fatG = 0;
    for (const m of meals) {
      const entries = await db.mealEntries.where("mealId").equals(m.id).toArray();
      for (const e of entries) {
        if (e.deletedAt !== null) continue;
        calories += e.calories;
        proteinG += e.proteinG;
        carbsG += e.carbsG;
        fatG += e.fatG;
      }
    }
    return [{
      calories,
      proteinG,
      carbsG,
      fatG
    }];
  }, [db, meals]);
  const totals = todayTotals[0] ?? {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0
  };
  const templateMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const t of templates) m.set(t.id, t.name);
    return m;
  }, [templates]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-8 lg:max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Today" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, {
        weekday: "long",
        month: "long",
        day: "numeric"
      }) })
    ] }),
    activeSession ? /* @__PURE__ */ jsxs(Card, { className: "border-primary/30 bg-primary/5", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
          /* @__PURE__ */ jsx(Dumbbell, { className: "text-primary size-5", "aria-hidden": true }),
          "Workout in progress"
        ] }),
        /* @__PURE__ */ jsxs(CardDescription, { children: [
          activeSession.templateId ? templateMap.get(activeSession.templateId) ?? "Workout" : "Workout",
          " ",
          "· started ",
          formatStartedLabel(activeSession.startedAt)
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsx(Link, { to: "/app/workouts/session/$sessionId", params: {
        sessionId: activeSession.id
      }, className: cn(buttonVariants(), "inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base shadow-sm"), children: "Resume workout" }) })
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/app/nutrition", className: "border-primary/15 bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Salad, { className: "text-primary size-5", "aria-hidden": true }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Nutrition" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-2xl font-semibold tabular-nums", children: [
          Math.round(totals.calories),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground ml-1 text-sm font-normal", children: "kcal" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs tabular-nums", children: [
          "P ",
          Math.round(totals.proteinG),
          "g · C ",
          Math.round(totals.carbsG),
          "g · F ",
          Math.round(totals.fatG),
          "g"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/app/progress", className: "border-primary/15 bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Activity, { className: "text-primary size-5", "aria-hidden": true }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Progress" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Track lifts, weight, and vitals." })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/app/workouts/calendar", className: "border-primary/15 bg-card hover:border-primary/30 rounded-xl border p-4 shadow-sm transition-colors", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CalendarDays, { className: "text-primary size-5", "aria-hidden": true }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Calendar" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Plan and review workout days." })
      ] })
    ] }),
    templates.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Start a workout" }),
        /* @__PURE__ */ jsx(Link, { to: "/app/workouts", className: "text-primary text-sm font-medium underline-offset-4 hover:underline", children: "See all" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: templates.slice(0, 6).map((t) => /* @__PURE__ */ jsx(StartWorkoutForm, { templateId: t.id, name: t.name }, t.id)) })
    ] }) : /* @__PURE__ */ jsxs("section", { className: "border-primary/15 bg-card rounded-xl border p-6 text-center shadow-sm", children: [
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "You don't have any saved workouts yet." }),
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts/new", className: cn(buttonVariants(), "mt-4 inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 text-base"), children: "Create your first workout" })
    ] }),
    recent.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Recent workouts" }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: recent.map((s) => /* @__PURE__ */ jsx("li", { className: "border-primary/15 bg-card flex items-center justify-between gap-3 rounded-xl border p-3 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium leading-snug", children: s.templateId ? templateMap.get(s.templateId) ?? "Workout" : "Workout" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: formatStartedLabel(s.startedAt) })
      ] }) }, s.id)) })
    ] }) : null,
    /* @__PURE__ */ jsx("section", { className: "flex items-center justify-between gap-3 pt-2", children: /* @__PURE__ */ jsxs(Link, { to: "/app/profile", className: "text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx(UserRound, { className: "size-4", "aria-hidden": true }),
      "Profile & settings"
    ] }) })
  ] });
}
export {
  DashboardPage as component
};
