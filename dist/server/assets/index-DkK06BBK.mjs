import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Flame, Trash2, Droplets, Wheat, Beef, PlusCircle, Plus, Salad, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { B as Button, b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { C as ConfirmDialog } from "./confirm-dialog-L0Y1JjA8.mjs";
import { u as useDb, j as mondayOfWeekContaining, H as dayKeysDistance, E as computeMealPlanSlotLabels, f as formatDayKey, I as addDaysKey } from "./router-CUOzYYmk.mjs";
import { u as useLiveArray, s as softDeleteLocal, a as useLocalSession, i as insertLocal } from "./writes-C61wFNCm.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-C4819yjg.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import "dexie-react-hooks";
import "@capacitor/core";
import "dexie";
import { n as newId } from "./ids-zMPBJmub.mjs";
import { u as useMealsOnDay, a as useMealLibrary, c as useNutritionMutations } from "./nutrition-BIi3XxN5.mjs";
import { a as usePlanForWeek, b as usePlanSlots } from "./meal-plan-BFJYrRc9.mjs";
import { A as AppSubNav, a as appSubNavTriggerClassName } from "./app-sub-nav--2r0057W.mjs";
import "clsx";
import "tailwind-merge";
import "@base-ui/react/button";
import "./dialog-OkPnLnLD.mjs";
import "@base-ui/react/dialog";
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
import "@base-ui/react/input";
const DAILY_FOOD_LOG_MEAL_NAME = "Food log";
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant = "default",
  render,
  ...props
}) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps(
      {
        className: cn(badgeVariants({ variant }), className)
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant
    }
  });
}
const MACRO_BADGE = {
  p: "border-chart-1/30 bg-chart-1/12 text-chart-1",
  c: "border-chart-4/30 bg-chart-4/12 text-chart-4",
  f: "border-chart-3/30 bg-chart-3/12 text-chart-3"
};
const MACRO_ICON = {
  p: Beef,
  c: Wheat,
  f: Droplets
};
function MacroBadge({
  kind,
  value
}) {
  const letter = kind === "p" ? "P" : kind === "c" ? "C" : "F";
  const Icon = MACRO_ICON[kind];
  return /* @__PURE__ */ jsxs(
    Badge,
    {
      variant: "outline",
      className: cn(
        "h-5 tabular-nums gap-0.5 px-1.5 font-medium",
        MACRO_BADGE[kind]
      ),
      children: [
        /* @__PURE__ */ jsx(Icon, { className: "size-3 shrink-0", "aria-hidden": true }),
        letter,
        value
      ]
    }
  );
}
function FoodLogList({ meals }) {
  const { db } = useDb();
  const [removeEntryId, setRemoveEntryId] = useState(null);
  const mealIds = meals.map((m) => m.id).join(",");
  const { data: rows } = useLiveArray(
    async () => {
      if (!db) return [];
      const out = [];
      for (const meal of meals) {
        const entries = await db.mealEntries.where("mealId").equals(meal.id).toArray();
        for (const entry of entries) {
          if (entry.deletedAt !== null) continue;
          out.push({ meal, entry });
        }
      }
      return out;
    },
    [db, mealIds]
  );
  if (rows.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Nothing logged for this day yet." });
  }
  async function remove(entryId) {
    if (!db) return;
    try {
      await softDeleteLocal(db.mealEntries, entryId);
    } catch {
      toast.error("Could not remove entry");
    }
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        open: removeEntryId != null,
        onOpenChange: (open) => {
          if (!open) setRemoveEntryId(null);
        },
        title: "Remove entry?",
        description: "This food log line will be removed for this day.",
        confirmLabel: "Remove",
        cancelLabel: "Cancel",
        confirmVariant: "destructive",
        onConfirm: async () => {
          if (!removeEntryId) return;
          const id = removeEntryId;
          setRemoveEntryId(null);
          await remove(id);
        }
      }
    ),
    /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: rows.map(({ meal, entry }) => {
      const isAdHocBucket = meal.name === DAILY_FOOD_LOG_MEAL_NAME && meal.sourceLibraryItemId == null;
      return /* @__PURE__ */ jsxs(
        "li",
        {
          className: "bg-card border-primary/10 flex items-start justify-between gap-3 rounded-xl border px-3 py-3 shadow-sm",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              !isAdHocBucket ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs font-medium", children: meal.name }) : null,
              /* @__PURE__ */ jsxs("p", { className: "font-medium leading-snug", children: [
                entry.description.trim() || "Food",
                " ",
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground inline-flex items-center gap-0.5 text-sm font-normal tabular-nums", children: [
                  /* @__PURE__ */ jsx(
                    Flame,
                    {
                      className: "text-chart-2 size-3.5 shrink-0",
                      "aria-hidden": true
                    }
                  ),
                  Math.round(entry.calories),
                  " kcal"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "mt-1 inline-flex flex-wrap items-center gap-1", children: [
                /* @__PURE__ */ jsx(MacroBadge, { kind: "p", value: entry.proteinG.toFixed(0) }),
                /* @__PURE__ */ jsx(MacroBadge, { kind: "c", value: entry.carbsG.toFixed(0) }),
                /* @__PURE__ */ jsx(MacroBadge, { kind: "f", value: entry.fatG.toFixed(0) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "sm",
                onClick: () => setRemoveEntryId(entry.id),
                className: "text-destructive hover:text-destructive min-h-11 shrink-0 touch-manipulation gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "size-4", "aria-hidden": true }),
                  /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Remove" }),
                  /* @__PURE__ */ jsx("span", { className: "sr-only md:hidden", children: "Remove entry" })
                ]
              }
            )
          ]
        },
        entry.id
      );
    }) })
  ] });
}
function parseNum(raw) {
  const n = Number(String(raw).replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}
function MacroHint({
  calories,
  proteinG,
  carbsG,
  fatG
}) {
  return /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums", children: [
    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-0.5", children: [
      /* @__PURE__ */ jsx(Flame, { className: "text-chart-2 size-3", "aria-hidden": true }),
      calories,
      " cal"
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-0.5", children: [
      /* @__PURE__ */ jsx(Beef, { className: "text-chart-1 size-3", "aria-hidden": true }),
      proteinG.toFixed(0),
      "g"
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-0.5", children: [
      /* @__PURE__ */ jsx(Wheat, { className: "text-chart-4 size-3", "aria-hidden": true }),
      carbsG.toFixed(0),
      "g"
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-0.5", children: [
      /* @__PURE__ */ jsx(Droplets, { className: "text-chart-3 size-3", "aria-hidden": true }),
      fatG.toFixed(0),
      "g"
    ] })
  ] });
}
function PlanQuickAddSection({
  mealPlanWeekStart,
  hasPlannedLibraryMealsThisWeek,
  plannedSlotsForDay,
  loggedLibraryItemIds,
  onAddFromLibrary,
  pending
}) {
  const loggedSet = useMemo(
    () => new Set(loggedLibraryItemIds),
    [loggedLibraryItemIds]
  );
  const planLink = {
    to: "/app/nutrition/plan",
    search: { week: mealPlanWeekStart }
  };
  if (!hasPlannedLibraryMealsThisWeek) {
    return /* @__PURE__ */ jsx("div", { className: "border-border/80 bg-muted/20 rounded-xl border border-dashed p-4 text-sm", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
      "No recipes are assigned in your meal plan for this week yet. Set them up in ",
      /* @__PURE__ */ jsx(Link, { ...planLink, className: "text-primary font-medium underline", children: "Meal plan" }),
      ", then you can add them here in one tap."
    ] }) });
  }
  if (plannedSlotsForDay.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "border-border/80 bg-muted/20 rounded-xl border border-dashed p-4 text-sm", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
      "Nothing is planned for this day in your weekly plan. Add meals for this day in",
      " ",
      /* @__PURE__ */ jsx(Link, { ...planLink, className: "text-primary font-medium underline", children: "Meal plan" }),
      "."
    ] }) });
  }
  return /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: plannedSlotsForDay.map((slot) => {
    const alreadyLogged = loggedSet.has(slot.libraryItem.id);
    return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "border-border/80 bg-card flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
          alreadyLogged && "border-primary/25 bg-primary/[0.04]"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs font-medium", children: slot.label }),
            /* @__PURE__ */ jsx("p", { className: "text-foreground font-semibold leading-snug", children: slot.libraryItem.name }),
            /* @__PURE__ */ jsx(
              MacroHint,
              {
                calories: slot.libraryItem.calories,
                proteinG: slot.libraryItem.proteinG,
                carbsG: slot.libraryItem.carbsG,
                fatG: slot.libraryItem.fatG
              }
            )
          ] }),
          alreadyLogged ? /* @__PURE__ */ jsxs(
            "div",
            {
              className: "text-primary flex min-h-11 shrink-0 items-center justify-center gap-2 px-2 sm:justify-end",
              "aria-label": `${slot.libraryItem.name} already added to log`,
              children: [
                /* @__PURE__ */ jsx(Check, { className: "size-5 shrink-0", strokeWidth: 2.5, "aria-hidden": true }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Added" })
              ]
            }
          ) : /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              className: "min-h-11 w-full shrink-0 touch-manipulation sm:w-auto",
              disabled: pending,
              onClick: () => void onAddFromLibrary(slot.libraryItem.id),
              children: [
                /* @__PURE__ */ jsx(PlusCircle, { className: "size-4", "aria-hidden": true }),
                "Add to log"
              ]
            }
          )
        ]
      }
    ) }, slot.slotId);
  }) });
}
function AddModeTabs({
  tab,
  onTabChange
}) {
  return /* @__PURE__ */ jsxs(AppSubNav, { className: "w-full", "aria-label": "How to add to your log", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": tab === "plan",
        className: cn(appSubNavTriggerClassName(tab === "plan")),
        onClick: () => onTabChange("plan"),
        children: "Meal plan"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": tab === "manual",
        className: cn(appSubNavTriggerClassName(tab === "manual")),
        onClick: () => onTabChange("manual"),
        children: "Manual"
      }
    )
  ] });
}
function LogFoodForm({ dayKey }) {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const { data: meals } = useMealsOnDay(dayKey);
  const { data: library } = useMealLibrary();
  const { logMeal } = useNutritionMutations();
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [pending, setPending] = useState(false);
  const [tab, setTab] = useState(null);
  const mealPlanWeekStart = useMemo(
    () => mondayOfWeekContaining(dayKey),
    [dayKey]
  );
  const { data: plan } = usePlanForWeek(mealPlanWeekStart);
  const { data: allSlots } = usePlanSlots(plan?.id ?? null);
  const libById = useMemo(
    () => new Map(library.map((it) => [it.id, it])),
    [library]
  );
  const dayIndex = useMemo(() => {
    const d = dayKeysDistance(mealPlanWeekStart, dayKey);
    if (d == null) return 0;
    return Math.max(0, Math.min(6, d));
  }, [mealPlanWeekStart, dayKey]);
  const labelBySlotId = useMemo(() => {
    return computeMealPlanSlotLabels(
      allSlots.map((s) => ({
        id: s.id,
        dayIndex: s.dayIndex,
        slotIndex: s.slotIndex,
        label: s.label,
        slotKind: s.slotKind
      }))
    );
  }, [allSlots]);
  const { plannedSlotsForDay, hasPlannedLibraryMealsThisWeek } = useMemo(() => {
    const hasAny = allSlots.some((s) => s.libraryItemId != null);
    const forDay = [];
    for (const s of allSlots) {
      if (s.dayIndex !== dayIndex || s.libraryItemId == null) continue;
      const item = libById.get(s.libraryItemId);
      if (!item) continue;
      forDay.push({
        slotId: s.id,
        label: labelBySlotId.get(s.id) ?? s.label,
        slotIndex: s.slotIndex,
        libraryItem: {
          id: item.id,
          name: item.name,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG
        }
      });
    }
    forDay.sort((a, b) => a.slotIndex - b.slotIndex);
    return {
      plannedSlotsForDay: forDay,
      hasPlannedLibraryMealsThisWeek: hasAny
    };
  }, [allSlots, dayIndex, libById, labelBySlotId]);
  const preferredTab = hasPlannedLibraryMealsThisWeek ? "plan" : "manual";
  const addTab = tab ?? preferredTab;
  useEffect(() => {
    setTab(null);
  }, [dayKey]);
  const loggedLibraryItemIds = useMemo(
    () => meals.map((m) => m.sourceLibraryItemId).filter((v) => typeof v === "string"),
    [meals]
  );
  const adHocMeal = useMemo(
    () => meals.find(
      (m) => m.name === DAILY_FOOD_LOG_MEAL_NAME && m.sourceLibraryItemId == null
    ) ?? null,
    [meals]
  );
  function resetForm() {
    setDescription("");
    setCalories("");
    setProteinG("");
    setCarbsG("");
    setFatG("");
  }
  async function onLog(e) {
    e.preventDefault();
    if (!ready || !db || !userId) return;
    const desc = description.trim();
    if (!desc) {
      toast.error("Describe your food first.");
      return;
    }
    setPending(true);
    try {
      let mealId = adHocMeal?.id ?? null;
      if (!mealId) {
        mealId = await logMeal({
          dayKey,
          name: DAILY_FOOD_LOG_MEAL_NAME,
          sourceLibraryItemId: null,
          entries: []
        });
      }
      await insertLocal(db.mealEntries, {
        id: newId(),
        userId,
        mealId,
        description: desc,
        calories: parseNum(calories),
        proteinG: parseNum(proteinG),
        carbsG: parseNum(carbsG),
        fatG: parseNum(fatG)
      });
      resetForm();
      toast.success("Logged");
    } catch {
      toast.error("Could not log food.");
    } finally {
      setPending(false);
    }
  }
  async function onLogFromLibrary(libraryItemId) {
    const item = library.find((l) => l.id === libraryItemId);
    if (!item) return;
    setPending(true);
    try {
      const mealId = await logMeal({
        dayKey,
        name: item.name,
        sourceLibraryItemId: item.id,
        entries: [
          {
            description: item.name,
            calories: item.calories,
            proteinG: item.proteinG,
            carbsG: item.carbsG,
            fatG: item.fatG
          }
        ]
      });
      void mealId;
      toast.success(`Added ${item.name}`);
    } catch {
      toast.error("Could not add meal.");
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 shadow-sm", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
        /* @__PURE__ */ jsx(PlusCircle, { className: "text-primary size-5", "aria-hidden": true }),
        "Add to today"
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Add from your weekly meal plan or enter food and macros manually." })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 pt-0", children: [
      /* @__PURE__ */ jsx(AddModeTabs, { tab: addTab, onTabChange: setTab }),
      addTab === "plan" ? /* @__PURE__ */ jsx(
        PlanQuickAddSection,
        {
          mealPlanWeekStart,
          hasPlannedLibraryMealsThisWeek,
          plannedSlotsForDay,
          loggedLibraryItemIds,
          onAddFromLibrary: onLogFromLibrary,
          pending
        }
      ) : /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: onLog, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "log-desc", className: "text-base", children: "Food" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "log-desc",
                autoComplete: "off",
                placeholder: "e.g. Chicken rice bowl",
                className: "min-h-14 text-base touch-manipulation",
                value: description,
                onChange: (e) => setDescription(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "log-cal", className: "text-xs", children: "Calories" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "log-cal",
                  type: "number",
                  inputMode: "numeric",
                  min: 0,
                  placeholder: "0",
                  className: "min-h-12 md:min-h-11",
                  value: calories,
                  onChange: (e) => setCalories(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "log-p", className: "text-xs", children: "P (g)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "log-p",
                  type: "number",
                  inputMode: "decimal",
                  min: 0,
                  step: "any",
                  placeholder: "0",
                  className: "min-h-12 md:min-h-11",
                  value: proteinG,
                  onChange: (e) => setProteinG(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "log-c", className: "text-xs", children: "C (g)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "log-c",
                  type: "number",
                  inputMode: "decimal",
                  min: 0,
                  step: "any",
                  placeholder: "0",
                  className: "min-h-12 md:min-h-11",
                  value: carbsG,
                  onChange: (e) => setCarbsG(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "log-f", className: "text-xs", children: "F (g)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "log-f",
                  type: "number",
                  inputMode: "decimal",
                  min: 0,
                  step: "any",
                  placeholder: "0",
                  className: "min-h-12 md:min-h-11",
                  value: fatG,
                  onChange: (e) => setFatG(e.target.value)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              disabled: pending,
              className: "min-h-12 w-full gap-2 text-base shadow-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "size-4", "aria-hidden": true }),
                "Log food"
              ]
            }
          )
        ] }),
        library.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between gap-2", children: /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-1.5 text-sm font-semibold", children: [
            /* @__PURE__ */ jsx(
              Salad,
              {
                className: "text-primary size-4 shrink-0",
                "aria-hidden": true
              }
            ),
            "From your library"
          ] }) }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: library.slice(0, 8).map((it) => /* @__PURE__ */ jsxs(
            "li",
            {
              className: "border-primary/15 bg-card flex items-center justify-between gap-2 rounded-lg border p-2",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium", children: it.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs tabular-nums", children: [
                    Math.round(it.calories),
                    " kcal · P",
                    Math.round(it.proteinG),
                    " · C",
                    Math.round(it.carbsG),
                    " · F",
                    Math.round(it.fatG)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    className: "shrink-0",
                    disabled: pending,
                    onClick: () => void onLogFromLibrary(it.id),
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "size-4", "aria-hidden": true }),
                      "Add"
                    ]
                  }
                )
              ]
            },
            it.id
          )) })
        ] }) : null
      ] })
    ] })
  ] });
}
function formatDayLabel(dayKey) {
  const [y, m, d] = dayKey.split("-").map((n) => Number(n));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
function NutritionLogPage() {
  const [dayKey, setDayKey] = useState(() => formatDayKey());
  const {
    data: meals
  } = useMealsOnDay(dayKey);
  const {
    db
  } = useDb();
  const mealIds = meals.map((m) => m.id).join(",");
  const {
    data: totalsArr
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
  }, [db, mealIds]);
  const totals = totalsArr[0] ?? {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0
  };
  const prevDay = useMemo(() => addDaysKey(dayKey, -1), [dayKey]);
  const nextDay = useMemo(() => addDaysKey(dayKey, 1), [dayKey]);
  const today = formatDayKey();
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-6 md:max-w-7xl", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(Salad, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
        "Nutrition"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Log meals and track daily macros." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setDayKey(prevDay), className: cn(buttonVariants({
        variant: "outline",
        size: "sm"
      }), "border-primary/20 min-h-11 gap-1.5"), children: [
        /* @__PURE__ */ jsx(ChevronLeft, { className: "size-4", "aria-hidden": true }),
        "Prev"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: formatDayLabel(dayKey) }),
        dayKey !== today ? /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setDayKey(today), className: "text-primary text-xs font-medium underline-offset-4 hover:underline", children: "Jump to today" }) : null
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setDayKey(nextDay), className: cn(buttonVariants({
        variant: "outline",
        size: "sm"
      }), "border-primary/20 min-h-11 gap-1.5"), children: [
        "Next",
        /* @__PURE__ */ jsx(ChevronRight, { className: "size-4", "aria-hidden": true })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "border-primary/15 bg-card rounded-xl border p-4 shadow-sm", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Day totals" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "border-chart-2/25 bg-chart-2/5 rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-chart-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase", children: [
            /* @__PURE__ */ jsx(Flame, { className: "size-3.5 shrink-0", "aria-hidden": true }),
            "Calories"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-chart-2 mt-1 text-2xl font-semibold tabular-nums", children: Math.round(totals.calories) }),
          /* @__PURE__ */ jsx("p", { className: "text-chart-2/80 mt-0.5 text-xs", children: "kcal" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-chart-1/25 bg-chart-1/5 rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-chart-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase", children: [
            /* @__PURE__ */ jsx(Beef, { className: "size-3.5 shrink-0", "aria-hidden": true }),
            "Protein"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-chart-1 mt-1 text-2xl font-semibold tabular-nums", children: [
            Math.round(totals.proteinG),
            /* @__PURE__ */ jsx("span", { className: "text-chart-1/80 ml-0.5 text-sm", children: "g" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-chart-4/25 bg-chart-4/5 rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-chart-4 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase", children: [
            /* @__PURE__ */ jsx(Wheat, { className: "size-3.5 shrink-0", "aria-hidden": true }),
            "Carbs"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-chart-4 mt-1 text-2xl font-semibold tabular-nums", children: [
            Math.round(totals.carbsG),
            /* @__PURE__ */ jsx("span", { className: "text-chart-4/80 ml-0.5 text-sm", children: "g" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-chart-3/25 bg-chart-3/5 rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-chart-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase", children: [
            /* @__PURE__ */ jsx(Droplets, { className: "size-3.5 shrink-0", "aria-hidden": true }),
            "Fat"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-chart-3 mt-1 text-2xl font-semibold tabular-nums", children: [
            Math.round(totals.fatG),
            /* @__PURE__ */ jsx("span", { className: "text-chart-3/80 ml-0.5 text-sm", children: "g" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-[1fr_minmax(0,22rem)] md:items-start", children: [
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: dayKey === today ? "Today's log" : "Logged" }),
        /* @__PURE__ */ jsx(FoodLogList, { meals })
      ] }),
      /* @__PURE__ */ jsx(LogFoodForm, { dayKey })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsx(Link, { to: "/app/nutrition/library", className: "text-primary text-sm font-medium underline-offset-4 hover:underline", children: "Manage recipe library →" }) })
  ] });
}
export {
  NutritionLogPage as component
};
