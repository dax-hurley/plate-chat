import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { u as useMealsOnDay, a as useMealLibrary, b as useNutritionMutations, c as useMealEntries } from "./nutrition-D49dj8bQ.mjs";
import "dexie";
import "./session-CyYyvQL9.mjs";
import "./router-kvjOiOR_.mjs";
import "@tanstack/react-router";
import "@capacitor/core";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "jose";
import "@libsql/client";
import "drizzle-orm/libsql";
import "@ai-sdk/anthropic";
import "ai";
import "zod";
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
import "./hooks-Ccy1wbDZ.mjs";
import "dexie-react-hooks";
import "./writes-CNff-rob.mjs";
import "./ids-zMPBJmub.mjs";
function pad(n) {
  return n.toString().padStart(2, "0");
}
function todayKey() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function NutritionLogPage() {
  const [dayKey, setDayKey] = useState(todayKey);
  const {
    data: meals
  } = useMealsOnDay(dayKey);
  const {
    data: library
  } = useMealLibrary();
  const {
    logMeal,
    deleteMeal
  } = useNutritionMutations();
  const [expanded, setExpanded] = useState(null);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsx("input", { type: "date", value: dayKey, onChange: (e) => setDayKey(e.target.value), className: "rounded-md border bg-background px-3 py-2 text-sm" }) }),
    /* @__PURE__ */ jsx(LogMealForm, { library, onLog: async (args) => {
      await logMeal({
        dayKey,
        name: args.name,
        sourceLibraryItemId: args.sourceLibraryItemId,
        entries: args.calories > 0 ? [{
          description: args.name,
          calories: args.calories,
          proteinG: args.proteinG,
          carbsG: args.carbsG,
          fatG: args.fatG
        }] : []
      });
    } }),
    /* @__PURE__ */ jsx(MealsList, { meals, onDelete: deleteMeal, onToggle: (id) => setExpanded(expanded === id ? null : id), expandedId: expanded })
  ] });
}
function LogMealForm({
  library,
  onLog
}) {
  const [name, setName] = useState("");
  const [fromLib, setFromLib] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const libMap = useMemo(() => new Map(library.map((l) => [l.id, l])), [library]);
  return /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
    e.preventDefault();
    const base = fromLib ? libMap.get(fromLib) : null;
    await onLog({
      name: name || base?.name || "Meal",
      sourceLibraryItemId: fromLib || null,
      calories: Number(calories) || base?.calories || 0,
      proteinG: Number(proteinG) || base?.proteinG || 0,
      carbsG: Number(carbsG) || base?.carbsG || 0,
      fatG: Number(fatG) || base?.fatG || 0
    });
    setName("");
    setFromLib("");
    setCalories("");
    setProteinG("");
    setCarbsG("");
    setFatG("");
  }, className: "rounded-xl border bg-card p-3 space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs("select", { value: fromLib, onChange: (e) => {
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
      }, className: "rounded-md border bg-background px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "From library…" }),
        library.map((l) => /* @__PURE__ */ jsx("option", { value: l.id, children: l.name }, l.id))
      ] }),
      /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Meal name", className: "rounded-md border bg-background px-3 py-2 text-sm" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsx("input", { value: calories, onChange: (e) => setCalories(e.target.value), inputMode: "numeric", placeholder: "kcal", className: "rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: proteinG, onChange: (e) => setProteinG(e.target.value), inputMode: "decimal", placeholder: "P (g)", className: "rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: carbsG, onChange: (e) => setCarbsG(e.target.value), inputMode: "decimal", placeholder: "C (g)", className: "rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: fatG, onChange: (e) => setFatG(e.target.value), inputMode: "decimal", placeholder: "F (g)", className: "rounded-md border bg-background px-2 py-1 text-sm" })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "w-full rounded-md bg-primary text-primary-foreground py-2 text-sm", children: "Log meal" })
  ] });
}
function MealsList({
  meals,
  onDelete,
  onToggle,
  expandedId
}) {
  if (meals.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No meals logged today." });
  }
  return /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: meals.map((m) => /* @__PURE__ */ jsxs("li", { className: "rounded-xl border bg-card", children: [
    /* @__PURE__ */ jsxs("button", { onClick: () => onToggle(m.id), className: "w-full flex items-center justify-between p-3 text-left", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: m.name }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: new Date(m.loggedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }) })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: (e) => {
        e.stopPropagation();
        if (confirm("Delete meal?")) void onDelete(m.id);
      }, className: "text-xs text-destructive", children: "Remove" })
    ] }),
    expandedId === m.id ? /* @__PURE__ */ jsx(MealDetail, { mealId: m.id }) : null
  ] }, m.id)) });
}
function MealDetail({
  mealId
}) {
  const {
    data: entries
  } = useMealEntries(mealId);
  if (entries.length === 0) return /* @__PURE__ */ jsx("div", { className: "px-3 pb-3 text-xs text-muted-foreground", children: "No entries." });
  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    proteinG: acc.proteinG + e.proteinG,
    carbsG: acc.carbsG + e.carbsG,
    fatG: acc.fatG + e.fatG
  }), {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0
  });
  return /* @__PURE__ */ jsxs("div", { className: "px-3 pb-3 space-y-1", children: [
    /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1", children: entries.map((e) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between", children: [
      /* @__PURE__ */ jsx("span", { children: e.description }),
      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
        e.calories,
        " kcal · P",
        e.proteinG,
        " C",
        e.carbsG,
        " F",
        e.fatG
      ] })
    ] }, e.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t pt-1 text-xs text-muted-foreground flex justify-between", children: [
      /* @__PURE__ */ jsx("span", { children: "Total" }),
      /* @__PURE__ */ jsxs("span", { children: [
        totals.calories,
        " kcal · P",
        totals.proteinG,
        " C",
        totals.carbsG,
        " F",
        totals.fatG
      ] })
    ] })
  ] });
}
export {
  NutritionLogPage as component
};
