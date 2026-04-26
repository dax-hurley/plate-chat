import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { useId, useTransition, useState, useMemo, useEffect } from "react";
import { ChevronDown, CalendarDays, MoreHorizontal, SprayCan, Cookie, CupSoda, Bean, FlaskConical, Soup, Package, Snowflake, Croissant, Milk, Fish, Carrot, ListOrdered, ChevronLeft, CalendarRange, ChevronRight, ShoppingBasket, Check, Pencil, ChevronsUpDown, ChevronsDownUp, Plus, UtensilsCrossed, Trash2, Flame, Beef, Wheat, Droplets, Coffee, Sandwich } from "lucide-react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { C as Card, a as CardHeader, b as CardTitle } from "./card-C4819yjg.mjs";
import { I as addDaysKey, J as parseDayKey, E as computeMealPlanSlotLabels } from "./router-CUOzYYmk.mjs";
import { toast } from "sonner";
import { u as useMealPlanMutations, M as MAX_MEAL_SLOTS_PER_DAY, c as MAX_SNACK_SLOTS_PER_DAY } from "./meal-plan-BFJYrRc9.mjs";
import "@capacitor/core";
import "dexie-react-hooks";
import "dexie";
import { M as MealCookingInstructionsDialog, a as LibraryMealDialog, t as toMealLibraryItemJson } from "./meal-library-json-CDywx7OK.mjs";
import { A as AutocompleteCombobox } from "./autocomplete-combobox-Bz_SOWqH.mjs";
const Accordion = AccordionPrimitive.Root;
const AccordionItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Item,
  {
    ref,
    "data-slot": "accordion-item",
    className: cn(className),
    ...props
  }
));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs(
  AccordionPrimitive.Trigger,
  {
    ref,
    "data-slot": "accordion-trigger",
    className: cn(
      "flex flex-1 items-center justify-between gap-2 py-3 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg:last-child]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronDown, { className: "text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Content,
  {
    ref,
    "data-slot": "accordion-content",
    className: "overflow-hidden text-sm",
    ...props,
    children: /* @__PURE__ */ jsx("div", { className: cn("pb-3 pt-0", className), children })
  }
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
const SECTION_ICON = {
  Produce: Carrot,
  "Meat & seafood": Fish,
  "Dairy & eggs": Milk,
  Bakery: Croissant,
  Frozen: Snowflake,
  Pantry: Package,
  "Canned goods": Soup,
  "Condiments & oils": FlaskConical,
  "Spices & seasonings": Bean,
  Beverages: CupSoda,
  "Snacks & misc": Cookie,
  "Non-food / household": SprayCan,
  Other: MoreHorizontal
};
const FALLBACK_ICON = ListOrdered;
function ShoppingSectionIcon({
  section,
  className
}) {
  const Icon = SECTION_ICON[section] ?? FALLBACK_ICON;
  return /* @__PURE__ */ jsx(
    Icon,
    {
      className: cn("text-primary size-4 shrink-0", className),
      "aria-hidden": true
    }
  );
}
function MealPlanDayIcon({ className }) {
  return /* @__PURE__ */ jsx(
    CalendarDays,
    {
      className: cn("text-primary size-4 shrink-0", className),
      "aria-hidden": true
    }
  );
}
function LibraryMealPicker({
  options,
  value,
  onSelect,
  disabled,
  label
}) {
  const baseId = useId();
  const emptyLibrary = options.length === 0;
  return /* @__PURE__ */ jsx(
    AutocompleteCombobox,
    {
      id: `${baseId}-meal`,
      "aria-label": label,
      options: options.map((o) => ({ value: o.id, label: o.name })),
      value,
      onValueChange: onSelect,
      allowNone: true,
      disabled: disabled || emptyLibrary,
      placeholder: emptyLibrary ? "Add meals in the library first" : "Search or choose a meal…",
      emptyText: "No meals match your search.",
      inputClassName: "h-11"
    }
  );
}
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_DAY_ACCORDION = [
  "day-0",
  "day-1",
  "day-2",
  "day-3",
  "day-4",
  "day-5",
  "day-6"
];
const ALL_DAY_ACCORDION_VALUES = [...DEFAULT_DAY_ACCORDION];
function allAccordionDaysOpen(values) {
  return values.length === ALL_DAY_ACCORDION_VALUES.length && ALL_DAY_ACCORDION_VALUES.every((v) => values.includes(v));
}
function dayHeading(weekStart, dayIndex) {
  const key = addDaysKey(weekStart, dayIndex);
  const d = parseDayKey(key);
  const datePart = d?.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  }) ?? key;
  return `${SHORT_DAYS[dayIndex]} · ${datePart}`;
}
function weekRangeLabel(weekStart) {
  const a = parseDayKey(weekStart);
  const b = parseDayKey(addDaysKey(weekStart, 6));
  if (!a || !b) return weekStart;
  const y = a.getFullYear();
  const sameYear = y === b.getFullYear();
  const left = a.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric",
    year: sameYear ? void 0 : "numeric"
  });
  const right = b.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  return `${left} – ${right}`;
}
function MealSlotTypeIcon({ label }) {
  const l = label.trim();
  if (/^Snack\b/i.test(l)) {
    return /* @__PURE__ */ jsx(Cookie, { className: "text-amber-600 dark:text-amber-500 size-5", "aria-hidden": true });
  }
  if (l === "Breakfast") {
    return /* @__PURE__ */ jsx(Coffee, { className: "text-chart-4 size-5", "aria-hidden": true });
  }
  if (l === "Dinner") {
    return /* @__PURE__ */ jsx(UtensilsCrossed, { className: "text-chart-2 size-5", "aria-hidden": true });
  }
  if (l === "Lunch" || /\bLunch\b/i.test(l)) {
    return /* @__PURE__ */ jsx(Sandwich, { className: "text-chart-1 size-5", "aria-hidden": true });
  }
  return /* @__PURE__ */ jsx(UtensilsCrossed, { className: "text-muted-foreground size-5", "aria-hidden": true });
}
function MacroStrip({
  calories,
  proteinG,
  carbsG,
  fatG,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Flame, { className: "text-chart-2 size-3.5", "aria-hidden": true }),
          calories,
          " cal"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Beef, { className: "text-chart-1 size-3.5", "aria-hidden": true }),
          proteinG.toFixed(0),
          "g P"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Wheat, { className: "text-chart-4 size-3.5", "aria-hidden": true }),
          carbsG.toFixed(0),
          "g C"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Droplets, { className: "text-chart-3 size-3.5", "aria-hidden": true }),
          fatG.toFixed(0),
          "g F"
        ] })
      ]
    }
  );
}
function assignmentFromDraft(slot, draft) {
  return Object.prototype.hasOwnProperty.call(draft, slot.id) ? draft[slot.id] : slot.libraryItemId;
}
function macroContributionForSlot(slot, planEditMode, draftLibraryBySlotId) {
  if (planEditMode) {
    const draft = assignmentFromDraft(slot, draftLibraryBySlotId);
    return draft === slot.libraryItemId && slot.libraryItem ? slot.libraryItem : null;
  }
  return slot.libraryItem;
}
function sumDayMacros(daySlots, planEditMode, draftLibraryBySlotId) {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  for (const slot of daySlots) {
    const item = macroContributionForSlot(
      slot,
      planEditMode,
      draftLibraryBySlotId
    );
    if (item) {
      calories += item.calories;
      proteinG += item.proteinG;
      carbsG += item.carbsG;
      fatG += item.fatG;
    }
  }
  return { calories, proteinG, carbsG, fatG };
}
function MealPlanBoard({
  weekStartDayKey,
  plan,
  libraryOptions,
  showWeekNav = true,
  showThisWeekHeader = true
}) {
  const { addMealPlanSlot, removeMealPlanSlot, saveMealPlanLibraryAssignments } = useMealPlanMutations();
  const [pending, startTransition] = useTransition();
  const [removingSlotId, setRemovingSlotId] = useState(null);
  const [openDayValues, setOpenDayValues] = useState(() => [
    ...DEFAULT_DAY_ACCORDION
  ]);
  const [libraryMealModalItem, setLibraryMealModalItem] = useState(null);
  const [libraryEditItem, setLibraryEditItem] = useState(null);
  const [planEditMode, setPlanEditMode] = useState(false);
  const [draftLibraryBySlotId, setDraftLibraryBySlotId] = useState({});
  const slotIdsKey = useMemo(
    () => [...plan.slots].sort((a, b) => a.id.localeCompare(b.id)).map((s) => s.id).join(),
    [plan.slots]
  );
  useEffect(() => {
    if (!planEditMode) return;
    setDraftLibraryBySlotId((prev) => {
      const next = {};
      for (const s of plan.slots) {
        next[s.id] = Object.prototype.hasOwnProperty.call(prev, s.id) ? prev[s.id] : s.libraryItemId;
      }
      return next;
    });
  }, [planEditMode, slotIdsKey, plan.slots]);
  const isPlanDirty = useMemo(
    () => planEditMode && plan.slots.some(
      (s) => assignmentFromDraft(s, draftLibraryBySlotId) !== s.libraryItemId
    ),
    [planEditMode, plan.slots, draftLibraryBySlotId]
  );
  const prevWeek = addDaysKey(weekStartDayKey, -7);
  const nextWeek = addDaysKey(weekStartDayKey, 7);
  const slotsByDay = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of plan.slots) {
      const di = Math.trunc(Number(s.dayIndex));
      if (di < 0 || di > 6) continue;
      if (!m.has(di)) m.set(di, []);
      m.get(di).push(s);
    }
    for (const arr of m.values()) {
      arr.sort(
        (a, b) => Number(a.slotIndex) - Number(b.slotIndex)
      );
    }
    return m;
  }, [plan.slots]);
  const dayMacroTotals = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (let d = 0; d < 7; d++) {
      const daySlots = slotsByDay.get(d) ?? [];
      m.set(
        d,
        sumDayMacros(daySlots, planEditMode, draftLibraryBySlotId)
      );
    }
    return m;
  }, [slotsByDay, planEditMode, draftLibraryBySlotId]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(
      MealCookingInstructionsDialog,
      {
        open: libraryMealModalItem !== null,
        onOpenChange: (open) => {
          if (!open) setLibraryMealModalItem(null);
        },
        item: libraryMealModalItem,
        onEditRecipe: (item) => {
          setLibraryMealModalItem(null);
          setLibraryEditItem(item);
        }
      }
    ),
    /* @__PURE__ */ jsx(
      LibraryMealDialog,
      {
        open: libraryEditItem !== null,
        onOpenChange: (open) => {
          if (!open) setLibraryEditItem(null);
        },
        mode: "edit",
        item: libraryEditItem ?? void 0,
        createFormKey: 0
      }
    ),
    showWeekNav ? /* @__PURE__ */ jsxs("div", { className: "flex items-stretch justify-between gap-2", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/app/nutrition/plan",
          search: { week: prevWeek },
          className: cn(
            "border-border bg-background ring-offset-background hover:bg-muted inline-flex min-h-[3.25rem] min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          ),
          children: [
            /* @__PURE__ */ jsx(ChevronLeft, { className: "size-5 shrink-0 sm:size-4", "aria-hidden": true }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: "Prev week" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("p", { className: "text-foreground flex min-h-[3.25rem] min-w-0 max-w-[46%] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center sm:max-w-none", children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm", children: [
          /* @__PURE__ */ jsx(CalendarRange, { className: "text-primary size-4 shrink-0", "aria-hidden": true }),
          /* @__PURE__ */ jsx("span", { className: "truncate leading-tight", children: weekRangeLabel(weekStartDayKey) })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-[0.65rem] font-normal", children: "Week starts Monday" })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/app/nutrition/plan",
          search: { week: nextWeek },
          className: cn(
            "border-border bg-background ring-offset-background hover:bg-muted inline-flex min-h-[3.25rem] min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          ),
          children: [
            /* @__PURE__ */ jsx("span", { className: "truncate", children: "Next week" }),
            /* @__PURE__ */ jsx(ChevronRight, { className: "size-5 shrink-0 sm:size-4", "aria-hidden": true })
          ]
        }
      )
    ] }) : null,
    showThisWeekHeader ? /* @__PURE__ */ jsx(
      Card,
      {
        size: "sm",
        className: "border-primary/15 overflow-hidden",
        children: /* @__PURE__ */ jsxs(
          CardHeader,
          {
            className: cn(
              "flex flex-col gap-3 pb-0 sm:flex-row sm:items-center sm:gap-4",
              showThisWeekHeader ? "sm:justify-between" : "items-end sm:justify-end"
            ),
            children: [
              /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl", children: [
                /* @__PURE__ */ jsx(ShoppingBasket, { className: "text-primary size-6 shrink-0 sm:size-7", "aria-hidden": true }),
                "This week"
              ] }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: cn(
                    "flex flex-wrap items-center gap-2 sm:justify-end sm:self-auto",
                    showThisWeekHeader ? "self-start" : "self-end"
                  ),
                  children: [
                    planEditMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsxs(
                        Button,
                        {
                          type: "button",
                          variant: "default",
                          size: "sm",
                          className: "touch-manipulation shrink-0 gap-1.5",
                          disabled: pending || !isPlanDirty,
                          onClick: () => {
                            const assignments = plan.slots.map((s) => ({
                              slotId: s.id,
                              libraryItemId: assignmentFromDraft(s, draftLibraryBySlotId)
                            }));
                            startTransition(async () => {
                              try {
                                await saveMealPlanLibraryAssignments(
                                  plan.id,
                                  assignments
                                );
                                setPlanEditMode(false);
                              } catch (e) {
                                toast.error(
                                  e instanceof Error ? e.message : "Could not save the meal plan."
                                );
                              }
                            });
                          },
                          children: [
                            /* @__PURE__ */ jsx(Check, { className: "size-4", "aria-hidden": true }),
                            "Save plan"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          className: "touch-manipulation shrink-0",
                          disabled: pending,
                          onClick: () => {
                            setPlanEditMode(false);
                            setLibraryEditItem(null);
                          },
                          children: "Cancel"
                        }
                      )
                    ] }) : /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        className: "touch-manipulation shrink-0 gap-1.5",
                        disabled: pending,
                        onClick: () => {
                          setDraftLibraryBySlotId(
                            Object.fromEntries(
                              plan.slots.map((s) => [s.id, s.libraryItemId])
                            )
                          );
                          setPlanEditMode(true);
                        },
                        children: [
                          /* @__PURE__ */ jsx(Pencil, { className: "size-4", "aria-hidden": true }),
                          "Edit plan"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        className: "touch-manipulation shrink-0 gap-1.5",
                        disabled: allAccordionDaysOpen(openDayValues),
                        onClick: () => setOpenDayValues(ALL_DAY_ACCORDION_VALUES),
                        children: [
                          /* @__PURE__ */ jsx(ChevronsUpDown, { className: "size-4", "aria-hidden": true }),
                          "Expand all"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        className: "touch-manipulation shrink-0 gap-1.5",
                        disabled: openDayValues.length === 0,
                        onClick: () => setOpenDayValues([]),
                        children: [
                          /* @__PURE__ */ jsx(ChevronsDownUp, { className: "size-4", "aria-hidden": true }),
                          "Collapse all"
                        ]
                      }
                    )
                  ]
                }
              )
            ]
          }
        )
      }
    ) : null,
    /* @__PURE__ */ jsx(
      Accordion,
      {
        type: "multiple",
        value: openDayValues,
        onValueChange: setOpenDayValues,
        className: "space-y-4",
        children: Array.from({ length: 7 }, (_, dayIndex) => {
          const daySlots = slotsByDay.get(dayIndex) ?? [];
          const dayTotals = dayMacroTotals.get(dayIndex) ?? {
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0
          };
          const mainMealCountForDay = plan.slots.filter(
            (s) => Math.trunc(Number(s.dayIndex)) === dayIndex && s.slotKind !== "snack"
          ).length;
          const snackCountForDay = plan.slots.filter(
            (s) => Math.trunc(Number(s.dayIndex)) === dayIndex && s.slotKind === "snack"
          ).length;
          const atMealCap = mainMealCountForDay >= MAX_MEAL_SLOTS_PER_DAY;
          const atSnackCap = snackCountForDay >= MAX_SNACK_SLOTS_PER_DAY;
          return /* @__PURE__ */ jsxs(
            AccordionItem,
            {
              value: `day-${dayIndex}`,
              className: "border-border/80 bg-card rounded-2xl border",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    AccordionTrigger,
                    {
                      className: cn(
                        "text-foreground hover:bg-muted/60 flex w-full items-center justify-between gap-2 rounded-t-2xl px-3 py-4 text-left hover:no-underline sm:gap-3 sm:px-4",
                        "min-h-[3.75rem] touch-manipulation sm:min-h-[4rem] sm:py-5",
                        "data-[state=open]:bg-muted/40"
                      ),
                      children: /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className: cn(
                            "flex min-w-0 flex-1 items-center justify-between gap-2 sm:gap-4",
                            planEditMode && "pe-20 sm:pe-36"
                          ),
                          children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 min-h-0 flex-1 items-start gap-3", children: [
                              /* @__PURE__ */ jsx(MealPlanDayIcon, { className: "text-foreground mt-0.5 size-5 shrink-0 self-start sm:size-[1.35rem]" }),
                              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 text-left", children: [
                                /* @__PURE__ */ jsx("div", { className: "text-foreground truncate text-sm font-semibold sm:text-base", children: dayHeading(weekStartDayKey, dayIndex) }),
                                /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground text-xs tabular-nums sm:text-sm", children: [
                                  daySlots.length,
                                  " ",
                                  daySlots.length === 1 ? "meal" : "meals"
                                ] })
                              ] })
                            ] }),
                            daySlots.length > 0 ? /* @__PURE__ */ jsxs(
                              "div",
                              {
                                className: "w-auto max-w-[min(20rem,48vw)] shrink-0 text-right sm:max-w-[min(24rem,46%)]",
                                role: "status",
                                "aria-label": `${dayHeading(weekStartDayKey, dayIndex)}: day total macros for planned meals`,
                                children: [
                                  /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-0.5 text-[0.65rem] font-medium sm:text-xs", children: "Day total" }),
                                  /* @__PURE__ */ jsx(
                                    MacroStrip,
                                    {
                                      calories: dayTotals.calories,
                                      proteinG: dayTotals.proteinG,
                                      carbsG: dayTotals.carbsG,
                                      fatG: dayTotals.fatG,
                                      className: "mt-0 justify-end"
                                    }
                                  )
                                ]
                              }
                            ) : null
                          ]
                        }
                      )
                    }
                  ),
                  planEditMode ? /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "pointer-events-none absolute top-3 right-10 z-10 flex gap-2 sm:right-11 sm:top-4",
                      children: /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className: "pointer-events-auto flex flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2",
                          onPointerDown: (e) => e.stopPropagation(),
                          onClick: (e) => e.stopPropagation(),
                          onKeyDown: (e) => e.stopPropagation(),
                          children: [
                            /* @__PURE__ */ jsxs(
                              Button,
                              {
                                type: "button",
                                variant: "outline",
                                size: "sm",
                                className: "touch-manipulation gap-1.5",
                                disabled: pending || libraryOptions.length === 0 || atMealCap,
                                title: atMealCap ? `Up to ${MAX_MEAL_SLOTS_PER_DAY} main meals per day` : "Add a meal slot (after breakfast, before dinner)",
                                onClick: () => {
                                  startTransition(async () => {
                                    try {
                                      await addMealPlanSlot(
                                        weekStartDayKey,
                                        dayIndex,
                                        "meal"
                                      );
                                    } catch (e) {
                                      toast.error(
                                        e instanceof Error ? e.message : "Could not add meal"
                                      );
                                    }
                                  });
                                },
                                children: [
                                  /* @__PURE__ */ jsx(Plus, { className: "size-4", "aria-hidden": true }),
                                  /* @__PURE__ */ jsx(UtensilsCrossed, { className: "size-4", "aria-hidden": true }),
                                  "Add meal"
                                ]
                              }
                            ),
                            /* @__PURE__ */ jsxs(
                              Button,
                              {
                                type: "button",
                                variant: "secondary",
                                size: "sm",
                                className: "touch-manipulation gap-1.5",
                                disabled: pending || libraryOptions.length === 0 || atSnackCap,
                                title: atSnackCap ? `Up to ${MAX_SNACK_SLOTS_PER_DAY} snacks per day` : "Add a snack slot",
                                onClick: () => {
                                  startTransition(async () => {
                                    try {
                                      await addMealPlanSlot(
                                        weekStartDayKey,
                                        dayIndex,
                                        "snack"
                                      );
                                    } catch (e) {
                                      toast.error(
                                        e instanceof Error ? e.message : "Could not add snack"
                                      );
                                    }
                                  });
                                },
                                children: [
                                  /* @__PURE__ */ jsx(Plus, { className: "size-4", "aria-hidden": true }),
                                  /* @__PURE__ */ jsx(Cookie, { className: "size-4", "aria-hidden": true }),
                                  "Add snack"
                                ]
                              }
                            )
                          ]
                        }
                      )
                    }
                  ) : null
                ] }),
                /* @__PURE__ */ jsx(AccordionContent, { className: "px-4 pb-4 pt-2 sm:px-5", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "flex min-h-0 w-full min-w-0 flex-col gap-3 pt-1 [scrollbar-gutter:stable]",
                    children: daySlots.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground w-full min-w-0 text-sm", children: planEditMode ? "No slots — add a meal or snack above." : "No slots — use Edit plan to add meals or snacks." }) : daySlots.map((slot) => {
                      const isSnackSlot = slot.slotKind === "snack";
                      const canRemove = isSnackSlot || mainMealCountForDay > 3;
                      const draftLibId = planEditMode ? assignmentFromDraft(slot, draftLibraryBySlotId) : slot.libraryItemId;
                      const macroSource = draftLibId === slot.libraryItemId ? slot.libraryItem : null;
                      return /* @__PURE__ */ jsx(
                        "div",
                        {
                          onClick: (e) => {
                            if (e.target.closest(
                              "[data-meal-slot-no-bubble]"
                            )) {
                              return;
                            }
                            if (planEditMode) return;
                            if (slot.libraryItem) {
                              setLibraryMealModalItem(slot.libraryItem);
                            }
                          },
                          className: cn(
                            "border-border/60 bg-background/50 flex w-full min-w-0 flex-col rounded-lg border p-3 text-left transition-colors",
                            !planEditMode && slot.libraryItem && "cursor-pointer hover:border-primary/30 hover:bg-primary/[0.04]"
                          ),
                          children: /* @__PURE__ */ jsxs("div", { className: "flex w-full min-w-0 flex-col gap-2", children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex w-full min-w-0 items-start gap-2.5", children: [
                              /* @__PURE__ */ jsx(
                                "div",
                                {
                                  className: "bg-muted/70 flex size-10 shrink-0 items-center justify-center rounded-lg",
                                  "aria-hidden": true,
                                  children: /* @__PURE__ */ jsx(MealSlotTypeIcon, { label: slot.label })
                                }
                              ),
                              /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 items-start justify-between gap-1 pt-0.5", children: [
                                /* @__PURE__ */ jsx("span", { className: "text-foreground line-clamp-2 text-left text-sm font-semibold", children: slot.label }),
                                canRemove && planEditMode ? /* @__PURE__ */ jsx(
                                  Button,
                                  {
                                    type: "button",
                                    variant: "ghost",
                                    size: "icon",
                                    "data-meal-slot-no-bubble": true,
                                    className: "text-muted-foreground hover:text-destructive relative z-20 -mr-1 size-8 shrink-0",
                                    disabled: removingSlotId === slot.id,
                                    title: "Remove this slot",
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      const id = slot.id;
                                      setRemovingSlotId(id);
                                      startTransition(async () => {
                                        try {
                                          await removeMealPlanSlot(id);
                                        } catch (e2) {
                                          toast.error(
                                            e2 instanceof Error ? e2.message : "Could not remove this slot."
                                          );
                                        } finally {
                                          setRemovingSlotId(null);
                                        }
                                      });
                                    },
                                    children: /* @__PURE__ */ jsx(Trash2, { className: "size-4", "aria-hidden": true })
                                  }
                                ) : !planEditMode && slot.libraryItem ? /* @__PURE__ */ jsx(
                                  "div",
                                  {
                                    className: "text-muted-foreground/70 -mr-0.5 flex shrink-0",
                                    "aria-hidden": true,
                                    children: /* @__PURE__ */ jsx(
                                      ChevronRight,
                                      {
                                        className: "size-4",
                                        strokeWidth: 2.25
                                      }
                                    )
                                  }
                                ) : null
                              ] })
                            ] }),
                            /* @__PURE__ */ jsx("div", { className: "w-full min-w-0 pl-0 sm:pl-0", children: planEditMode ? /* @__PURE__ */ jsxs(
                              "div",
                              {
                                "data-meal-slot-no-bubble": true,
                                className: "space-y-2",
                                children: [
                                  /* @__PURE__ */ jsx(
                                    LibraryMealPicker,
                                    {
                                      label: `${slot.label} — planned meal`,
                                      options: libraryOptions,
                                      value: draftLibId,
                                      disabled: pending || libraryOptions.length === 0,
                                      onSelect: (lib) => {
                                        setDraftLibraryBySlotId((d) => ({
                                          ...d,
                                          [slot.id]: lib
                                        }));
                                      }
                                    }
                                  ),
                                  macroSource ? /* @__PURE__ */ jsx(
                                    MacroStrip,
                                    {
                                      calories: macroSource.calories,
                                      proteinG: macroSource.proteinG,
                                      carbsG: macroSource.carbsG,
                                      fatG: macroSource.fatG,
                                      className: "mt-0"
                                    }
                                  ) : draftLibId ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Save the plan to refresh macros for this meal." }) : null
                                ]
                              }
                            ) : /* @__PURE__ */ jsxs(Fragment, { children: [
                              /* @__PURE__ */ jsx(
                                "p",
                                {
                                  className: cn(
                                    "line-clamp-2 text-left text-sm leading-snug",
                                    slot.libraryItem ? "text-foreground font-medium" : "text-muted-foreground"
                                  ),
                                  children: slot.libraryItem?.name ?? "No meal assigned"
                                }
                              ),
                              slot.libraryItem ? /* @__PURE__ */ jsx(
                                MacroStrip,
                                {
                                  calories: slot.libraryItem.calories,
                                  proteinG: slot.libraryItem.proteinG,
                                  carbsG: slot.libraryItem.carbsG,
                                  fatG: slot.libraryItem.fatG,
                                  className: "mt-0"
                                }
                              ) : null
                            ] }) })
                          ] })
                        },
                        slot.id
                      );
                    })
                  }
                ) })
              ]
            },
            dayIndex
          );
        })
      }
    )
  ] });
}
function buildMealPlanBoardView(plan, slots, itemsById) {
  const labelById = computeMealPlanSlotLabels(
    slots.map((s) => ({
      id: s.id,
      dayIndex: s.dayIndex,
      slotIndex: s.slotIndex,
      label: s.label,
      slotKind: s.slotKind
    }))
  );
  const outSlots = slots.map((s) => {
    const lib = s.libraryItemId ? itemsById.get(s.libraryItemId) : void 0;
    return {
      id: s.id,
      dayIndex: s.dayIndex,
      slotIndex: s.slotIndex,
      slotKind: s.slotKind === "snack" ? "snack" : "meal",
      label: labelById.get(s.id) ?? s.label,
      libraryItemId: s.libraryItemId,
      libraryItem: lib != null ? toMealLibraryItemJson(lib.item, lib.ingredients) : null
    };
  });
  return {
    id: plan.id,
    weekStartDayKey: plan.weekStartDayKey,
    slots: outSlots
  };
}
export {
  Accordion as A,
  MealPlanBoard as M,
  ShoppingSectionIcon as S,
  AccordionItem as a,
  AccordionTrigger as b,
  AccordionContent as c,
  buildMealPlanBoardView as d
};
