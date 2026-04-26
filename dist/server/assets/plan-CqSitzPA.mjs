import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { ClipboardCopy, Sparkles, RefreshCw, CalendarRange, CloudOff } from "lucide-react";
import { u as useCoachRuntimeOptional } from "./coach-runtime-BX8b2qqH.mjs";
import { B as Button, b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, S as ShoppingSectionIcon, c as AccordionContent, d as buildMealPlanBoardView, M as MealPlanBoard } from "./meal-plan-board-view-C8LpyvEs.mjs";
import { toast } from "sonner";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-C4819yjg.mjs";
import { g as authFetch, h as Route, j as mondayOfWeekContaining, f as formatDayKey } from "./router-CUOzYYmk.mjs";
import { u as useOnline } from "./use-online-B1QDuTlA.mjs";
import { C as COACH_MEAL_PLAN_PROMPT } from "./coach-nutrition-prompts-3tzCyDz-.mjs";
import "@capacitor/core";
import "dexie-react-hooks";
import "dexie";
import { a as useMealLibrary, b as useMealLibraryIngredientsForItems } from "./nutrition-BIi3XxN5.mjs";
import { u as useMealPlanMutations, a as usePlanForWeek, b as usePlanSlots } from "./meal-plan-BFJYrRc9.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "@ai-sdk/react";
import "ai";
import "./dialog-OkPnLnLD.mjs";
import "@base-ui/react/dialog";
import "@base-ui/react/tabs";
import "class-variance-authority";
import "./assistant-message-parts-Cx-nfSv6.mjs";
import "./assistant-markdown-BkDNTUMc.mjs";
import "react-markdown";
import "remark-gfm";
import "./confirm-dialog-L0Y1JjA8.mjs";
import "./scroll-area-BUy2INq0.mjs";
import "@base-ui/react/scroll-area";
import "@base-ui/react/button";
import "@radix-ui/react-accordion";
import "./meal-library-json-CDywx7OK.mjs";
import "./label-BX01hlq_.mjs";
import "@base-ui/react/input";
import "./autocomplete-combobox-Bz_SOWqH.mjs";
import "react-dom";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "zod";
import "@libsql/client";
import "drizzle-orm/libsql";
import "jose";
import "@ai-sdk/anthropic";
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
import "./writes-C61wFNCm.mjs";
import "./ids-zMPBJmub.mjs";
import "clsx";
import "tailwind-merge";
function buildCopyText(list) {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });
  const lines = [];
  for (const { section, items } of list.bySection) {
    lines.push(section);
    for (const { label, estimatedCostUsd } of items) {
      if (estimatedCostUsd != null) {
        lines.push(`• ${label} — ${fmt.format(estimatedCostUsd)}`);
      } else {
        lines.push(`• ${label}`);
      }
    }
    lines.push("");
  }
  if (list.aiGenerated && list.totalEstimatedUsd != null) {
    lines.push(`Estimated total: ${fmt.format(list.totalEstimatedUsd)}`);
  }
  return lines.join("\n").trim();
}
function shoppingListUrl(weekStartDayKey) {
  const u = new URL(
    "/api/nutrition/meal-plan/shopping-list",
    window.location.origin
  );
  u.searchParams.set("weekStart", weekStartDayKey);
  return u.pathname + u.search;
}
function PlanShoppingListCard({
  weekStartDayKey,
  shoppingList,
  onListUpdated
}) {
  const [busy, setBusy] = useState(false);
  const shoppingText = useMemo(
    () => buildCopyText(shoppingList),
    [shoppingList]
  );
  const fmt = useMemo(
    () => new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }),
    []
  );
  const lineCount = shoppingList.bySection.reduce(
    (acc, s) => acc + s.items.length,
    0
  );
  const defaultOpenSections = useMemo(
    () => shoppingList.bySection.map((_, i) => `section-${i}`),
    [shoppingList.bySection]
  );
  async function runPostGenerate() {
    setBusy(true);
    try {
      const res = await authFetch(shoppingListUrl(weekStartDayKey), {
        method: "POST"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Couldn’t update the shopping list");
        return;
      }
      const data = await res.json();
      onListUpdated(data.shoppingList);
      toast.success("Shopping list updated");
    } catch {
      toast.error("Couldn’t update the shopping list");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 overflow-hidden", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex flex-wrap items-center gap-2 text-lg", children: [
        /* @__PURE__ */ jsx(ClipboardCopy, { className: "text-chart-2 size-5 shrink-0", "aria-hidden": true }),
        "Shopping list",
        shoppingList.aiGenerated ? /* @__PURE__ */ jsxs(
          "span",
          {
            className: "border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5",
            "aria-label": "AI-generated shopping list",
            title: "Sections, quantities, and price estimates from your meal plan",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "size-3.5 shrink-0", "aria-hidden": true }),
              /* @__PURE__ */ jsx("span", { className: "text-[0.65rem] font-semibold uppercase tracking-wide", children: "AI" })
            ]
          }
        ) : null
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { children: shoppingList.awaitingAiGeneration ? shoppingList.mealPlanUpdatedSinceShoppingList ? "Your meal plan changed. Generate a new list so it matches what you’re cooking this week." : "Your meals have ingredients. Generate a store-style list with sections and rough price estimates when you’re ready." : shoppingList.aiGenerated ? "Grouped by store section with rough US price estimates. Tap a section to expand or collapse." : "Ingredient lines from your assigned meals (combined where the same line appears more than once)." }),
      shoppingList.aiNotice ? /* @__PURE__ */ jsx("p", { className: "text-amber-700 dark:text-amber-500/90 mt-2 text-sm leading-snug", children: shoppingList.aiNotice }) : null
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: shoppingList.awaitingAiGeneration ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          className: "w-full touch-manipulation sm:w-auto",
          disabled: busy,
          onClick: () => {
            void runPostGenerate();
          },
          children: [
            /* @__PURE__ */ jsx(
              Sparkles,
              {
                className: `size-4 ${busy ? "animate-pulse" : ""}`,
                "aria-hidden": true
              }
            ),
            busy ? "Generating…" : "Generate shopping list"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm leading-relaxed", children: shoppingList.mealPlanUpdatedSinceShoppingList ? /* @__PURE__ */ jsx(Fragment, { children: "This shopping list hasn’t been generated for your current meal plan. Generate again to refresh sections and price estimates." }) : /* @__PURE__ */ jsx(Fragment, { children: "The list is not generated yet. You can keep editing your meal plan; generation runs only when you use the button above." }) })
    ] }) : lineCount === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Assign meals above to build a list." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap", children: /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          className: "border-primary/20 w-full touch-manipulation sm:w-auto",
          disabled: busy || lineCount === 0,
          title: lineCount === 0 ? "Assign meals first" : "Clear cached list and run AI again (or refresh merged lines)",
          onClick: () => {
            void runPostGenerate();
          },
          children: [
            /* @__PURE__ */ jsx(
              RefreshCw,
              {
                className: `size-4 ${busy ? "animate-spin" : ""}`,
                "aria-hidden": true
              }
            ),
            "Regenerate list"
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(
        Accordion,
        {
          type: "multiple",
          defaultValue: defaultOpenSections,
          className: "w-full",
          children: shoppingList.bySection.map((sec, i) => /* @__PURE__ */ jsxs(
            AccordionItem,
            {
              value: `section-${i}`,
              className: "border-border/60 border-b last:border-b-0",
              children: [
                /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-foreground py-3 hover:no-underline", children: /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-2.5 pr-2", children: [
                  /* @__PURE__ */ jsx(ShoppingSectionIcon, { section: sec.section }),
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground min-w-0 flex-1 truncate text-left text-xs font-semibold tracking-wide uppercase", children: sec.section }),
                  /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground shrink-0 text-[0.65rem] font-normal tabular-nums", children: [
                    sec.items.length,
                    " ",
                    sec.items.length === 1 ? "item" : "items"
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx(AccordionContent, { className: "px-0", children: /* @__PURE__ */ jsx("ul", { className: "space-y-1.5 pb-1 text-sm", children: sec.items.map((row, j) => /* @__PURE__ */ jsxs(
                  "li",
                  {
                    className: "border-border/60 flex items-baseline justify-between gap-3 border-b border-dotted pb-1.5 pl-1 last:border-0",
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "text-foreground min-w-0 flex-1 leading-snug", children: row.label }),
                      row.estimatedCostUsd != null ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0 tabular-nums", children: fmt.format(row.estimatedCostUsd) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/50 shrink-0 text-xs", children: "—" })
                    ]
                  },
                  `${sec.section}-${row.label}-${j}`
                )) }) })
              ]
            },
            `${sec.section}-${i}`
          ))
        }
      ),
      shoppingList.aiGenerated && shoppingList.totalEstimatedUsd != null ? /* @__PURE__ */ jsxs("div", { className: "border-border flex items-baseline justify-between gap-3 border-t pt-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-foreground text-sm font-semibold", children: "Estimated total" }),
        /* @__PURE__ */ jsx("span", { className: "text-foreground text-base font-semibold tabular-nums", children: fmt.format(shoppingList.totalEstimatedUsd) })
      ] }) : null,
      shoppingList.aiGenerated ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-[0.7rem] leading-relaxed", children: "Dollar amounts are AI ballpark estimates for a typical US supermarket; your store, brand, and sales will differ." }) : null,
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap", children: /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          className: "border-primary/20 w-full touch-manipulation sm:w-auto",
          onClick: async () => {
            try {
              await navigator.clipboard.writeText(shoppingText);
            } catch {
            }
          },
          children: [
            /* @__PURE__ */ jsx(ClipboardCopy, { className: "size-4", "aria-hidden": true }),
            "Copy list"
          ]
        }
      ) })
    ] }) })
  ] });
}
const EMPTY_SHOPPING = {
  aiGenerated: false,
  bySection: [],
  totalEstimatedUsd: null
};
function useShoppingListView(weekKey, online) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const coach = useCoachRuntimeOptional();
  const coachWorking = coach?.coachAgentWorking ?? false;
  const prevCoachWorkingRef = useRef(coachWorking);
  const [coachFinishedBump, setCoachFinishedBump] = useState(0);
  useEffect(() => {
    if (prevCoachWorkingRef.current && !coachWorking) {
      setCoachFinishedBump((n) => n + 1);
    }
    prevCoachWorkingRef.current = coachWorking;
  }, [coachWorking]);
  useEffect(() => {
    if (!online) {
      setData(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const u = `/api/nutrition/meal-plan/shopping-list?weekStart=${encodeURIComponent(weekKey)}`;
        const res = await authFetch(u);
        if (!alive) return;
        if (!res.ok) {
          setData(null);
          return;
        }
        const j = await res.json();
        setData(j.shoppingList);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [weekKey, online, coachFinishedBump]);
  return {
    data,
    loading
  };
}
function PlanPage() {
  const {
    week: weekParam
  } = Route.useSearch();
  const online = useOnline();
  const {
    ensurePlan
  } = useMealPlanMutations();
  const weekKey = useMemo(() => {
    if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
      return mondayOfWeekContaining(weekParam);
    }
    return mondayOfWeekContaining(formatDayKey());
  }, [weekParam]);
  const thisWeek = useMemo(() => mondayOfWeekContaining(formatDayKey()), []);
  const {
    data: plan
  } = usePlanForWeek(weekKey);
  const {
    data: slots
  } = usePlanSlots(plan?.id ?? null);
  const {
    data: library
  } = useMealLibrary();
  const libIds = useMemo(() => [...new Set(slots.map((s) => s.libraryItemId).filter(Boolean))], [slots]);
  const {
    data: allIngs
  } = useMealLibraryIngredientsForItems(libIds);
  const {
    data: serverShopping
  } = useShoppingListView(weekKey, online);
  const [clientShopping, setClientShopping] = useState(null);
  useEffect(() => {
    if (serverShopping != null) setClientShopping(serverShopping);
  }, [serverShopping]);
  const shoppingDisplay = clientShopping ?? serverShopping ?? EMPTY_SHOPPING;
  useEffect(() => {
    void ensurePlan(weekKey);
  }, [weekKey, ensurePlan]);
  const itemsById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    const byLib = /* @__PURE__ */ new Map();
    for (const ing of allIngs) {
      const arr = byLib.get(ing.libraryItemId) ?? [];
      arr.push(ing);
      byLib.set(ing.libraryItemId, arr);
    }
    for (const item of library) m.set(item.id, {
      item,
      ingredients: byLib.get(item.id) ?? []
    });
    return m;
  }, [library, allIngs]);
  const planBoard = useMemo(() => {
    if (!plan) return null;
    return buildMealPlanBoardView({
      id: plan.id,
      weekStartDayKey: plan.weekStartDayKey
    }, slots, itemsById);
  }, [plan, slots, itemsById]);
  const libraryOptions = useMemo(() => library.map((i) => ({
    id: i.id,
    name: i.name
  })), [library]);
  if (!plan || !planBoard) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-10", children: "Loading…" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-6 md:max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(CalendarRange, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
          "Meal plan"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Plan the week, tap a meal for details, or use Edit plan to add slots and assign recipes." }),
        weekKey !== thisWeek ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm", children: /* @__PURE__ */ jsx(Link, { to: "/app/nutrition/plan", search: {}, className: "text-primary font-medium underline-offset-4 hover:underline", children: "Jump to this week" }) }) : null
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2", children: /* @__PURE__ */ jsxs(Link, { to: "/app/coach", search: {
        prompt: COACH_MEAL_PLAN_PROMPT
      }, className: cn(buttonVariants({
        variant: "outline"
      }), "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"), children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "size-4", "aria-hidden": true }),
        "Create with AI"
      ] }) })
    ] }),
    libraryOptions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: cn("border-primary/15 bg-card text-muted-foreground rounded-xl border p-4 text-sm shadow-sm"), children: [
      "Your recipe library is empty. Add meals in",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/app/nutrition/library", className: "text-primary font-medium underline", children: "Recipe library" }),
      " ",
      "first, then you can assign them here."
    ] }) : null,
    /* @__PURE__ */ jsx(MealPlanBoard, { weekStartDayKey: weekKey, plan: planBoard, libraryOptions }),
    !online ? /* @__PURE__ */ jsxs("p", { className: "inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200", children: [
      /* @__PURE__ */ jsx(CloudOff, { className: "size-4", "aria-hidden": true }),
      "Offline — shopping list requires a connection to generate or refresh."
    ] }) : null,
    /* @__PURE__ */ jsx(PlanShoppingListCard, { weekStartDayKey: weekKey, shoppingList: online ? shoppingDisplay : EMPTY_SHOPPING, onListUpdated: (v) => setClientShopping(v) })
  ] });
}
export {
  PlanPage as component
};
