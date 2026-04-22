import { jsxs, jsx } from "react/jsx-runtime";
import { useCallback, useState, useEffect, useMemo } from "react";
import { u as useLocalSession } from "./session-CyYyvQL9.mjs";
import { u as useDb, b as authFetch } from "./router-kvjOiOR_.mjs";
import { a as useLiveOne, u as useLiveArray } from "./hooks-Ccy1wbDZ.mjs";
import { i as insertLocal, u as updateLocal, s as softDeleteLocal } from "./writes-CNff-rob.mjs";
import { n as newId, a as nowMs } from "./ids-zMPBJmub.mjs";
import { a as useMealLibrary } from "./nutrition-D49dj8bQ.mjs";
import { u as useOnline } from "./use-online-BuWfYSX8.mjs";
import "@tanstack/react-router";
import "dexie";
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
import "dexie-react-hooks";
function usePlanForWeek(weekStartDayKey) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne(
    async () => {
      if (!db || !userId) return null;
      const rows = await db.mealPlans.where("[userId+weekStartDayKey]").equals([userId, weekStartDayKey]).toArray();
      return rows.find((r) => r.deletedAt === null) ?? null;
    },
    [db, userId, weekStartDayKey]
  );
}
function usePlanSlots(planId) {
  const { db } = useDb();
  return useLiveArray(
    async () => {
      if (!db || !planId) return [];
      const rows = await db.mealPlanSlots.where("planId").equals(planId).toArray();
      return rows.filter((r) => r.deletedAt === null).sort(
        (a, b) => a.dayIndex - b.dayIndex || a.slotIndex - b.slotIndex
      );
    },
    [db, planId]
  );
}
function useMealPlanMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const ensurePlan = useCallback(
    async (weekStartDayKey) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const existing = await db.mealPlans.where("[userId+weekStartDayKey]").equals([userId, weekStartDayKey]).toArray();
      const alive = existing.find((r) => r.deletedAt === null);
      if (alive) return alive.id;
      const id = newId();
      await insertLocal(db.mealPlans, {
        id,
        userId,
        weekStartDayKey,
        createdAt: nowMs(),
        aiShoppingListJson: "[]",
        shoppingListSourceHash: null
      });
      return id;
    },
    [db, ready, userId]
  );
  const setSlotMeal = useCallback(
    async (planId, dayIndex, slotIndex, input) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = await db.mealPlanSlots.where("[planId+dayIndex+slotIndex]").equals([planId, dayIndex, slotIndex]).toArray();
      const alive = matches.find((r) => r.deletedAt === null);
      if (alive) {
        await updateLocal(db.mealPlanSlots, alive.id, {
          slotKind: input.slotKind,
          label: input.label,
          libraryItemId: input.libraryItemId
        });
        return;
      }
      await insertLocal(db.mealPlanSlots, {
        id: newId(),
        userId,
        planId,
        dayIndex,
        slotIndex,
        slotKind: input.slotKind,
        label: input.label,
        libraryItemId: input.libraryItemId
      });
    },
    [db, ready, userId]
  );
  const clearSlot = useCallback(
    async (planId, dayIndex, slotIndex) => {
      if (!ready || !db) throw new Error("Not ready");
      const matches = await db.mealPlanSlots.where("[planId+dayIndex+slotIndex]").equals([planId, dayIndex, slotIndex]).toArray();
      const alive = matches.find((r) => r.deletedAt === null);
      if (!alive) return;
      await softDeleteLocal(db.mealPlanSlots, alive.id);
    },
    [db, ready]
  );
  return { ensurePlan, setSlotMeal, clearSlot };
}
function pad(n) {
  return n.toString().padStart(2, "0");
}
function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function weekStart(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
}
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_SLOTS = [{
  slotIndex: 0,
  slotKind: "meal",
  label: "Breakfast"
}, {
  slotIndex: 1,
  slotKind: "meal",
  label: "Lunch"
}, {
  slotIndex: 2,
  slotKind: "meal",
  label: "Dinner"
}, {
  slotIndex: 3,
  slotKind: "snack",
  label: "Snack"
}];
function PlanPage() {
  const online = useOnline();
  const [anchor, setAnchor] = useState(() => weekStart(/* @__PURE__ */ new Date()));
  const weekKey = toKey(anchor);
  const {
    data: plan
  } = usePlanForWeek(weekKey);
  const {
    data: slots
  } = usePlanSlots(plan?.id ?? null);
  const {
    data: library
  } = useMealLibrary();
  const {
    ensurePlan,
    setSlotMeal,
    clearSlot
  } = useMealPlanMutations();
  useEffect(() => {
    if (!plan) void ensurePlan(weekKey);
  }, [plan, weekKey, ensurePlan]);
  const libMap = useMemo(() => new Map(library.map((l) => [l.id, l.name])), [library]);
  const slotIndex = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of slots) m.set(`${s.dayIndex}:${s.slotIndex}`, s);
    return m;
  }, [slots]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const shoppingList = useMemo(() => {
    if (!plan?.aiShoppingListJson) return [];
    try {
      const raw = JSON.parse(plan.aiShoppingListJson);
      if (!Array.isArray(raw)) return [];
      return raw.map(String);
    } catch {
      return [];
    }
  }, [plan?.aiShoppingListJson]);
  const onGenerate = async () => {
    if (!plan) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await authFetch("/api/nutrition/meal-plan/shopping-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planId: plan.id
        })
      });
      if (!res.ok) {
        setGenError(`Failed (${res.status})`);
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        const d = new Date(anchor);
        d.setDate(d.getDate() - 7);
        setAnchor(d);
      }, className: "rounded-md border px-2 py-1 text-sm", children: "←" }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
        "Week of ",
        weekKey
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        const d = new Date(anchor);
        d.setDate(d.getDate() + 7);
        setAnchor(d);
      }, className: "rounded-md border px-2 py-1 text-sm", children: "→" })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-7 gap-2", children: DAY_LABELS.map((label, dayIndex) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-2 space-y-2", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: label }),
      DEFAULT_SLOTS.map((ds) => {
        const existing = slotIndex.get(`${dayIndex}:${ds.slotIndex}`);
        return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: ds.label }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxs("select", { value: existing?.libraryItemId ?? "", onChange: (e) => {
              if (!plan) return;
              const libId = e.target.value || null;
              const libName = libId ? libMap.get(libId) : null;
              void setSlotMeal(plan.id, dayIndex, ds.slotIndex, {
                slotKind: ds.slotKind,
                label: libName ?? ds.label,
                libraryItemId: libId
              });
            }, className: "flex-1 min-w-0 rounded-md border bg-background px-2 py-1 text-xs", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "—" }),
              library.map((l) => /* @__PURE__ */ jsx("option", { value: l.id, children: l.name }, l.id))
            ] }),
            existing ? /* @__PURE__ */ jsx("button", { onClick: () => plan && clearSlot(plan.id, dayIndex, ds.slotIndex), className: "rounded-md border px-2 text-xs text-destructive", children: "×" }) : null
          ] })
        ] }, ds.slotIndex);
      })
    ] }, dayIndex)) }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-xl border bg-card p-3 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-medium", children: "Shopping list" }),
        /* @__PURE__ */ jsx("button", { onClick: onGenerate, disabled: !online || generating || !plan, className: "rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm disabled:opacity-60", title: online ? "" : "Offline — reconnect to generate", children: generating ? "Generating…" : "Generate" })
      ] }),
      !online ? /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-700 dark:text-amber-300", children: "Offline — last generated list is still readable below." }) : null,
      genError ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: genError }) : null,
      shoppingList.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No shopping list yet. Fill the plan then generate." }) : /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1 list-disc pl-5", children: shoppingList.map((item, i) => /* @__PURE__ */ jsx("li", { children: item }, i)) })
    ] })
  ] });
}
export {
  PlanPage as component
};
