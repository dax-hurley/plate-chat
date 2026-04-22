"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Beef,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Coffee,
  Cookie,
  Droplets,
  Flame,
  Pencil,
  Plus,
  Sandwich,
  ShoppingBasket,
  Trash2,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { addDaysKey, parseDayKey } from "@/lib/date-key";
import { MealPlanDayIcon } from "@/lib/shopping-list-section-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MealLibraryItemJson } from "@/types/meal-library";
import type {
  MealPlanBoardViewJson,
  MealPlanLibraryOption,
} from "@/types/meal-plan";

import {
  actionAddMealPlanSlot,
  actionRemoveMealPlanSlot,
  actionSaveMealPlanLibraryAssignments,
} from "../meal-planning-actions";

import { LibraryMealDialog } from "../library/library-meal-dialog";
import { MealCookingInstructionsDialog } from "./meal-cooking-instructions-dialog";
import { LibraryMealPicker } from "./library-meal-picker";

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DEFAULT_DAY_ACCORDION = [
  "day-0",
  "day-1",
  "day-2",
  "day-3",
  "day-4",
  "day-5",
  "day-6",
] as const;

const ALL_DAY_ACCORDION_VALUES = [...DEFAULT_DAY_ACCORDION];

function allAccordionDaysOpen(values: string[]) {
  return (
    values.length === ALL_DAY_ACCORDION_VALUES.length &&
    ALL_DAY_ACCORDION_VALUES.every((v) => values.includes(v))
  );
}

function dayHeading(weekStart: string, dayIndex: number) {
  const key = addDaysKey(weekStart, dayIndex);
  const d = parseDayKey(key);
  const datePart =
    d?.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }) ?? key;
  return `${SHORT_DAYS[dayIndex]} · ${datePart}`;
}

function weekRangeLabel(weekStart: string) {
  const a = parseDayKey(weekStart);
  const b = parseDayKey(addDaysKey(weekStart, 6));
  if (!a || !b) return weekStart;
  const y = a.getFullYear();
  const sameYear = y === b.getFullYear();
  const left = a.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const right = b.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${left} – ${right}`;
}

function MealSlotTypeIcon({ label }: { label: string }) {
  const l = label.trim();
  if (/^Snack\b/i.test(l)) {
    return <Cookie className="text-amber-600 dark:text-amber-500 size-5" aria-hidden />;
  }
  if (l === "Breakfast") {
    return <Coffee className="text-chart-4 size-5" aria-hidden />;
  }
  if (l === "Dinner") {
    return <UtensilsCrossed className="text-chart-2 size-5" aria-hidden />;
  }
  if (l === "Lunch" || l.startsWith("Lunch ")) {
    return <Sandwich className="text-chart-1 size-5" aria-hidden />;
  }
  return <UtensilsCrossed className="text-muted-foreground size-5" aria-hidden />;
}

function MacroStrip({
  calories,
  proteinG,
  carbsG,
  fatG,
  className,
}: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Flame className="text-chart-2 size-3.5" aria-hidden />
        {calories} cal
      </span>
      <span className="inline-flex items-center gap-1">
        <Beef className="text-chart-1 size-3.5" aria-hidden />
        {proteinG.toFixed(0)}g P
      </span>
      <span className="inline-flex items-center gap-1">
        <Wheat className="text-chart-4 size-3.5" aria-hidden />
        {carbsG.toFixed(0)}g C
      </span>
      <span className="inline-flex items-center gap-1">
        <Droplets className="text-chart-3 size-3.5" aria-hidden />
        {fatG.toFixed(0)}g F
      </span>
    </div>
  );
}

function assignmentFromDraft(
  slot: MealPlanBoardViewJson["slots"][number],
  draft: Record<string, string | null | undefined>
): string | null {
  return Object.prototype.hasOwnProperty.call(draft, slot.id)
    ? (draft[slot.id] as string | null)
    : slot.libraryItemId;
}

export function MealPlanBoard({
  weekStartDayKey,
  plan,
  libraryOptions,
}: {
  weekStartDayKey: string;
  plan: MealPlanBoardViewJson;
  libraryOptions: MealPlanLibraryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removingSlotId, setRemovingSlotId] = useState<string | null>(null);
  const [openDayValues, setOpenDayValues] = useState<string[]>(() => [
    ...DEFAULT_DAY_ACCORDION,
  ]);
  const [libraryMealModalItem, setLibraryMealModalItem] =
    useState<MealLibraryItemJson | null>(null);
  const [libraryEditItem, setLibraryEditItem] =
    useState<MealLibraryItemJson | null>(null);
  const [planEditMode, setPlanEditMode] = useState(false);
  const [draftLibraryBySlotId, setDraftLibraryBySlotId] = useState<
    Record<string, string | null>
  >({});

  const slotIdsKey = useMemo(
    () =>
      [...plan.slots]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((s) => s.id)
        .join(),
    [plan.slots]
  );

  useEffect(() => {
    if (!planEditMode) return;
    setDraftLibraryBySlotId((prev) => {
      const next: Record<string, string | null> = {};
      for (const s of plan.slots) {
        next[s.id] = Object.prototype.hasOwnProperty.call(prev, s.id)
          ? prev[s.id]!
          : s.libraryItemId;
      }
      return next;
    });
  }, [planEditMode, slotIdsKey, plan.slots]);

  const isPlanDirty = useMemo(
    () =>
      planEditMode &&
      plan.slots.some(
        (s) => assignmentFromDraft(s, draftLibraryBySlotId) !== s.libraryItemId
      ),
    [planEditMode, plan.slots, draftLibraryBySlotId]
  );

  const prevWeek = addDaysKey(weekStartDayKey, -7);
  const nextWeek = addDaysKey(weekStartDayKey, 7);

  const slotsByDay = useMemo(() => {
    const m = new Map<number, MealPlanBoardViewJson["slots"]>();
    for (const s of plan.slots) {
      if (!m.has(s.dayIndex)) m.set(s.dayIndex, []);
      m.get(s.dayIndex)!.push(s);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.slotIndex - b.slotIndex);
    }
    return m;
  }, [plan.slots]);

  return (
    <div className="space-y-4">
      <MealCookingInstructionsDialog
        open={libraryMealModalItem !== null}
        onOpenChange={(open) => {
          if (!open) setLibraryMealModalItem(null);
        }}
        item={libraryMealModalItem}
        onEditRecipe={(item) => {
          setLibraryMealModalItem(null);
          setLibraryEditItem(item);
        }}
      />
      <LibraryMealDialog
        open={libraryEditItem !== null}
        onOpenChange={(open) => {
          if (!open) setLibraryEditItem(null);
        }}
        mode="edit"
        item={libraryEditItem ?? undefined}
        createFormKey={0}
      />
      <div className="flex items-stretch justify-between gap-2">
        <Link
          href={`/app/nutrition/plan?week=${encodeURIComponent(prevWeek)}`}
          className={cn(
            "border-border bg-background ring-offset-background hover:bg-muted inline-flex min-h-[3.25rem] min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
        >
          <ChevronLeft className="size-5 shrink-0 sm:size-4" aria-hidden />
          <span className="truncate">Prev week</span>
        </Link>
        <p className="text-foreground flex min-h-[3.25rem] min-w-0 max-w-[46%] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center sm:max-w-none">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
            <CalendarRange className="text-primary size-4 shrink-0" aria-hidden />
            <span className="truncate leading-tight">{weekRangeLabel(weekStartDayKey)}</span>
          </span>
          <span className="text-muted-foreground text-[0.65rem] font-normal">
            Week starts Monday
          </span>
        </p>
        <Link
          href={`/app/nutrition/plan?week=${encodeURIComponent(nextWeek)}`}
          className={cn(
            "border-border bg-background ring-offset-background hover:bg-muted inline-flex min-h-[3.25rem] min-w-0 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
        >
          <span className="truncate">Next week</span>
          <ChevronRight className="size-5 shrink-0 sm:size-4" aria-hidden />
        </Link>
      </div>

      <Card
        size="sm"
        className="border-primary/15 overflow-hidden"
      >
        <CardHeader className="flex flex-col gap-3 pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <CardTitle className="flex items-center gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl">
            <ShoppingBasket className="text-primary size-6 shrink-0 sm:size-7" aria-hidden />
            This week
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {planEditMode ? (
              <>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="touch-manipulation shrink-0 gap-1.5"
                  disabled={pending || !isPlanDirty}
                  onClick={() => {
                    const assignments = plan.slots.map((s) => ({
                      slotId: s.id,
                      libraryItemId: assignmentFromDraft(s, draftLibraryBySlotId),
                    }));
                    startTransition(async () => {
                      const res = await actionSaveMealPlanLibraryAssignments(
                        plan.id,
                        assignments
                      );
                      if (!res.ok) {
                        toast.error(res.error);
                        return;
                      }
                      setPlanEditMode(false);
                      router.refresh();
                    });
                  }}
                >
                  <Check className="size-4" aria-hidden />
                  Save plan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="touch-manipulation shrink-0"
                  disabled={pending}
                  onClick={() => {
                    setPlanEditMode(false);
                    setLibraryEditItem(null);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-manipulation shrink-0 gap-1.5"
                disabled={pending}
                onClick={() => {
                  setDraftLibraryBySlotId(
                    Object.fromEntries(
                      plan.slots.map((s) => [s.id, s.libraryItemId])
                    )
                  );
                  setPlanEditMode(true);
                }}
              >
                <Pencil className="size-4" aria-hidden />
                Edit plan
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="touch-manipulation shrink-0 gap-1.5"
              disabled={allAccordionDaysOpen(openDayValues)}
              onClick={() => setOpenDayValues(ALL_DAY_ACCORDION_VALUES)}
            >
              <ChevronsUpDown className="size-4" aria-hidden />
              Expand all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="touch-manipulation shrink-0 gap-1.5"
              disabled={openDayValues.length === 0}
              onClick={() => setOpenDayValues([])}
            >
              <ChevronsDownUp className="size-4" aria-hidden />
              Collapse all
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Accordion
        type="multiple"
        value={openDayValues}
        onValueChange={setOpenDayValues}
        className="space-y-4"
      >
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const daySlots = slotsByDay.get(dayIndex) ?? [];
              return (
                <AccordionItem
                  key={dayIndex}
                  value={`day-${dayIndex}`}
                  className="border-border/80 bg-card rounded-2xl border"
                >
                  <div className="relative">
                    <AccordionTrigger
                      className={cn(
                        "text-foreground hover:bg-muted/60 flex w-full items-center justify-between gap-3 rounded-t-2xl px-3 py-4 text-left hover:no-underline sm:px-4",
                        "min-h-[3.75rem] touch-manipulation sm:min-h-[4rem] sm:py-5",
                        "data-[state=open]:bg-muted/40"
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <MealPlanDayIcon className="size-5 shrink-0 sm:size-[1.35rem]" />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="text-foreground truncate text-sm font-semibold sm:text-base">
                            {dayHeading(weekStartDayKey, dayIndex)}
                          </div>
                          <div className="text-muted-foreground text-xs tabular-nums sm:text-sm">
                            {daySlots.length}{" "}
                            {daySlots.length === 1 ? "meal" : "meals"}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    {planEditMode ? (
                      <div
                        className="pointer-events-none absolute top-1/2 right-10 z-10 flex -translate-y-1/2 gap-2 sm:right-11"
                      >
                        <div
                          className="pointer-events-auto flex flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="touch-manipulation gap-1"
                            disabled={pending || libraryOptions.length === 0}
                            onClick={() => {
                              startTransition(async () => {
                                await actionAddMealPlanSlot(
                                  weekStartDayKey,
                                  dayIndex,
                                  "meal"
                                );
                                router.refresh();
                              });
                            }}
                          >
                            <Plus className="size-4" aria-hidden />
                            Add meal
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="touch-manipulation gap-1"
                            disabled={pending || libraryOptions.length === 0}
                            onClick={() => {
                              startTransition(async () => {
                                await actionAddMealPlanSlot(
                                  weekStartDayKey,
                                  dayIndex,
                                  "snack"
                                );
                                router.refresh();
                              });
                            }}
                          >
                            <Cookie className="size-4" aria-hidden />
                            Add snack
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <AccordionContent className="px-4 pb-4 pt-2 sm:px-5">
                    <div className="space-y-4 pt-1">
                  {daySlots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {planEditMode
                        ? "No slots — add a meal or snack above."
                        : "No slots — use Edit plan to add meals or snacks."}
                    </p>
                  ) : (
                    daySlots.map((slot) => {
                      const canRemove = daySlots.length > 1;
                      const draftLibId = planEditMode
                        ? assignmentFromDraft(slot, draftLibraryBySlotId)
                        : slot.libraryItemId;
                      const macroSource =
                        draftLibId === slot.libraryItemId
                          ? slot.libraryItem
                          : null;

                      return (
                        <div
                          key={slot.id}
                          onClick={(e) => {
                            if (
                              (e.target as HTMLElement).closest(
                                "[data-meal-slot-no-bubble]"
                              )
                            ) {
                              return;
                            }
                            if (planEditMode) return;
                            if (slot.libraryItem) {
                              setLibraryMealModalItem(slot.libraryItem);
                            }
                          }}
                          className={cn(
                            "border-border/60 bg-background/50 rounded-lg border p-3 text-left transition-colors",
                            !planEditMode &&
                              slot.libraryItem &&
                              "cursor-pointer"
                          )}
                        >
                          <div className="flex items-stretch gap-2 sm:gap-3">
                            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                              <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:max-w-[13rem]">
                              <div
                                className="bg-muted/70 flex size-10 shrink-0 items-center justify-center rounded-lg"
                                aria-hidden
                              >
                                <MealSlotTypeIcon label={slot.label} />
                              </div>
                              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 pt-0.5">
                                <span className="text-foreground truncate text-sm font-semibold">
                                  {slot.label}
                                </span>
                                {canRemove && planEditMode ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    data-meal-slot-no-bubble
                                    className="text-muted-foreground hover:text-destructive size-9 shrink-0"
                                    disabled={removingSlotId === slot.id}
                                    title="Remove this slot"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const id = slot.id;
                                      setRemovingSlotId(id);
                                      startTransition(async () => {
                                        try {
                                          await actionRemoveMealPlanSlot(id);
                                          router.refresh();
                                        } catch (e) {
                                          toast.error(
                                            e instanceof Error
                                              ? e.message
                                              : "Could not remove this slot."
                                          );
                                        } finally {
                                          setRemovingSlotId(null);
                                        }
                                      });
                                    }}
                                  >
                                    <Trash2 className="size-4" aria-hidden />
                                  </Button>
                                ) : null}
                              </div>
                              </div>
                              <div className="min-w-0 flex-[2]">
                              {planEditMode ? (
                                <div
                                  data-meal-slot-no-bubble
                                  className="space-y-2"
                                >
                                  <LibraryMealPicker
                                    label={`${slot.label} — planned meal`}
                                    options={libraryOptions}
                                    value={draftLibId}
                                    disabled={
                                      pending || libraryOptions.length === 0
                                    }
                                    onSelect={(lib) => {
                                      setDraftLibraryBySlotId((d) => ({
                                        ...d,
                                        [slot.id]: lib,
                                      }));
                                    }}
                                  />
                                  {macroSource ? (
                                    <MacroStrip
                                      calories={macroSource.calories}
                                      proteinG={macroSource.proteinG}
                                      carbsG={macroSource.carbsG}
                                      fatG={macroSource.fatG}
                                      className="mt-0"
                                    />
                                  ) : draftLibId ? (
                                    <p className="text-muted-foreground text-xs">
                                      Save the plan to refresh macros for this
                                      meal.
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <>
                                  <p
                                    className={cn(
                                      "text-sm leading-snug",
                                      slot.libraryItem
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {slot.libraryItem?.name ??
                                      "No meal assigned"}
                                  </p>
                                  {slot.libraryItem ? (
                                    <MacroStrip
                                      calories={slot.libraryItem.calories}
                                      proteinG={slot.libraryItem.proteinG}
                                      carbsG={slot.libraryItem.carbsG}
                                      fatG={slot.libraryItem.fatG}
                                      className="mt-0"
                                    />
                                  ) : null}
                                </>
                              )}
                              </div>
                            </div>
                            {!planEditMode && slot.libraryItem ? (
                              <div
                                className="text-muted-foreground/70 flex shrink-0 flex-col justify-center"
                                aria-hidden
                              >
                                <ChevronRight
                                  className="size-5"
                                  strokeWidth={2.25}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
      </Accordion>
    </div>
  );
}
